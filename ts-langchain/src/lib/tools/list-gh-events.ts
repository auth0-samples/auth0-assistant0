import { TokenVaultError } from '@auth0/ai/interrupts';
import { getAccessToken } from '../auth0-ai';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

// Helper function to extract meaningful info from event payloads
function getPayloadSummary(eventType: string, payload: any): string {
  switch (eventType) {
    case 'PushEvent':
      return `Pushed ${payload.commits?.length || 0} commit(s)`;
    case 'PullRequestEvent':
      return `${payload.action} pull request: ${payload.pull_request?.title}`;
    case 'IssuesEvent':
      return `${payload.action} issue: ${payload.issue?.title}`;
    case 'CreateEvent':
      return `Created ${payload.ref_type}: ${payload.ref || ''}`;
    case 'WatchEvent':
      return 'Starred repository';
    case 'ForkEvent':
      return 'Forked repository';
    default:
      return eventType;
  }
}

export const listGitHubEventsTool = tool(
  async ({ per_page = 30, page = 1 }) => {
    // Get the access token from Auth0 AI
    const accessToken = await getAccessToken();

    // GitHub SDK - dynamically import to avoid module resolution issues
    const { Octokit, RequestError } = await import('octokit');
    try {
      const octokit = new Octokit({
        auth: accessToken,
      });

      // First get the authenticated user's login
      const { data: user } = await octokit.rest.users.getAuthenticated();

      // Then get their public events
      const { data } = await octokit.rest.activity.listEventsForAuthenticatedUser({
        username: user.login,
        per_page,
        page,
      });

      // Transform the data to include only relevant information
      const formattedEvents = data.map((event: any) => ({
        id: event.id,
        type: event.type,
        created_at: event.created_at,
        repo: {
          name: event.repo?.name || 'Unknown',
          url: event.repo?.url || '',
        },
        actor: {
          login: event.actor?.login || 'Unknown',
          avatar_url: event.actor?.avatar_url || '',
        },
        // Only include a summary of the payload to avoid overwhelming the LLM
        payload_summary: getPayloadSummary(event.type, event.payload),
        public: event.public,
      }));

      return {
        events: formattedEvents,
        total_events: formattedEvents.length,
        page,
        per_page,
      };
    } catch (error) {
      console.log('Error', error);

      if (error instanceof RequestError) {
        if (error.status === 401) {
          throw new TokenVaultError(
            `Authorization required to access your GitHub events. Please connect your GitHub account.`,
          );
        }
        if (error.status === 403) {
          throw new TokenVaultError(
            `Access forbidden. Your GitHub token may not have the required permissions to access events.`,
          );
        }
      }

      throw error;
    }
  },
  {
    name: 'list_github_events',
    description:
      'List recent events for the current authenticated user on GitHub (e.g., commits, pushes, pull requests, issues, etc.)',
    schema: z.object({
      per_page: z
        .number()
        .min(1)
        .max(100)
        .default(30)
        .optional()
        .describe('Number of events to retrieve (1-100, default: 30)'),
      page: z.number().min(1).default(1).optional().describe('Page number for pagination (default: 1)'),
    }),
  },
);

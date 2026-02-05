import { Octokit, RequestError } from 'octokit';
import { TokenVaultError } from '@auth0/ai/interrupts';
import { getAccessToken, withGitHubConnection } from '@/lib/auth0-ai';
import { tool } from 'ai';
import { z } from 'zod';

export const listRepositories = withGitHubConnection(
  tool({
    description: 'List data of all repositories for the current user on GitHub',
    inputSchema: z.object({}),
    execute: async () => {
      // Get the access token from Auth0 AI
      const accessToken = await getAccessToken();

      // GitHub SDK
      try {
        const octokit = new Octokit({
          auth: accessToken,
        });

        const { data } = await octokit.rest.repos.listForAuthenticatedUser({ visibility: 'all' });

        // Return simplified repository data to avoid overwhelming the LLM
        const simplifiedRepos = data.map((repo) => ({
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description,
          private: repo.private,
          html_url: repo.html_url,
          language: repo.language,
          stargazers_count: repo.stargazers_count,
          forks_count: repo.forks_count,
          open_issues_count: repo.open_issues_count,
          updated_at: repo.updated_at,
          created_at: repo.created_at,
        }));

        return {
          total_repositories: simplifiedRepos.length,
          repositories: simplifiedRepos,
        };
      } catch (error) {
        console.log('Error', error);

        if (error instanceof RequestError) {
          if (error.status === 401) {
            throw new TokenVaultError(
              `Authorization required to access your GitHub repositories. Please connect your GitHub account.`,
            );
          }
        }

        throw error;
      }
    },
  }),
);

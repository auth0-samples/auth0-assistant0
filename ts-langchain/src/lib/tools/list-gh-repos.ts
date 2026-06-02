import { TokenVaultError } from '@auth0/ai/interrupts';
import { getAccessToken } from '../auth0-ai';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

export const listRepositoriesTool = tool(
  async () => {
    // Get the access token from Auth0 AI
    const accessToken = await getAccessToken();

    // GitHub SDK - dynamically import to avoid module resolution issues
    const { Octokit, RequestError } = await import('octokit');
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
  {
    name: 'list_repositories',
    description: 'List data of all repositories for the current user on GitHub',
    schema: z.object({}),
  },
);

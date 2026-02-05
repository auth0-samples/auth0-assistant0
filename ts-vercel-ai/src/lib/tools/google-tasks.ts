import { tool } from 'ai';
import { GaxiosError } from 'gaxios';
import { google } from 'googleapis';
import { z } from 'zod';
import { TokenVaultError } from '@auth0/ai/interrupts';

import { getAccessToken, withTasks } from '../auth0-ai';

export const getTasksTool = withTasks(
  tool({
    description: `Get tasks for a given date from the user's Google Tasks`,
    inputSchema: z.object({
      maxResults: z.number().min(1).max(100).optional().describe('Maximum number of tasks to return. Default is 20.'),
      showCompleted: z.boolean().optional().describe('Whether to include completed tasks. Default is true.'),
      showHidden: z.boolean().optional().describe('Whether to include hidden tasks. Default is false.'),
    }),
    execute: async ({ maxResults = 20, showCompleted = true, showHidden = false }) => {
      // Get the access token from Auth0 AI
      const accessToken = await getAccessToken();

      // Google SDK
      try {
        const tasksApi = google.tasks('v1');
        const auth = new google.auth.OAuth2();

        auth.setCredentials({
          access_token: accessToken,
        });

        // Get task lists
        const response = await tasksApi.tasks.list({
          auth,
          tasklist: '@default',
          maxResults,
          showCompleted,
          showHidden,
        });

        const tasks = response.data.items || [];

        return {
          tasksCount: tasks.length,
          tasks: tasks.map((task) => ({
            id: task.id,
            title: task.title || 'No title',
            notes: task.notes,
            status: task.status,
            due: task.due,
            completed: task.completed,
            deleted: task.deleted,
            hidden: task.hidden,
            position: task.position,
            links: task.links,
          })),
        };
      } catch (error) {
        if (error instanceof GaxiosError) {
          if (error.status === 401) {
            throw new TokenVaultError(`Authorization required to access the Token Vault connection.`);
          }
        }

        throw error;
      }
    },
  }),
);

export const createTasksTool = withTasks(
  tool({
    description: `Create a new task in the user's Google Tasks`,
    inputSchema: z.object({
      title: z.string().describe('Title of the task'),
      notes: z.string().optional().describe('Notes or description of the task'),
      due: z.coerce
        .date()
        .optional()
        .describe('Due date of the task in ISO 8601 format (e.g., "2024-12-31"). Time information will be ignored.'),
    }),
    execute: async ({ title, notes, due }) => {
      // Get the access token from Auth0 AI
      const accessToken = await getAccessToken();

      // Google SDK
      try {
        const tasksApi = google.tasks('v1');
        const auth = new google.auth.OAuth2();

        auth.setCredentials({
          access_token: accessToken,
        });

        // Create a new task
        const response = await tasksApi.tasks.insert({
          auth,
          tasklist: '@default',
          requestBody: {
            title,
            notes,
            due: due ? new Date(due).toISOString() : undefined,
          },
        });

        return response.data;
      } catch (error) {
        if (error instanceof GaxiosError) {
          if (error.status === 401) {
            throw new TokenVaultError(`Authorization required to access the Token Vault connection.`);
          }
        }

        throw error;
      }
    },
  }),
);

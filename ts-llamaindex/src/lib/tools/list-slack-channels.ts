import { tool } from 'llamaindex';
import { z } from 'zod';
import { ErrorCode, WebClient } from '@slack/web-api';
import { TokenVaultError } from '@auth0/ai/interrupts';
import { getAccessToken, withSlack } from '../auth0-ai';

export const listSlackChannelsTool = withSlack(
  tool({
    name: 'list_slack_channels',
    description: 'List channels for the current user on Slack',
    parameters: z.object({}),
    execute: async () => {
      // Get the access token from Auth0 AI
      const accessToken = await getAccessToken();

      // Slack SDK
      try {
        const web = new WebClient(accessToken);

        const result = await web.conversations.list({
          exclude_archived: true,
          types: 'public_channel,private_channel',
          limit: 10,
        });

        const channelNames = result.channels?.map((channel) => channel.name) || [];

        return {
          total_channels: channelNames.length,
          channels: channelNames,
        };
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error) {
          if (error.code === ErrorCode.HTTPError) {
            throw new TokenVaultError(`Authorization required to access the Federated Connection`);
          }
        }

        throw error;
      }
    },
  }),
);

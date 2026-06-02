import { tool } from 'llamaindex';
import { z } from 'zod';

import { auth0 } from '../auth0';

export const getUserInfoTool = tool({
  name: 'getUserInfo',
  description: 'Get information about the current logged in user.',
  parameters: z.object({}).describe('No parameters required'),
  execute: async () => {
    const session = await auth0.getSession();
    if (!session) {
      return 'There is no user logged in.';
    }

    const response = await fetch(`https://${process.env.AUTH0_DOMAIN}/userinfo`, {
      headers: {
        Authorization: `Bearer ${session.tokenSet.accessToken}`,
      },
    });

    if (response.ok) {
      return { result: await response.json() };
    }

    return "I couldn't verify your identity";
  },
});

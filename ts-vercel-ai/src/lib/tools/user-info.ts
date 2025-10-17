import { tool } from 'ai';
import { z } from 'zod';

import { auth0 } from '../auth0';

export const getUserInfoTool = tool({
  description: 'Get information about the current logged in user.',
  inputSchema: z.object({}),
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

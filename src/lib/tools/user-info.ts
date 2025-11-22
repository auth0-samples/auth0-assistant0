import { tool } from '@langchain/core/tools';

export const getUserInfoTool = tool(
  async (_input, config?) => {
    // Access credentials from config
    const accessToken = config?.configurable?.langgraph_auth_user?.getRawAccessToken();
    if (!accessToken) {
      return 'There is no user logged in.';
    }

    const response = await fetch(`https://${process.env.AUTH0_DOMAIN}/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.ok) {
      return { result: await response.json() };
    }

    return "I couldn't verify your identity";
  },
  {
    name: 'get_user_info',
    description: 'Get information about the current logged in user.',
  },
);

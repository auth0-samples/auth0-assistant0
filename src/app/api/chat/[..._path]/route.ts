import { initApiPassthrough } from 'langgraph-nextjs-api-passthrough';

import { getAccessToken } from '@/lib/auth0';

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS, runtime } = initApiPassthrough({
  apiUrl: process.env.LANGGRAPH_API_URL,
  baseRoute: 'chat/',
  headers: async () => {
    const accessToken = await getAccessToken();
    return {
      Authorization: `Bearer ${accessToken}`,
    };
  },
  disableWarningLog: true,
});

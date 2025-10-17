import { initApiPassthrough } from 'langgraph-nextjs-api-passthrough';

import { getAccessToken, getUser } from '@/lib/auth0';


export const { GET, POST, PUT, PATCH, DELETE, OPTIONS, runtime } = initApiPassthrough({
  apiUrl: process.env.LANGGRAPH_API_URL,
  baseRoute: 'chat/',
  headers: async () => {
    const accessToken = await getAccessToken();
    return {
      Authorization: `Bearer ${accessToken}`,
    };
  },
  bodyParameters: async (req, body) => {
    if (req.nextUrl.pathname.endsWith('/runs/stream') && req.method === 'POST') {
      return {
        ...body,
        config: {
          configurable: {
            _credentials: {
              user: await getUser(),
            }
          },
        },
      };
    }

    return body;
  },
});

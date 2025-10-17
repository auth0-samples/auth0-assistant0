import { Auth0Client } from '@auth0/nextjs-auth0/server';

export const auth0 = new Auth0Client({
  authorizationParameters: {
    // In v4, the AUTH0_SCOPE and AUTH0_AUDIENCE environment variables are no longer automatically picked up by the SDK.
    // Instead, we need to provide the values explicitly.
    scope: process.env.AUTH0_SCOPE,
    audience: process.env.AUTH0_AUDIENCE,
  },
});

// Get the Access token from Auth0 session
export const getAccessToken = async () => {
  const tokenResult = await auth0.getAccessToken();

  if(!tokenResult || !tokenResult.token) {
    throw new Error("No access token found in Auth0 session");
  }

  return tokenResult.token;
};

export const getUser = async () => {
  const session = await auth0.getSession();
  return session?.user;
};

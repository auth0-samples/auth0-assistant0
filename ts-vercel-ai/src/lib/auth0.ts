import { Auth0Client } from '@auth0/nextjs-auth0/server';

export const auth0 = new Auth0Client({
  enableConnectAccountEndpoint: true,
});

// Get the refresh token from Auth0 session
export const getRefreshToken = async () => {
  const session = await auth0.getSession();
  return session?.tokenSet?.refreshToken;
};

export const getUser = async () => {
  const session = await auth0.getSession();
  return session?.user;
};

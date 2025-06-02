import { Auth0Client } from '@auth0/nextjs-auth0/server';

export const auth0 = new Auth0Client({
    // this is required to get federated access tokens from services like Google
    authorizationParameters: {
      access_type: "offline",
      prompt: "consent",
    },
});

// Get the refresh token from Auth0 session
export const getRefreshToken = async () => {
    const session = await auth0.getSession();
    return session?.tokenSet?.refreshToken;
};

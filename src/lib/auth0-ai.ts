import { Auth0AI, getAccessTokenForConnection } from '@auth0/ai-vercel';

import { getRefreshToken } from './auth0';

// Get the access token for a connection via Auth0
export const getAccessToken = async () => getAccessTokenForConnection();

const auth0AI = new Auth0AI();

// Connection for Google services
export const withGoogleConnection = auth0AI.withTokenForConnection({
  connection: 'google-oauth2',
  scopes: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/calendar.events',
  ],
  refreshToken: getRefreshToken,
  credentialsContext: 'tool-call',
});

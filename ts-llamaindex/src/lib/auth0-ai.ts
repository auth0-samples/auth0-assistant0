import { Auth0AI, getAccessTokenFromTokenVault } from '@auth0/ai-llamaindex';
import { AccessDeniedInterrupt } from '@auth0/ai/interrupts';

import { getRefreshToken, getUser } from './auth0';

// Get the access token for a connection via Auth0
export const getAccessToken = async () => getAccessTokenFromTokenVault();

const auth0AI = new Auth0AI();

// Connection for services
export const withConnection = (connection: string, scopes: string[]) =>
  auth0AI.withTokenVault({
    connection,
    scopes,
    refreshToken: getRefreshToken,
  });

export const withGmailRead = withConnection('google-oauth2', [
  'openid',
  'https://www.googleapis.com/auth/gmail.readonly',
]);

export const withGmailWrite = withConnection('google-oauth2', [
  'openid',
  'https://www.googleapis.com/auth/gmail.compose',
]);

export const withCalendar = withConnection('google-oauth2', [
  'openid',
  'https://www.googleapis.com/auth/calendar.events',
]);

export const withGitHubConnection = withConnection(
  'github',
  // scopes are not supported for GitHub yet. Set required scopes when creating the accompanying GitHub app
  [],
);

export const withSlack = withConnection('sign-in-with-slack', ['channels:read', 'groups:read']);

// CIBA flow for user confirmation
export const withAsyncAuthorization = auth0AI.withAsyncAuthorization({
  userID: async () => {
    const user = await getUser();
    return user?.sub as string;
  },
  bindingMessage: async ({ product, qty }) => `Do you want to buy ${qty} ${product}`,
  scopes: ['openid', 'product:buy'],
  audience: process.env['AUDIENCE']!,

  /**
   * Controls how long the authorization request is valid.
   *
   */
  // requestedExpiry: 301,

  /**
   * The behavior when the authorization request is made.
   *
   * - `block`: The tool execution is blocked until the user completes the authorization.
   * - `interrupt`: The tool execution is interrupted until the user completes the authorization.
   * - a callback: Same as "block" but give access to the auth request and executing logic.
   *
   * Defaults to `interrupt`.
   *
   * When this flag is set to `block`, the execution of the tool awaits
   * until the user approves or rejects the request.
   *
   * Given the asynchronous nature of the CIBA flow, this mode
   * is only useful during development.
   *
   * In practice, the process that is awaiting the user confirmation
   * could crash or timeout before the user approves the request.
   */
  onAuthorizationRequest: async (authReq, creds) => {
    console.log(`An authorization request was sent to your mobile device.`);
    await creds;
    console.log(`Thanks for approving the order.`);
  },

  onUnauthorized: async (e: Error) => {
    if (e instanceof AccessDeniedInterrupt) {
      return 'The user has denied the request';
    }
    return e.message;
  },
});

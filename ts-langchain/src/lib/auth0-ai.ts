import { Auth0AI, getAccessTokenFromTokenVault } from '@auth0/ai-langchain';
import { AccessDeniedInterrupt } from '@auth0/ai/interrupts';
import { SUBJECT_TOKEN_TYPES } from '@auth0/ai';

// Get the access token for a connection via Auth0
export const getAccessToken = async () => getAccessTokenFromTokenVault();

// Note: we use the Custom API Client when using Token Vault connections that access third party services
const auth0AICustomAPI = new Auth0AI({
  auth0: {
    domain: process.env.AUTH0_DOMAIN!,
    // For token exchange with Token Vault, we want to provide the Custom API Client credentials
    clientId: process.env.AUTH0_CUSTOM_API_CLIENT_ID!, // Custom API Client ID for token exchange
    clientSecret: process.env.AUTH0_CUSTOM_API_CLIENT_SECRET!, // Custom API Client secret
  },
});

// Connection for services
export const withConnection = (connection: string, scopes: string[]) =>
  auth0AICustomAPI.withTokenVault({
    connection,
    scopes,
    accessToken: async (_, config) => {
      return config.configurable?.langgraph_auth_user?.getRawAccessToken();
    },
    subjectTokenType: SUBJECT_TOKEN_TYPES.SUBJECT_TYPE_ACCESS_TOKEN,
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

// Async Authorization flow for user confirmation
// Note: you must use a client application that has the CIBA grant type enabled
// in this case, we can use auth0 regular web app client
const auth0AI = new Auth0AI();

export const withAsyncAuthorization = auth0AI.withAsyncAuthorization({
  userID: async (_params, config) => {
    return config?.configurable?._credentials?.user?.sub;
  },
  bindingMessage: async ({ product, qty }) => `Do you want to buy ${qty} ${product}`,
  scopes: ['openid', 'product:buy'],
  audience: process.env['SHOP_API_AUDIENCE']!,
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
    console.error('Error:', e);
    if (e instanceof AccessDeniedInterrupt) {
      return 'The user has denied the request';
    }
    return e.message;
  },
});

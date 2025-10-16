import { Auth0AI, getAccessTokenFromTokenVault } from '@auth0/ai-langchain';
import { AccessDeniedInterrupt } from '@auth0/ai/interrupts';
import { SUBJECT_TOKEN_TYPES } from '@auth0/ai';

// Get the access token for a connection via Auth0
export const getAccessToken = async () => getAccessTokenFromTokenVault();

// Note: we use the Custom API Client when using Token Vault connections that access third party services
const auth0AICustomAPI = new Auth0AI({
  auth0: {
    domain: process.env.AUTH0_DOMAIN!,
    clientId: process.env.AUTH0_CUSTOM_API_CLIENT_ID!,
    clientSecret: process.env.AUTH0_CUSTOM_API_CLIENT_SECRET!,
  },
});

// Connection for Google services
export const withGoogleConnection = (scopes: string[]) =>
  auth0AICustomAPI.withTokenVault({
    connection: 'google-oauth2',
    scopes,
    accessToken: async (_, config) => {
      return config.configurable?.langgraph_auth_user?.getRawAccessToken();
    },
    subjectTokenType: SUBJECT_TOKEN_TYPES.SUBJECT_TYPE_ACCESS_TOKEN,
  });

export const withGmailRead = withGoogleConnection(['https://www.googleapis.com/auth/gmail.readonly']);

export const withGmailWrite = withGoogleConnection(['https://www.googleapis.com/auth/gmail.compose']);

export const withCalendar = withGoogleConnection(['https://www.googleapis.com/auth/calendar.events']);

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
   * Note: setting a requestedExpiry to >= 301 will currently ensure email is used. Otherwise,
   * the default is to use push notification if available.
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
    console.log(`An authorization request was sent to your mobile device or your email.`);
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

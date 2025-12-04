import { Auth0AI, getAccessTokenFromTokenVault } from '@auth0/ai-langchain';
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

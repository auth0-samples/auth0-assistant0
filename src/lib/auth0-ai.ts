import { Auth0AI } from "@auth0/ai-langchain";
import { getAccessTokenForConnection } from "@auth0/ai-langchain";
import { getRefreshToken } from "@/lib/auth0";

// Get the access token for a connection via Auth0
export const getAccessToken = async () => getAccessTokenForConnection();

const auth0AI = new Auth0AI();
console.log('Auth 0 AI: ', auth0AI)
// Connection for Google services
export const withGoogleConnection = auth0AI.withTokenForConnection({
    connection: "google-oauth2",
    scopes: ["https://www.googleapis.com/auth/gmail.readonly"],
    refreshToken: getRefreshToken,
});

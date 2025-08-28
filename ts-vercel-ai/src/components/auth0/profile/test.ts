/**
 * Implementation of [Client Initiated Account Linking](https://auth0.com/docs/manage-users/user-accounts/user-account-linking/user-initiated-account-linking-client-side-implementation)
 * in an Auth0 Action. This action facilitates OIDC Applications to be able to
 * request account linking from the Authorization Server instead of having to perform
 * this in-app.
 *
 * This Action is intended to allow adding additional services, such as Google, Facebook
 * Microsoft, Github etc, to an end user's primary user-account.
 *
 * This Action operates with the model of a primary account, the account the user is currently
 * logged-in as, and a secondary account. An account which will be linked to the primary account.
 * Upon successful linking, the secondary account will be a part of the primary. This is a destructive
 * action.
 *
 *
 * To request account linking the application must send the following parameters
 * - `scope=link_account`, used to determine account linking is required
 * - `id_token_hint`, A valid `id_token` obtained for the client, that belongs to the user on
 *   whose behalf the client initiated account linking is being requested
 * - `requested_connection`, the provider which is requested.
 * - `requested_connection_scope`, OPTIONAL list of scopes that are requested by the provider,
 *    if not present it will leverage the configured scopes in the Dashboard.
 *
 * If you intend to perform custom MFA we recommend using another action prior to this to centralize and
 * enforce those policies. This Action should be treated as a client.
 *
 * Author: Auth0 Product Architecture
 * Date: 2025-03-21
 * License: MIT (https://github.com/auth0/client-initiated-account-linking/blob/main/LICENSE)
 *
 * ## Required Secrets
 *
 *  - `AUTH0_CLIENT_ID` Client ID for Regular Web Applicaton, this action is registered to
 *  - `AUTH0_CLIENT_SECRET` Client Secret for Regular Web Application, this action is registered to
 *  - `ACTION_SECRET` A secret that is unique to this application you can use `uuidgen` or a secure random string
 *
 * ## Optional Secrets and Configuration
 *
 *  - `ALLOWED_CLIENT_IDS` Comma Separated List of all client ids, by default all clients may request when using OIDC
 *  - `DEBUG` `debug` compatible string, this action uses `account-linking:{info,error,verbose}` to differentiate between logs
 *  - `ENFORCE_MFA` - if set to "yes" will require MFA to have been performed on the current session, it will also enforce MFA in the nested
 *     if MFA is not performed but is enrolled on the end-user. Default: "no"
 *  - `ENFORCE_EMAIL_VERIFICATION` - if set to "yes" will require the `primary` account's email is verified. Default: "no"
 *  - `PIN_IP_ADDRESS` - If set to "yes" will require the transaction complete on same IP Address, this can be finnicky for some customers. Default: "no"
 */

// Required Modules
const { ManagementClient, PostIdentitiesRequestProviderEnum } = require('auth0');
const client = require('openid-client');
const jose = require('jose');
const { createHash } = require('node:crypto');
const { URLSearchParams } = require('node:url');
const debug = require('debug');
const { hkdf } = require('@panva/hkdf');

const logger = {
  error: debug('account-linking:error'),
  info: debug('account-linking:info'),
  verbose: debug('account-linking:verbose'),
};

// Global constants
const SCOPES = {
  LINK: 'link_account',
};
const JWKS_CACHE_KEY = 'jwks-cache';
const MGMT_TOKEN_CACHE_KEY = 'management-token';

/**
 * This action should only run for OIDC/OAuth 2 Flows
 * @type {Protocol[]}
 */
const ALLOWED_PROTOCOLS = ['oidc-basic-profile', 'oidc-implicit-profile', 'oauth2-device-code', 'oidc-hybrid-profile'];
// End Global Constants

/**
 * Initial Handler
 *
 * @param {PostLoginEvent} event
 * @param {PostLoginAPI} api
 * @returns
 */
exports.onExecutePostLogin = async (event, api) => {
  normalizeEventConfiguration(event);
  debug.enable(event.configuration.DEBUG || 'account-linking:*');

  try {
    if (isLinkingRequest(event)) {
      const jwksCache = extractCachedJWKS(event, api);
      const response = await validateIdTokenHint(event, api, jwksCache);
      logger.error('validating token hint');
      if (response === 'invalid') {
        logger.error('Denying linking request ID_TOKEN_HINT provided was invalid');
        api.access.deny('ID_TOKEN_HINT Invalid: The `id_token_hint` does not conform to the authorization policy');
        return;
      }
      logger.error('validating MFA');

      if (event.configuration.ENFORCE_MFA === 'yes') {
        if (Array.isArray(event.user.enrolledFactors) && event.user.enrolledFactors.length > 0) {
          if (!event.authentication?.methods?.some((method) => method.name === 'mfa')) {
            logger.info(
              'Denying linking request for %s mfa was not performed in this transaction, a previous action must use .challengeWith, .challengeWithAny',
              event.user.user_id,
            );
            api.access.deny('You must perform MFA for account linking');
            return;
          }
        }
      }
      logger.error('validating Email verification');

      if (event.configuration.ENFORCE_EMAIL_VERIFICATION === 'yes' && event.user.email_verified === false) {
        logger.info('Denying linking request for %s email is not verified', event.user.user_id);
        api.access.deny('Email Verification is required for account linking');
        return;
      }

      return handleLinkingRequest(event, api);
    }

    if (isNestedTransaction(event)) {
      if (event.configuration.ENFORCE_MFA === 'yes') {
        forceMFAForNestedTransaction(event, api);
      }
    }
  } catch (err) {
    logger.error('Unexpected Error, %s', err.toString());
    api.access.deny('Unexpected Error trying to start account linking');
  }
};

/**
 * Callback handler
 *
 * @param {PostLoginEvent} event
 * @param {PostLoginAPI} api
 * @returns
 */
exports.onContinuePostLogin = async (event, api) => {
  normalizeEventConfiguration(event);
  if (isLinkingRequest(event)) {
    return handleLinkingCallback(event, api);
  }
};

/**
 * Check's if this an Account Linking Request
 *
 * @param {PostLoginEvent} event
 */
function normalizeEventConfiguration(event) {
  event.configuration = event.configuration || {};
  // prefer configuration
  event.configuration.DEBUG = event.configuration?.DEBUG || event.secrets?.DEBUG || 'account-linking:error';
  event.configuration.ENFORCE_MFA = event.configuration?.ENFORCE_MFA || event.secrets?.ENFORCE_MFA || 'no';
  event.configuration.ENFORCE_EMAIL_VERIFICATION =
    event.configuration?.ENFORCE_EMAIL_VERIFICATION || event.secrets?.ENFORCE_EMAIL_VERIFICATION || 'no';
  event.configuration.PIN_IP_ADDRESS = event.configuration?.PIN_IP_ADDRESS || event.secrets?.PIN_IP_ADDRESS || 'no';
}

// Helper Utilities

/**
 * Function that detects if we are running within a nested transaction
 * @param {PostLoginEvent} event
 */
function isNestedTransaction(event) {
  const { AUTH0_CLIENT_ID: clientId } = event.secrets;

  if (event.client.client_id === clientId) {
    return true;
  }
}

/**
 * Forces MFA for the nested transaction
 * @param {PostLoginEvent} event
 * @param {PostLoginAPI} api
 */
function forceMFAForNestedTransaction(event, api) {
  if (Array.isArray(event.user.enrolledFactors) && event.user.enrolledFactors.length > 0) {
    api.authentication.challengeWithAny(
      event.user.enrolledFactors.map((factor) =>
        factor.method === 'sms'
          ? {
              type: 'phone',
              options: { preferredMethod: 'sms' },
            }
          : { type: factor.method },
      ),
    );
  }
}

/**
 * Check's if this an Account Linking Request
 *
 * @param {PostLoginEvent} event
 */
function isLinkingRequest(event) {
  if (!event.transaction || !event.transaction.protocol) {
    logger.verbose('Skipping because no transaction');
    return false;
  }

  if (ALLOWED_PROTOCOLS.includes(event.transaction.protocol) === false) {
    logger.verbose('Skipping because protocol not allowed');
    return false;
  }

  const { requested_scopes } = event.transaction;

  if (!Array.isArray(requested_scopes)) {
    logger.verbose('Skipping because requested_scopes not found');
    return false;
  }

  if (!requested_scopes.includes(SCOPES.LINK)) {
    logger.verbose('Skipping because requested_scopes does not contain link_account');
    return false;
  }

  const { ALLOWED_CLIENT_IDS } = event.secrets;

  if (ALLOWED_CLIENT_IDS !== undefined) {
    const allowedClientIds = ALLOWED_CLIENT_IDS.split(',');

    if (allowedClientIds.includes(event.client.client_id) === false) {
      logger.error('Account Linking is not allowed for %s', event.client.client_id);
      return false;
    }
  }

  return true;
}

/**
 *
 * @param {PostLoginEvent} event
 * @param {PostLoginAPI} api
 */
async function handleLinkingRequest(event, api) {
  logger.error('Handling linking request');

  const issuer = getAuth0Issuer(event);

  const { requested_connection: requestedConnection, requested_connection_scope: requestedConnectionScope } =
    event.request.query;

  const codeVerifier = await getUniqueTransaction(event);
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
  const jwksCache = extractCachedJWKS(event, api);
  const config = await getOpenIDClientConfig(event, api, jwksCache);

  logger.error('Generating authorization request for %s provider %s', event.user.user_id, requestedConnection);

  /**
   * @type {Record<string, string>}
   */
  const authorizationParameters = {
    redirect_uri: new URL('/continue', issuer).toString(),
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    connection: requestedConnection,
    scope: 'openid profile email', // this scope is for the auth0 transaction
    max_age: '0',
  };

  if (requestedConnectionScope) {
    // This scope is for the transaction
    authorizationParameters['connection_scope'] = requestedConnectionScope;
  }

  logger.error('Requesting authorization with provider %s', requestedConnection);
  const authorizeUrl = client.buildAuthorizationUrl(config, authorizationParameters);
  logger.error('redirecting user to %s', authorizeUrl);

  api.redirect.sendUserTo(authorizeUrl.toString());
}

/**
 *
 * @param {PostLoginEvent} event
 * @param {PostLoginAPI} api
 */
async function handleLinkingCallback(event, api) {
  const callbackUrl = getCallbackUrl(event);
  const jwksCacheInput = extractCachedJWKS(event, api);
  const config = await getOpenIDClientConfig(event, api, jwksCacheInput);
  const codeVerifier = await getUniqueTransaction(event);
  let subject;

  try {
    logger.info('Attempting callback verification for %s', event.user.user_id);

    const tokens = await client.authorizationCodeGrant(config, callbackUrl, {
      expectedState: client.skipStateCheck,
      idTokenExpected: true,
      maxAge: 60,
      pkceCodeVerifier: codeVerifier,
    });

    const jwksCacheExport = client.getJwksCache(config);
    // Store cached JWTs
    if (jwksCacheExport && jwksCacheExport.uat !== jwksCacheInput?.uat) {
      storeCachedJWKS(event, api, jwksCacheExport);
    }

    const claims = tokens.claims();
    if (!claims) {
      console.warn('Failed: No claims');
      return;
    }

    subject = claims['sub'];
    logger.info('Callback success for %s', event.user.user_id);
  } catch (err) {
    logger.error('Failed to complete account linking for %s: %s', event.user.user_id, err.toString());
    api.access.deny('Failed to complete account linking');
    return;
  }

  return linkAndMakePrimary(event, api, subject);
}

/**
 * Will obtain a cached JWKS from Actions Cache
 *
 * @param {PostLoginEvent} event
 * @param {PostLoginAPI} api
 *
 * @returns {jose.ExportedJWKSCache | undefined} either a cached jwks or null. If this fails it'll fail gracefully
 */
function extractCachedJWKS(event, api) {
  try {
    const cachedJWKCache = api.cache.get(JWKS_CACHE_KEY);
    if (!cachedJWKCache) {
      return undefined;
    }
    /**
     * @type {jose.ExportedJWKSCache}
     */
    const value = JSON.parse(cachedJWKCache.value);
    return value;
  } catch (err) {
    // We should default to return here
    // we can always fetch as fallback
  }
  return undefined;
}

/**
 * Will obtain a cached JWKS from Actions Cache
 *
 * @param {PostLoginEvent} event
 * @param {PostLoginAPI} api
 * @param {jose.ExportedJWKSCache} updated Exported JWKS cache
 */
function storeCachedJWKS(event, api, updated) {
  api.cache.set(JWKS_CACHE_KEY, JSON.stringify(updated));
}

/**
 * Helper function to return a client from openid-client. This is used
 * for all the requests.
 *
 * @param {PostLoginEvent} event
 * @param {PostLoginAPI} api
 * @param {jose.ExportedJWKSCache | undefined} jwksCacheInput
 *
 * @returns {Promise<client.Configuration>}
 */
async function getOpenIDClientConfig(event, api, jwksCacheInput) {
  const issuer = getAuth0Issuer(event);
  const { AUTH0_CLIENT_ID: clientId, AUTH0_CLIENT_SECRET: clientSecret } = event.secrets;
  const config = await client.discovery(issuer, clientId, {}, client.ClientSecretPost(clientSecret), {
    algorithm: 'oidc',
  });

  if (jwksCacheInput !== undefined) {
    client.setJwksCache(config, jwksCacheInput);
  }

  return config;
}

/**
 * returns the callback url
 *
 * @param {PostLoginEvent} event
 * @returns {URL}
 */
function getCallbackUrl(event) {
  const callbackUrl = new URL('/continue', getAuth0Issuer(event));
  callbackUrl.search = new URLSearchParams(event.request.query).toString();

  return callbackUrl;
}

/**
 * This method implements the following logic
 *
 * - Ensure the `id_token_hint` is a valid `id_token`.
 * - Ensure the `client_id` in `id_token` matches the `client_id` of `event`.
 * - Ensure the `id_token` was issued to one of the event.secrets.ALLOWED_CLIENTs
 * - Ensure the `user_id` of the current `event.user` is the same as current user
 *
 *
 * @param {PostLoginEvent} event
 * @param {PostLoginAPI} api
 * @param {jose.ExportedJWKSCache | undefined} jwksCache
 * @returns {Promise<"invalid"|"valid">} `valid` if all constraints match, `invalid` if any constraint fail,
 */
async function validateIdTokenHint(event, api, jwksCache) {
  const { id_token_hint: idTokenHint } = event.request.query;
  const issuer = getAuth0Issuer(event);

  if (!idTokenHint || typeof idTokenHint !== 'string') {
    return 'invalid';
  }

  const { client_id: clientId } = event.client;
  const { user_id: userId } = event.user;

  const jwksUrl = new URL('/.well-known/jwks.json', issuer);
  const JWKS = jose.createRemoteJWKSet(jwksUrl, {
    [jose.jwksCache]: jwksCache,
  });

  try {
    const payload = await jose.jwtVerify(idTokenHint, JWKS, {
      algorithms: ['RS256'],
      audience: clientId,
      subject: userId,
      issuer: issuer.toString(),
      maxTokenAge: '10m',
    });

    return 'valid';
  } catch (err) {
    //
    logger.error('ID_TOKEN_HINT validation failure %s', err.toString());
  }

  return 'invalid';
}

/**
 * Helper function to get a cached management token and client.
 *
 * @param {PostLoginEvent} event
 * @param {PostLoginAPI} api
 * @returns
 */
async function getManagementClient(event, api) {
  let { value: token } = api.cache.get(MGMT_TOKEN_CACHE_KEY) || {};

  if (!token) {
    logger.verbose('Attempting to obtain token for management api');
    // we don't need the JWKS here.
    const config = await getOpenIDClientConfig(event, api, undefined);

    try {
      const tokenset = await client.clientCredentialsGrant(config, {
        audience: new URL('/api/v2/', `https://${event.secrets.AUTH0_DOMAIN}`).toString(),
      });

      const { access_token: accessToken } = tokenset;
      token = accessToken;

      if (!token) {
        logger.error('No access token was returned by the server for Management API');
        return null;
      }

      const result = api.cache.set(MGMT_TOKEN_CACHE_KEY, token, {
        ttl: (tokenset.expires_in - 60) * 1000,
      });

      if (result?.type === 'error') {
        logger.error('failed to set the token in the cache with error code: %s', result.code);
      }
    } catch (err) {
      logger.error('failed calling cc grant %s', err.toString());
      return null;
    }
  }

  logger.info('Created a management api client');

  return new ManagementClient({
    domain: getAuth0Issuer(event).hostname,
    token,
  });
}

/**
 *
 * @param {string} sub
 * @returns {{provider: PostIdentitiesRequestProviderEnum, user_id: string}}
 */
function splitSubClaim(sub) {
  const firstPipeIndex = sub.indexOf('|');
  const provider = /** @type {PostIdentitiesRequestProviderEnum} */ sub.slice(0, firstPipeIndex);

  return {
    provider,
    user_id: sub.slice(firstPipeIndex + 1),
  };
}

/**
 * Returns the current domain for the tenant
 *
 * @param {PostLoginEvent} event
 */
function getAuth0Issuer(event) {
  return new URL(`https://${event.request.hostname}/`);
}

/**
 * In order to determine this transaction can be executed only between the initial
 * and the continue handler. We need to derive a unique string
 *
 * @todo: Once `transaction.id` is stable, us that to derive PKCE
 *
 * @param {PostLoginEvent} event
 */
async function getUniqueTransaction(event) {
  const { ACTION_SECRET: appSecret } = event.secrets;
  const { PIN_IP_ADDRESS: pinIp } = event.configuration;
  // eslint-disable-next-line no-unused-vars
  const { protocol, requested_scopes, response_type, redirect_uri, state, locale } =
    /**{@type {Transaction}} */ event.transaction;
  const { id: sessionId } = event.session || {};
  const stableTransaction = [
    event.user.user_id,
    protocol,
    requested_scopes,
    response_type,
    redirect_uri,
    state,
    locale,
    sessionId,
  ];

  if (pinIp) {
    stableTransaction.push(event.request.ip);
  }

  const transactionInfo = JSON.stringify(stableTransaction);
  const transactionHotfix = sha256(transactionInfo);

  const derivedKey = await hkdf(
    'sha256',
    transactionHotfix, // ikm
    appSecret, // salt
    transactionInfo, // info
    64, // len
  );

  return Buffer.from(derivedKey).toString('base64url');
}

/**
 *
 * @param {PostLoginEvent} event
 * @param {PostLoginAPI} api
 * @param {string} secondaryIdentityUserId
 * @returns
 */
async function linkAndMakePrimary(event, api, secondaryIdentityUserId) {
  const primaryUserId = event.user.user_id;
  logger.info('Attempting account linking for %s with %s', primaryUserId, secondaryIdentityUserId);

  if (primaryUserId === secondaryIdentityUserId) {
    logger.info('Attempting already performed since %s === %s', primaryUserId, secondaryIdentityUserId);
    return;
  }

  const client = await getManagementClient(event, api);

  if (client === null) {
    api.access.deny('Failed to link users');
    return;
  }

  try {
    await client.users.link({ id: primaryUserId }, splitSubClaim(secondaryIdentityUserId));
    logger.info('link successful current user %s to %s', primaryUserId, secondaryIdentityUserId);
    // api.authentication.setPrimaryUser(upstream_sub);
  } catch (err) {
    logger.error(`unable to link, no changes. error: ${JSON.stringify(err)}`);
    return api.access.deny('error linking');
  }
}

/**
 *
 * @param {string} str
 */
function sha256(str) {
  return createHash('sha256').update(str).digest('base64url');
}

// End: Helper Utilities

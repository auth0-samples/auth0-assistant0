import { buildOpenFgaClient } from '@auth0/ai';

/**
 * Initializes the OpenFgaClient, writes an authorization model, and configures pre-defined tuples.
 *
 * This function performs the following steps:
 *    1. Creates an instance of OpenFgaClient with the necessary configuration.
 *    2. Writes an authorization model with specified schema version and type definitions.
 */
async function main() {
  require('dotenv').config({ path: ['.env.local', '.env'] });

  const fgaClient = buildOpenFgaClient();

  const model = await fgaClient.writeAuthorizationModel({
    schema_version: '1.1',
    type_definitions: [
      { type: 'user' },
      {
        type: 'doc',
        metadata: {
          relations: {
            can_view: {},
            owner: { directly_related_user_types: [{ type: 'user' }] },
            viewer: {
              directly_related_user_types: [{ type: 'user' }, { type: 'user', wildcard: {} }],
            },
          },
        },
        relations: {
          can_view: {
            union: {
              child: [{ computedUserset: { relation: 'owner' } }, { computedUserset: { relation: 'viewer' } }],
            },
          },
          owner: { this: {} },
          viewer: { this: {} },
        },
      },
    ],
  });

  console.log('NEW MODEL ID: ', model.authorization_model_id);
}

main().catch(console.error);

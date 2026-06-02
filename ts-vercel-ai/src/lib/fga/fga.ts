import { buildOpenFgaClient } from '@auth0/ai';

export const fgaClient = buildOpenFgaClient();

export const addRelation = async (userEmail: string, documentId: string, relation = 'owner') =>
  fgaClient.write({
    writes: [{ user: `user:${userEmail}`, relation, object: `doc:${documentId}` }],
  });

export const deleteRelation = async (userEmail: string, documentId: string, relation = 'owner') =>
  fgaClient.write({
    deletes: [{ user: `user:${userEmail}`, relation, object: `doc:${documentId}` }],
  });

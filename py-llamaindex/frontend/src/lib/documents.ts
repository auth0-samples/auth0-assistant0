import { apiClient } from "./api-client";

export type Document = {
  id: string;
  fileName: string;
  fileType: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  userEmail: string;
  sharedWith: string[];
};

/**
 * Fetches a list of documents for a given user.
 */
export async function getDocumentsForUser(): Promise<Document[]> {
  const response = await apiClient.get("/api/documents");

  if (response.status !== 200) {
    throw new Error("Failed to fetch documents");
  }

  return response.data.map((doc: any) => ({
    id: doc.id,
    fileName: doc.file_name,
    fileType: doc.file_type,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
    userId: doc.user_id,
    userEmail: doc.user_email,
    sharedWith: doc.shared_with,
  }));
}

/**
 * Fetches the content of a document.
 */
export async function getDocumentContent(documentId: string): Promise<string> {
  const response = await apiClient.get(`/api/documents/${documentId}/content`);
  return response.data;
}

/**
 * Shares a document with a list of email addresses.
 */
export async function shareDocument(
  documentId: string,
  emailAddresses: string[],
): Promise<void> {
  const response = await apiClient.post(`/api/documents/${documentId}/share`, {
    email_addresses: emailAddresses,
  });

  if (response.status !== 200) {
    throw new Error("Failed to share document");
  }
}

/**
 * Deletes a document.
 */
export async function deleteDocument(documentId: string): Promise<void> {
  const response = await apiClient.delete(`/api/documents/${documentId}`);

  if (response.status !== 200) {
    throw new Error("Failed to delete document");
  }
}

import { Toaster } from 'sonner';
import { revalidatePath } from 'next/cache';
import { format } from 'date-fns';
import { ReactNode } from 'react';

import { auth0 } from '@/lib/auth0';
import { getDocumentsForUser } from '@/lib/actions/documents';
import DocumentUploadForm from '@/components/document-upload-form';
import DocumentItemActions from '@/components/document-item-actions';

export default async function DocumentsPage() {
  const session = await auth0.getSession();
  const user = session?.user;

  if (!user) {
    return <p>Please log in to view your documents.</p>;
  }

  // Fetch documents for the current user
  const documents = await getDocumentsForUser();

  // This Server Action will be used for revalidation after any successful document action
  async function handleDocumentActionComplete() {
    'use server';
    console.log('Document action complete, revalidating /documents');
    revalidatePath('/documents');
  }

  function getSharingStatus(sharedWith: string[] | null): ReactNode {
    if (!sharedWith || sharedWith.length === 0) {
      return <span className="text-sm text-muted-foreground">Not shared</span>;
    }
    if (sharedWith.includes(user?.email!)) {
      return <span className="text-sm text-green-500">Shared with you</span>;
    }
    return <span className="text-sm text-blue-500">Shared with: {sharedWith.join(', ')}</span>;
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      {/* Section for Uploading New Documents */}
      <section className="mb-12">
        <div className="p-6 border rounded-lg shadow-sm bg-card text-card-foreground">
          <DocumentUploadForm
            onUploadSuccess={handleDocumentActionComplete}
          />
        </div>
      </section>
      <h1 className="text-2xl font-bold mb-8">My Documents</h1>

      {/* Section for Listing Existing Documents */}
      <section>
        {documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Document cards will be rendered here */}
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-4 border rounded-lg shadow-sm bg-card text-card-foreground flex justify-between items-center"
              >
                <div className="mb-3 sm:mb-0">
                  <h3 className="font-semibold text-lg mb-1">{doc.fileName}</h3>
                  <p className="text-sm text-muted-foreground">Type: {doc.fileType}</p>
                  <p className="text-sm text-muted-foreground">
                    Uploaded: {doc.createdAt ? format(doc.createdAt, 'PPP p') : 'N/A'}
                  </p>
                  <p className="text-sm text-muted-foreground">{getSharingStatus(doc.sharedWith)}</p>
                </div>
                <DocumentItemActions
                  doc={doc}
                  onActionComplete={handleDocumentActionComplete} // Pass the revalidation action
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 border rounded-lg shadow-sm bg-background text-center">
            <p className="text-muted-foreground">
              You haven&apos;t uploaded any documents yet. Use the form above to get started.
            </p>
          </div>
        )}
      </section>
      <Toaster richColors />
    </div>
  );
}

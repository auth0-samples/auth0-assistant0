import { format } from "date-fns";
import { type ReactNode } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import useAuth, { getLoginUrl, getSignupUrl } from "@/lib/use-auth";
import DocumentUploadForm from "@/components/document-upload-form";
import DocumentItemActions from "@/components/document-item-actions";
import { getDocumentsForUser } from "@/lib/documents";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const {
    data: documents,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      return await getDocumentsForUser();
    },
    enabled: !!user,
  });

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] my-auto gap-4">
        <h2 className="text-xl">You are not logged in</h2>
        <div className="flex gap-4">
          <Button asChild variant="default" size="default">
            <a href={getLoginUrl()} className="flex items-center gap-2">
              <LogIn />
              <span>Login</span>
            </a>
          </Button>
          <Button asChild variant="default" size="default">
            <a href={getSignupUrl()} className="flex items-center gap-2">
              <UserPlus />
              <span>Sign up</span>
            </a>
          </Button>
        </div>
      </div>
    );
  }

  if (isError || !documents) {
    return <p>Error loading documents</p>;
  }

  function getSharingStatus(sharedWith: string[] | null): ReactNode {
    if (!sharedWith || sharedWith.length === 0) {
      return <span className="text-sm text-muted-foreground">Not shared</span>;
    }
    if (sharedWith.includes(user?.email!)) {
      return <span className="text-sm text-green-500">Shared with you</span>;
    }
    return (
      <span className="text-sm text-blue-500">
        Shared with: {sharedWith.join(", ")}
      </span>
    );
  }

  function handleDocumentActionComplete() {
    queryClient.invalidateQueries({ queryKey: ["documents"] });
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      {/* Section for Uploading New Documents */}
      <section className="mb-12">
        <div className="p-6 border rounded-lg shadow-sm bg-card text-card-foreground">
          <DocumentUploadForm onUploadSuccess={handleDocumentActionComplete} />
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
                  <p className="text-sm text-muted-foreground">
                    Type: {doc.fileType}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Uploaded:{" "}
                    {doc.createdAt ? format(doc.createdAt, "PPP p") : "N/A"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {getSharingStatus(doc.sharedWith)}
                  </p>
                </div>
                <DocumentItemActions
                  doc={doc}
                  onActionComplete={handleDocumentActionComplete}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 border rounded-lg shadow-sm bg-background text-center">
            <p className="text-muted-foreground">
              You haven&apos;t uploaded any documents yet. Use the form above to
              get started.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

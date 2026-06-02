CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS "embeddings" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"document_id" varchar(191),
	"content" text NOT NULL,
	"file_name" varchar(300) NOT NULL,
	"embedding" vector(1536) NOT NULL
);

--> statement-breakpoint
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "embeddingIndex" ON "embeddings" USING hnsw ("embedding" vector_cosine_ops);
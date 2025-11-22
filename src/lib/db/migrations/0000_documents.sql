CREATE TABLE IF NOT EXISTS "documents" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"content" "bytea" NOT NULL,
	"file_name" varchar(300) NOT NULL,
	"file_type" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" varchar(191) NOT NULL,
	"user_email" varchar(191) NOT NULL,
	"shared_with" varchar(300)[]
);

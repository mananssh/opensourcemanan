CREATE TYPE "public"."vault_category" AS ENUM('identity', 'financial', 'medical', 'legal', 'education', 'work', 'travel', 'other');--> statement-breakpoint
CREATE TABLE "vault_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"category" "vault_category" DEFAULT 'other' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"notes" text,
	"favorite" boolean DEFAULT false NOT NULL,
	"original_filename" text NOT NULL,
	"content_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"storage_key" text NOT NULL,
	"wrapped_key" text NOT NULL,
	"key_iv" text NOT NULL,
	"key_auth_tag" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vault_documents_storageKey_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
CREATE INDEX "vault_documents_category_idx" ON "vault_documents" USING btree ("category");--> statement-breakpoint
CREATE INDEX "vault_documents_created_idx" ON "vault_documents" USING btree ("created_at");
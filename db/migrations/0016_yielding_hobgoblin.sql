ALTER TABLE "vault_documents" ADD COLUMN "categories" "vault_category"[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
UPDATE "vault_documents" SET "categories" = ARRAY["category"];

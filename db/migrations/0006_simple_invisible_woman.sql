CREATE TYPE "public"."comment_status" AS ENUM('visible', 'hidden');--> statement-breakpoint
CREATE TABLE "bookmarks" (
	"post_id" uuid NOT NULL,
	"user_email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookmarks_post_id_user_email_pk" PRIMARY KEY("post_id","user_email")
);
--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "status" "comment_status" DEFAULT 'visible' NOT NULL;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;
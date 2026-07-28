CREATE TYPE "public"."media_type" AS ENUM('movie', 'tv');--> statement-breakpoint
CREATE TYPE "public"."watch_status" AS ENUM('watched', 'watching', 'watchlist');--> statement-breakpoint
CREATE TABLE "movie_cache" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watch_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"viewer_id" uuid NOT NULL,
	"tmdb_id" integer NOT NULL,
	"media_type" "media_type" NOT NULL,
	"title" text NOT NULL,
	"poster_path" text,
	"release_year" integer,
	"runtime_minutes" integer,
	"genres" text[] DEFAULT '{}' NOT NULL,
	"status" "watch_status" DEFAULT 'watched' NOT NULL,
	"rating" smallint,
	"watched_on" date,
	"note" text,
	"favorite" boolean DEFAULT false NOT NULL,
	"rewatches" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watchers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"handle" text NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"bio" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "watchers_email_unique" UNIQUE("email"),
	CONSTRAINT "watchers_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
ALTER TABLE "watch_entries" ADD CONSTRAINT "watch_entries_viewer_id_watchers_id_fk" FOREIGN KEY ("viewer_id") REFERENCES "public"."watchers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "movie_cache_expires_idx" ON "movie_cache" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "watch_entries_viewer_title_idx" ON "watch_entries" USING btree ("viewer_id","tmdb_id","media_type");--> statement-breakpoint
CREATE INDEX "watch_entries_viewer_status_idx" ON "watch_entries" USING btree ("viewer_id","status");--> statement-breakpoint
CREATE INDEX "watch_entries_viewer_watched_idx" ON "watch_entries" USING btree ("viewer_id","watched_on");--> statement-breakpoint
CREATE INDEX "watch_entries_viewer_created_idx" ON "watch_entries" USING btree ("viewer_id","created_at");--> statement-breakpoint
CREATE INDEX "watchers_handle_idx" ON "watchers" USING btree ("handle");
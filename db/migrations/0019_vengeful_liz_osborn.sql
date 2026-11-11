CREATE TABLE "geetdle_songs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"song_uuid" text NOT NULL,
	"title" text NOT NULL,
	"title_lower" text NOT NULL,
	"singers" text DEFAULT '' NOT NULL,
	"movie" text DEFAULT '' NOT NULL,
	"year" integer NOT NULL,
	"music_director" text DEFAULT '' NOT NULL,
	"language" text DEFAULT 'Hindi' NOT NULL,
	"genre" text,
	"secondary_genres" text[] DEFAULT '{}' NOT NULL,
	"youtube_url" text,
	"popularity" integer,
	"is_answer_eligible" boolean DEFAULT true NOT NULL,
	"source" text DEFAULT 'mrasacker' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "geetdle_songs_songUuid_unique" UNIQUE("song_uuid")
);
--> statement-breakpoint
CREATE INDEX "geetdle_songs_year_idx" ON "geetdle_songs" USING btree ("year");--> statement-breakpoint
CREATE INDEX "geetdle_songs_eligible_year_idx" ON "geetdle_songs" USING btree ("is_answer_eligible","year");--> statement-breakpoint
CREATE INDEX "geetdle_songs_title_lower_idx" ON "geetdle_songs" USING btree ("title_lower");
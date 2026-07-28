ALTER TABLE "watch_entries" ADD COLUMN "seasons_total" integer;--> statement-breakpoint
ALTER TABLE "watch_entries" ADD COLUMN "episodes_total" integer;--> statement-breakpoint
ALTER TABLE "watch_entries" ADD COLUMN "episodes_watched" integer DEFAULT 0 NOT NULL;
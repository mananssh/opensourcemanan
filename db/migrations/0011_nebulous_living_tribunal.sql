CREATE TABLE "ask_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip_hash" text NOT NULL,
	"input_hash" text NOT NULL,
	"duration_ms" integer,
	"capped" boolean DEFAULT false NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "ask_runs_created_idx" ON "ask_runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ask_runs_ip_idx" ON "ask_runs" USING btree ("ip_hash","created_at");
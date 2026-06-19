CREATE TABLE "capabilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_name" text NOT NULL,
	"items" text[] DEFAULT '{}' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experiences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org" text NOT NULL,
	"role" text NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"location" text,
	"blurb" text DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"logo_key" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hackathons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"event" text NOT NULL,
	"result" text DEFAULT '' NOT NULL,
	"happened_at" timestamp with time zone,
	"blurb" text DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"project_slug" text,
	"cover_image_key" text,
	"image_keys" text[] DEFAULT '{}' NOT NULL,
	"stack" text[] DEFAULT '{}' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hackathons_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"tagline" text DEFAULT '' NOT NULL,
	"intro" text DEFAULT '' NOT NULL,
	"now" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"linkedin" text DEFAULT '' NOT NULL,
	"github" text,
	"location" text DEFAULT '' NOT NULL,
	"languages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"photo_key" text,
	"resume_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"blurb" text DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"stack" text[] DEFAULT '{}' NOT NULL,
	"links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"award" text,
	"year" text,
	"cover_image_key" text,
	"image_keys" text[] DEFAULT '{}' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "hackathons_sort_idx" ON "hackathons" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "projects_sort_idx" ON "projects" USING btree ("sort_order");
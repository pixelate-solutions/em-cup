ALTER TABLE "players" ADD COLUMN "ghin_number" varchar(32);--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "ghin_first_name" varchar(80);--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "ghin_last_name" varchar(80);--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "ghin_state" varchar(8);--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "ghin_country" varchar(8) DEFAULT 'US';--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "ghin_club_name" varchar(160);--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "ghin_association_name" varchar(160);--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "ghin_auto_sync" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "ghin_last_fetched_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "ghin_rev_date" date;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "ghin_status" varchar(40);--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "ghin_error" text;
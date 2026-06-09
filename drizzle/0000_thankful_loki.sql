CREATE TYPE "public"."match_side" AS ENUM('left', 'right');--> statement-breakpoint
CREATE TYPE "public"."match_slot" AS ENUM('player1', 'player2');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('pending', 'scheduled', 'completed');--> statement-breakpoint
CREATE TABLE "matches" (
	"id" varchar(16) PRIMARY KEY NOT NULL,
	"round" integer NOT NULL,
	"round_label" varchar(40) NOT NULL,
	"side" "match_side",
	"sort_order" integer NOT NULL,
	"player1_id" integer,
	"player2_id" integer,
	"winner_id" integer,
	"loser_id" integer,
	"next_match_id" varchar(16),
	"next_slot" "match_slot",
	"scheduled_at" timestamp with time zone,
	"location" text,
	"details" text,
	"status" "match_status" DEFAULT 'pending' NOT NULL,
	"deadline" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"handicap_index" numeric(4, 1),
	"is_previous_winner" boolean DEFAULT false NOT NULL,
	"previous_wins" integer DEFAULT 0 NOT NULL,
	"has_paid" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prizes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"amount" numeric(8, 2),
	"winner_player_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournament_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"value" text NOT NULL,
	CONSTRAINT "tournament_settings_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_player1_id_players_id_fk" FOREIGN KEY ("player1_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_player2_id_players_id_fk" FOREIGN KEY ("player2_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_id_players_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_loser_id_players_id_fk" FOREIGN KEY ("loser_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_next_match_id_matches_id_fk" FOREIGN KEY ("next_match_id") REFERENCES "public"."matches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prizes" ADD CONSTRAINT "prizes_winner_player_id_players_id_fk" FOREIGN KEY ("winner_player_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;
UPDATE "matches" SET "next_match_id" = NULL WHERE "id" IN ('R8', 'R8B');--> statement-breakpoint
UPDATE "matches" SET "id" = 'R4' WHERE "id" = 'R8';--> statement-breakpoint
UPDATE "matches" SET "id" = 'R8' WHERE "id" = 'R8B';--> statement-breakpoint
UPDATE "matches" SET "next_match_id" = 'R8' WHERE "id" = 'R4';--> statement-breakpoint
UPDATE "matches" SET "next_match_id" = 'R10' WHERE "id" = 'R8';

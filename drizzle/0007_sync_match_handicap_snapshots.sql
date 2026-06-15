UPDATE "matches"
SET
	"player1_handicap_index" = "players"."handicap_index",
	"updated_at" = now()
FROM "players"
WHERE "matches"."player1_id" = "players"."id";--> statement-breakpoint
UPDATE "matches"
SET
	"player2_handicap_index" = "players"."handicap_index",
	"updated_at" = now()
FROM "players"
WHERE "matches"."player2_id" = "players"."id";

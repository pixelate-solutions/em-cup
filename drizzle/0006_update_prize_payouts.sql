UPDATE "prizes"
SET
	"amount" = CASE "name"
		WHEN '1st Place' THEN 1150.00
		WHEN '2nd Place' THEN 600.00
		WHEN '3rd Place' THEN 400.00
		WHEN '4th Place' THEN 250.00
		ELSE "amount"
	END,
	"updated_at" = now()
WHERE "name" IN ('1st Place', '2nd Place', '3rd Place', '4th Place');

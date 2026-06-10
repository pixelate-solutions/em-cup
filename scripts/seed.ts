import { eq } from "drizzle-orm";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { matches, players, prizes, tournamentSettings, type NewMatch } from "@/db/schema";

config({ path: ".env.local" });
config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const sql = postgres(databaseUrl, { max: 1, prepare: false });
const db = drizzle(sql);

const previousWinnerMap = new Map([
  ["Rich Laramee", 3],
  ["Nick Skope", 2],
  ["Dan Fickes", 1],
  ["Mike Mansell", 1],
  ["Scott Doyle", 1],
]);

const playerNames = [
  "Nick Mink",
  "Sal Pesce",
  "Kipp Usher",
  "Tyler Hop",
  "Mike Czarnecki",
  "Matt Capaldi",
  "Jim Sulla",
  "Chris Bryant",
  "James Baker",
  "Atharva Burande",
  "Mike Dubay",
  "Carter Johnston",
  "Joey Morrison",
  "CJ Borglin",
  "Mario Barraco",
  "Mike Mansell",
  "Rich Laramee",
  "Scott Doyle",
  "Dan Fickes",
  "Kyle Schubel",
  "Scott Nuyttens",
  "Walt Wojtkowski",
  "Nick Skope",
  "John Skope",
];

const ghinMatchHints = new Map([
  ["Mike Czarnecki", { ghinState: "MI", ghinClubName: "Cracklewood Golf Club" }],
  ["Mike Dubay", { ghinState: "MI", ghinClubName: "Maple Lane" }],
]);

const deadlineByRound: Record<string, string> = {
  "Round 1": "2026-06-28",
  "Round of 16": "2026-07-19",
  Quarterfinal: "2026-08-16",
  Semifinal: "2026-09-13",
  Final: "2026-10-04",
};

async function main() {
  await db.delete(prizes);
  await db.delete(matches);
  await db.delete(players);
  await db.delete(tournamentSettings);

  const insertedPlayers = await db
    .insert(players)
    .values(
      playerNames.map((name) => {
        const previousWins = previousWinnerMap.get(name) ?? 0;
        return {
          name,
          ...ghinMatchHints.get(name),
          isPreviousWinner: previousWins > 0,
          previousWins,
          hasPaid: false,
        };
      }),
    )
    .returning();

  const playerId = new Map(insertedPlayers.map((player) => [player.name, player.id]));
  const id = (name: string) => {
    const value = playerId.get(name);
    if (!value) throw new Error(`Missing seeded player: ${name}`);
    return value;
  };
  playerIdLookup = id;

  const baseMatches: NewMatch[] = [
    m("L1", 1, "Round 1", "left", 1, "Nick Mink", "Sal Pesce"),
    m("L2", 1, "Round 1", "left", 2, "Kipp Usher", "Tyler Hop"),
    m("L3", 1, "Round 1", "left", 3, "Mike Czarnecki", "Matt Capaldi"),
    m("L4", 1, "Round 1", "left", 4, "Jim Sulla", "Chris Bryant"),
    m("R1", 1, "Round 1", "right", 5, "James Baker", "Atharva Burande"),
    m("R2", 1, "Round 1", "right", 6, "Kyle Schubel", "John Skope"),
    m("R3", 1, "Round 1", "right", 7, "Mike Dubay", "Carter Johnston"),
    m("R4", 1, "Round 1", "right", 9, "CJ Borglin", "Mario Barraco"),

    m("L5", 2, "Round of 16", "left", 1, null, "Mike Mansell"),
    m("L6", 2, "Round of 16", "left", 2, null, "Rich Laramee"),
    m("L7", 2, "Round of 16", "left", 3, null, "Scott Doyle"),
    m("L8", 2, "Round of 16", "left", 4, null, "Dan Fickes"),
    m("R5", 2, "Round of 16", "right", 5, null, null),
    m("R6", 2, "Round of 16", "right", 6, null, "Scott Nuyttens"),
    m("R7", 2, "Round of 16", "right", 7, "Joey Morrison", "Walt Wojtkowski"),
    m("R8", 2, "Round of 16", "right", 8, null, "Nick Skope"),

    m("L9", 3, "Quarterfinal", "left", 1, null, null),
    m("L10", 3, "Quarterfinal", "left", 2, null, null),
    m("R9", 3, "Quarterfinal", "right", 3, null, null),
    m("R10", 3, "Quarterfinal", "right", 4, null, null),

    m("L13", 4, "Semifinal", "left", 1, null, null),
    m("R13", 4, "Semifinal", "right", 2, null, null),

    m("F1", 5, "Final", null, 1, null, null),
  ];

  await db.insert(matches).values(baseMatches);

  const links: Array<[string, string, "player1" | "player2"]> = [
    ["L1", "L5", "player1"],
    ["L2", "L6", "player1"],
    ["L3", "L7", "player1"],
    ["L4", "L8", "player1"],
    ["L5", "L9", "player1"],
    ["L6", "L9", "player2"],
    ["L7", "L10", "player1"],
    ["L8", "L10", "player2"],
    ["L9", "L13", "player1"],
    ["L10", "L13", "player2"],
    ["L13", "F1", "player1"],
    ["R1", "R5", "player1"],
    ["R2", "R5", "player2"],
    ["R3", "R6", "player1"],
    ["R4", "R8", "player1"],
    ["R5", "R9", "player1"],
    ["R6", "R9", "player2"],
    ["R7", "R10", "player1"],
    ["R8", "R10", "player2"],
    ["R9", "R13", "player1"],
    ["R10", "R13", "player2"],
    ["R13", "F1", "player2"],
  ];

  for (const [matchId, nextMatchId, nextSlot] of links) {
    await db.update(matches).set({ nextMatchId, nextSlot }).where(eq(matches.id, matchId));
  }

  await db.insert(prizes).values([
    {
      name: "1st Place",
      description: "Champion payout",
      amount: "1200.00",
    },
    {
      name: "2nd Place",
      description: "Runner-up payout",
      amount: "600.00",
    },
    {
      name: "3rd Place",
      description: "Third-place payout",
      amount: "425.00",
    },
    {
      name: "4th Place",
      description: "Fourth-place payout",
      amount: "275.00",
    },
    {
      name: "Blue Jacket",
      description: "Awarded to a first-time champion",
    },
    {
      name: "Repeat Winner Patch",
      description: "Added to the existing jacket if the champion is a repeat winner",
    },
  ]);

  await db.insert(tournamentSettings).values([
    { name: "tournament_name", value: "EM Cup" },
    { name: "official_subtitle", value: "Electro-Matic Golf Tournament • Official Bracket" },
    { name: "organizer_email", value: "organizer@example.com" },
    { name: "finals_location_default", value: "Great Oaks" },
    { name: "buy_in", value: "100" },
  ]);

  await sql.end();
}

function m(
  matchId: string,
  round: number,
  roundLabel: string,
  side: "left" | "right" | null,
  sortOrder: number,
  player1Name: string | null,
  player2Name: string | null,
): NewMatch {
  return {
    id: matchId,
    round,
    roundLabel,
    side,
    sortOrder,
    player1Id: player1Name ? playerIdLookup(player1Name) : null,
    player2Id: player2Name ? playerIdLookup(player2Name) : null,
    deadline: deadlineByRound[roundLabel],
  };
}

let playerIdLookup: (name: string) => number;
playerIdLookup = (name: string) => {
  throw new Error(`Player lookup was not initialized for ${name}`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

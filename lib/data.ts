import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { matches, players, prizes, tournamentSettings } from "@/db/schema";
import type { MatchWithPlayers, PrizeWithWinner, TournamentData } from "@/lib/types";

export async function getPlayers() {
  return db.select().from(players).orderBy(asc(players.name));
}

export async function getMatches(): Promise<MatchWithPlayers[]> {
  const [allMatches, allPlayers] = await Promise.all([
    db.select().from(matches).orderBy(asc(matches.round), asc(matches.side), asc(matches.sortOrder)),
    db.select().from(players),
  ]);

  const playerById = new Map(allPlayers.map((player) => [player.id, player]));

  return allMatches.map((match) => ({
    ...match,
    player1: match.player1Id ? (playerById.get(match.player1Id) ?? null) : null,
    player2: match.player2Id ? (playerById.get(match.player2Id) ?? null) : null,
    winner: match.winnerId ? (playerById.get(match.winnerId) ?? null) : null,
    loser: match.loserId ? (playerById.get(match.loserId) ?? null) : null,
  }));
}

export async function getPrizes(): Promise<PrizeWithWinner[]> {
  const [allPrizes, allPlayers] = await Promise.all([
    db.select().from(prizes).orderBy(asc(prizes.id)),
    db.select().from(players),
  ]);

  const playerById = new Map(allPlayers.map((player) => [player.id, player]));

  return allPrizes.map((prize) => ({
    ...prize,
    winner: prize.winnerPlayerId ? (playerById.get(prize.winnerPlayerId) ?? null) : null,
  }));
}

export async function getSettings() {
  return db.select().from(tournamentSettings).orderBy(asc(tournamentSettings.name));
}

export async function getTournamentData(): Promise<TournamentData> {
  const [allPlayers, allMatches, allPrizes, settings] = await Promise.all([
    getPlayers(),
    getMatches(),
    getPrizes(),
    getSettings(),
  ]);

  return {
    players: allPlayers,
    matches: allMatches,
    prizes: allPrizes,
    settings,
  };
}

export async function getSettingValue(name: string, fallback = "") {
  const [setting] = await db
    .select()
    .from(tournamentSettings)
    .where(eq(tournamentSettings.name, name))
    .limit(1);

  return setting?.value ?? fallback;
}

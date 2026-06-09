"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { matches, players, prizes, tournamentSettings } from "@/db/schema";
import { clearDownstreamResults, propagateWinner } from "@/lib/bracket-server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  refreshAllPlayerHandicaps,
  refreshPlayerHandicapById,
  resolveCurrentHandicapsForPlayers,
} from "@/lib/ghin";

const nullableInt = z.union([z.number().int().positive(), z.null()]);
const nullableString = z.union([z.string(), z.null()]);
const nullableHandicap = z.union([z.string().trim(), z.null()]).optional();

const matchDetailsSchema = z.object({
  matchId: z.string().min(1),
  player1Id: nullableInt,
  player2Id: nullableInt,
  player1HandicapIndex: nullableHandicap,
  player2HandicapIndex: nullableHandicap,
  scheduledAt: z.string().nullable(),
  location: nullableString,
  details: nullableString,
  status: z.enum(["pending", "scheduled", "completed"]),
});

const winnerSchema = z.object({
  matchId: z.string().min(1),
  winnerId: z.number().int().positive(),
});

const clearMatchSchema = z.object({
  matchId: z.string().min(1),
  player1HandicapIndex: nullableHandicap,
  player2HandicapIndex: nullableHandicap,
});

const playerSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(1, "Player name is required"),
  handicapIndex: z.string().nullable(),
  ghinNumber: z.string().nullable().optional(),
  ghinState: z.string().nullable().optional(),
  ghinCountry: z.string().nullable().optional(),
  ghinAutoSync: z.boolean().optional(),
  hasPaid: z.boolean(),
  notes: z.string().nullable(),
});

const paymentSchema = z.object({
  playerId: z.number().int().positive(),
  hasPaid: z.boolean(),
});

const prizeSchema = z.object({
  prizeId: z.number().int().positive(),
  winnerPlayerId: nullableInt,
});

const settingSchema = z.object({
  name: z.string().min(1),
  value: z.string(),
});

const refreshPlayerSchema = z.object({
  playerId: z.number().int().positive(),
});

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

function revalidateApp() {
  ["/", "/bracket", "/players", "/rules", "/admin"].forEach((path) => revalidatePath(path));
}

export async function updateMatchDetailsAction(input: z.infer<typeof matchDetailsSchema>) {
  await requireAdmin();
  const data = matchDetailsSchema.parse(input);
  const player1HandicapIndex = normalizeHandicapInput(data.player1HandicapIndex);
  const player2HandicapIndex = normalizeHandicapInput(data.player2HandicapIndex);

  await db.transaction(async (tx) => {
    const [match] = await tx.select().from(matches).where(eq(matches.id, data.matchId)).limit(1);
    if (!match) throw new Error("Match not found");

    const nextPlayerIds = [data.player1Id, data.player2Id].filter(Boolean);
    const playersChanged = match.player1Id !== data.player1Id || match.player2Id !== data.player2Id;
    const currentWinnerInvalid =
      match.winnerId != null && (playersChanged || !nextPlayerIds.includes(match.winnerId));

    if (currentWinnerInvalid) {
      await clearDownstreamResults(tx, match, match.winnerId);
    }

    await tx
      .update(matches)
      .set({
        player1Id: data.player1Id,
        player2Id: data.player2Id,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        location: data.location || null,
        details: data.details || null,
        status: currentWinnerInvalid ? (data.scheduledAt ? "scheduled" : "pending") : data.status,
        winnerId: currentWinnerInvalid ? null : match.winnerId,
        loserId: currentWinnerInvalid ? null : match.loserId,
        player1HandicapIndex,
        player2HandicapIndex,
        updatedAt: new Date(),
      })
      .where(eq(matches.id, data.matchId));
  });

  revalidateApp();
  return { ok: true };
}

export async function setMatchWinnerAction(input: z.infer<typeof winnerSchema>) {
  await requireAdmin();
  const data = winnerSchema.parse(input);

  const [matchBefore] = await db.select().from(matches).where(eq(matches.id, data.matchId)).limit(1);
  if (!matchBefore) throw new Error("Match not found");

  if (data.winnerId !== matchBefore.player1Id && data.winnerId !== matchBefore.player2Id) {
    throw new Error("Winner must be one of the match players");
  }

  const loserId = data.winnerId === matchBefore.player1Id ? matchBefore.player2Id : matchBefore.player1Id;
  if (!loserId) throw new Error("Cannot complete a match until both players are set");

  const matchPlayerIds = [matchBefore.player1Id, matchBefore.player2Id].filter(
    (id): id is number => id != null,
  );
  const matchPlayers = await db
    .select()
    .from(players)
    .where(inArray(players.id, matchPlayerIds));
  const playerById = new Map(matchPlayers.map((player) => [player.id, player]));
  const player1 = matchBefore.player1Id ? playerById.get(matchBefore.player1Id) : null;
  const player2 = matchBefore.player2Id ? playerById.get(matchBefore.player2Id) : null;
  let refreshedHandicaps = new Map<number, string | null>();

  try {
    const idsToRefresh = [
      matchBefore.player1HandicapIndex == null ? matchBefore.player1Id : null,
      matchBefore.player2HandicapIndex == null ? matchBefore.player2Id : null,
    ].filter((id): id is number => id != null);
    refreshedHandicaps = await resolveCurrentHandicapsForPlayers(idsToRefresh);
  } catch {
    refreshedHandicaps = new Map();
  }

  await db.transaction(async (tx) => {
    const [match] = await tx.select().from(matches).where(eq(matches.id, data.matchId)).limit(1);
    if (!match) throw new Error("Match not found");

    if (data.winnerId !== match.player1Id && data.winnerId !== match.player2Id) {
      throw new Error("Winner must be one of the match players");
    }

    const nextLoserId = data.winnerId === match.player1Id ? match.player2Id : match.player1Id;
    if (!nextLoserId) throw new Error("Cannot complete a match until both players are set");

    if (match.winnerId && match.winnerId !== data.winnerId) {
      await clearDownstreamResults(tx, match, match.winnerId);
    }

    await tx
      .update(matches)
      .set({
        winnerId: data.winnerId,
        loserId: nextLoserId,
        player1HandicapIndex:
          match.player1HandicapIndex ??
          (match.player1Id ? refreshedHandicaps.get(match.player1Id) : null) ??
          player1?.handicapIndex ??
          null,
        player2HandicapIndex:
          match.player2HandicapIndex ??
          (match.player2Id ? refreshedHandicaps.get(match.player2Id) : null) ??
          player2?.handicapIndex ??
          null,
        status: "completed",
        updatedAt: new Date(),
      })
      .where(eq(matches.id, data.matchId));

    await propagateWinner(tx, match, data.winnerId);
  });

  revalidateApp();
  return { ok: true };
}

export async function clearMatchResultAction(input: z.infer<typeof clearMatchSchema>) {
  await requireAdmin();
  const data = clearMatchSchema.parse(input);
  const player1HandicapIndex = normalizeHandicapInput(data.player1HandicapIndex);
  const player2HandicapIndex = normalizeHandicapInput(data.player2HandicapIndex);

  await db.transaction(async (tx) => {
    const [match] = await tx.select().from(matches).where(eq(matches.id, data.matchId)).limit(1);
    if (!match) throw new Error("Match not found");

    await clearDownstreamResults(tx, match, match.winnerId);

    await tx
      .update(matches)
      .set({
        winnerId: null,
        loserId: null,
        player1HandicapIndex,
        player2HandicapIndex,
        status: match.scheduledAt ? "scheduled" : "pending",
        updatedAt: new Date(),
      })
      .where(eq(matches.id, data.matchId));
  });

  revalidateApp();
  return { ok: true };
}

export async function updatePlayerAction(input: z.infer<typeof playerSchema>) {
  await requireAdmin();
  const data = playerSchema.parse(input);

  const handicap = normalizeHandicapInput(data.handicapIndex);
  const patch: Partial<typeof players.$inferInsert> = {
    name: data.name,
    handicapIndex: handicap,
    hasPaid: data.hasPaid,
    notes: data.notes || null,
    updatedAt: new Date(),
  };

  if (data.ghinNumber !== undefined) patch.ghinNumber = normalizeNullableString(data.ghinNumber);
  if (data.ghinState !== undefined) patch.ghinState = normalizeNullableString(data.ghinState)?.toUpperCase() ?? null;
  if (data.ghinCountry !== undefined) patch.ghinCountry = normalizeNullableString(data.ghinCountry)?.toUpperCase() ?? "US";
  if (data.ghinAutoSync !== undefined) patch.ghinAutoSync = data.ghinAutoSync;

  await db
    .update(players)
    .set(patch)
    .where(eq(players.id, data.id));

  revalidateApp();
  return { ok: true };
}

export async function refreshPlayerHandicapAction(input: z.infer<typeof refreshPlayerSchema>) {
  await requireAdmin();
  const data = refreshPlayerSchema.parse(input);
  const result = await refreshPlayerHandicapById(data.playerId);

  revalidateApp();
  return result;
}

export async function refreshAllHandicapsAction() {
  await requireAdmin();
  const results = await refreshAllPlayerHandicaps();

  revalidateApp();
  return {
    ok: true,
    total: results.length,
    updated: results.filter((result) => result.ok).length,
    failed: results.filter((result) => !result.ok).length,
    results,
  };
}

export async function updatePaymentAction(input: z.infer<typeof paymentSchema>) {
  await requireAdmin();
  const data = paymentSchema.parse(input);

  await db
    .update(players)
    .set({ hasPaid: data.hasPaid, updatedAt: new Date() })
    .where(eq(players.id, data.playerId));

  revalidateApp();
  return { ok: true };
}

export async function updatePrizeAction(input: z.infer<typeof prizeSchema>) {
  await requireAdmin();
  const data = prizeSchema.parse(input);

  await db
    .update(prizes)
    .set({ winnerPlayerId: data.winnerPlayerId, updatedAt: new Date() })
    .where(eq(prizes.id, data.prizeId));

  revalidateApp();
  return { ok: true };
}

export async function updateSettingAction(input: z.infer<typeof settingSchema>) {
  await requireAdmin();
  const data = settingSchema.parse(input);

  await db
    .insert(tournamentSettings)
    .values(data)
    .onConflictDoUpdate({
      target: tournamentSettings.name,
      set: { value: data.value },
    });

  revalidateApp();
  return { ok: true };
}

function normalizeHandicapInput(value: string | null | undefined) {
  if (value == null || value.trim() === "") return null;
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(parsed)) throw new Error("Handicap must be a number");
  if (Math.abs(parsed) > 54) {
    throw new Error("Handicap index must be between -54.0 and 54.0. Put GHIN numbers in the GHIN # field.");
  }
  return parsed.toFixed(1);
}

function normalizeNullableString(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

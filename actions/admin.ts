"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { matches, players, prizes, tournamentSettings } from "@/db/schema";
import { clearDownstreamResults, propagateWinner } from "@/lib/bracket-server";
import { isAdminAuthenticated } from "@/lib/auth";

const nullableInt = z.union([z.number().int().positive(), z.null()]);
const nullableString = z.union([z.string(), z.null()]);

const matchDetailsSchema = z.object({
  matchId: z.string().min(1),
  player1Id: nullableInt,
  player2Id: nullableInt,
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
});

const playerSchema = z.object({
  id: z.number().int().positive(),
  handicapIndex: z.string().nullable(),
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

  await db.transaction(async (tx) => {
    const [match] = await tx.select().from(matches).where(eq(matches.id, data.matchId)).limit(1);
    if (!match) throw new Error("Match not found");

    const nextPlayerIds = [data.player1Id, data.player2Id].filter(Boolean);
    const currentWinnerInvalid =
      match.winnerId != null && !nextPlayerIds.includes(match.winnerId);

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

  await db.transaction(async (tx) => {
    const [match] = await tx.select().from(matches).where(eq(matches.id, data.matchId)).limit(1);
    if (!match) throw new Error("Match not found");

    if (data.winnerId !== match.player1Id && data.winnerId !== match.player2Id) {
      throw new Error("Winner must be one of the match players");
    }

    const loserId = data.winnerId === match.player1Id ? match.player2Id : match.player1Id;
    if (!loserId) throw new Error("Cannot complete a match until both players are set");

    if (match.winnerId && match.winnerId !== data.winnerId) {
      await clearDownstreamResults(tx, match, match.winnerId);
    }

    await tx
      .update(matches)
      .set({
        winnerId: data.winnerId,
        loserId,
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

  await db.transaction(async (tx) => {
    const [match] = await tx.select().from(matches).where(eq(matches.id, data.matchId)).limit(1);
    if (!match) throw new Error("Match not found");

    await clearDownstreamResults(tx, match, match.winnerId);

    await tx
      .update(matches)
      .set({
        winnerId: null,
        loserId: null,
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

  const handicap = data.handicapIndex && data.handicapIndex.trim() !== "" ? data.handicapIndex : null;

  await db
    .update(players)
    .set({
      handicapIndex: handicap,
      hasPaid: data.hasPaid,
      notes: data.notes || null,
      updatedAt: new Date(),
    })
    .where(eq(players.id, data.id));

  revalidateApp();
  return { ok: true };
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

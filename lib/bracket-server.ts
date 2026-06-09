import "server-only";

import { eq } from "drizzle-orm";

import { matches, type Match } from "@/db/schema";

type Tx = {
  select: typeof import("@/db").db.select;
  update: typeof import("@/db").db.update;
};

export async function clearDownstreamResults(tx: Tx, match: Match, oldWinnerId: number | null) {
  if (!match.nextMatchId || !oldWinnerId) return;

  const [nextMatch] = await tx.select().from(matches).where(eq(matches.id, match.nextMatchId)).limit(1);
  if (!nextMatch) return;

  const patch: Partial<typeof matches.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (match.nextSlot === "player1" && nextMatch.player1Id === oldWinnerId) {
    patch.player1Id = null;
  }

  if (match.nextSlot === "player2" && nextMatch.player2Id === oldWinnerId) {
    patch.player2Id = null;
  }

  const nextHadResult = Boolean(nextMatch.winnerId);
  const downstreamWinner = nextMatch.winnerId;

  if (
    nextHadResult &&
    (nextMatch.player1Id === oldWinnerId ||
      nextMatch.player2Id === oldWinnerId ||
      nextMatch.winnerId === oldWinnerId ||
      nextMatch.loserId === oldWinnerId)
  ) {
    patch.winnerId = null;
    patch.loserId = null;
    patch.player1HandicapIndex = null;
    patch.player2HandicapIndex = null;
    patch.status = nextMatch.scheduledAt ? "scheduled" : "pending";
  }

  if (Object.keys(patch).length > 1) {
    await tx.update(matches).set(patch).where(eq(matches.id, nextMatch.id));
  }

  if (nextHadResult) {
    await clearDownstreamResults(tx, nextMatch, downstreamWinner);
  }
}

export async function propagateWinner(tx: Tx, match: Match, winnerId: number) {
  if (!match.nextMatchId || !match.nextSlot) return;

  await tx
    .update(matches)
    .set({
      [match.nextSlot === "player1" ? "player1Id" : "player2Id"]: winnerId,
      updatedAt: new Date(),
    })
    .where(eq(matches.id, match.nextMatchId));
}

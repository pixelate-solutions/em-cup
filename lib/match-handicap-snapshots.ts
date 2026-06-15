import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { matches } from "@/db/schema";

export async function syncMatchHandicapSnapshotsForPlayer(playerId: number, handicapIndex: string | null) {
  const updatedAt = new Date();

  await Promise.all([
    db
      .update(matches)
      .set({ player1HandicapIndex: handicapIndex, updatedAt })
      .where(eq(matches.player1Id, playerId)),
    db
      .update(matches)
      .set({ player2HandicapIndex: handicapIndex, updatedAt })
      .where(eq(matches.player2Id, playerId)),
  ]);
}

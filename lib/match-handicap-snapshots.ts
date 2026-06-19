import "server-only";

import { and, eq, ne } from "drizzle-orm";

import { db } from "@/db";
import { matches } from "@/db/schema";

export async function syncMatchHandicapSnapshotsForPlayer(playerId: number, handicapIndex: string | null) {
  const updatedAt = new Date();

  await Promise.all([
    db
      .update(matches)
      .set({ player1HandicapIndex: handicapIndex, updatedAt })
      .where(
        and(
          eq(matches.player1Id, playerId),
          eq(matches.player1HandicapOverride, false),
          ne(matches.status, "completed"),
        ),
      ),
    db
      .update(matches)
      .set({ player2HandicapIndex: handicapIndex, updatedAt })
      .where(
        and(
          eq(matches.player2Id, playerId),
          eq(matches.player2HandicapOverride, false),
          ne(matches.status, "completed"),
        ),
      ),
  ]);
}

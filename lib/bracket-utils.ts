import type { Match, Player } from "@/db/schema";
import type { MatchWithPlayers } from "@/lib/types";

export function getMatchDisplayName(match: Pick<Match, "id" | "roundLabel">) {
  return `${match.roundLabel} ${match.id}`;
}

export function getSlotDisplay(match: MatchWithPlayers, slot: "player1" | "player2") {
  const player = slot === "player1" ? match.player1 : match.player2;
  if (player) return player.name;

  const feeder = getFeederMatchLabel(match.id, slot);
  return feeder ? `Winner of ${feeder}` : "TBD";
}

type HandicapParticipant = {
  name: string;
  handicapIndex: string | number | null;
};

export function calculateHandicapStrokes(
  player1: HandicapParticipant | null,
  player2: HandicapParticipant | null,
) {
  if (!player1 || !player2 || player1.handicapIndex == null || player2.handicapIndex == null) {
    return {
      complete: false,
      strokes: 0,
      giver: null,
      receiver: null,
      message: "Handicap info incomplete",
    };
  }

  const handicap1 = Number(player1.handicapIndex);
  const handicap2 = Number(player2.handicapIndex);
  const strokes = Math.round(Math.abs(handicap1 - handicap2));

  if (strokes === 0) {
    return {
      complete: true,
      strokes,
      giver: null,
      receiver: null,
      message: "Match plays even",
    };
  }

  const lower = handicap1 < handicap2 ? player1 : player2;
  const higher = handicap1 < handicap2 ? player2 : player1;

  return {
    complete: true,
    strokes,
    giver: lower,
    receiver: higher,
    message: `${lower.name} gives ${strokes} ${strokes === 1 ? "stroke" : "strokes"} to ${higher.name}`,
  };
}

export function getMatchSlotHandicap(match: MatchWithPlayers, slot: "player1" | "player2") {
  const matchHandicap = slot === "player1" ? match.player1HandicapIndex : match.player2HandicapIndex;
  if (matchHandicap != null) return matchHandicap;

  const player = slot === "player1" ? match.player1 : match.player2;
  if (player?.handicapIndex != null) return player.handicapIndex;

  return null;
}

export function getMatchHandicapParticipants(match: MatchWithPlayers) {
  return {
    player1: match.player1
      ? {
          name: match.player1.name,
          handicapIndex: getMatchSlotHandicap(match, "player1"),
        }
      : null,
    player2: match.player2
      ? {
          name: match.player2.name,
          handicapIndex: getMatchSlotHandicap(match, "player2"),
        }
      : null,
  };
}

export function getPlayerTournamentStatus(player: Player, allMatches: MatchWithPlayers[]) {
  const final = allMatches.find((match) => match.id === "F1");
  if (final?.winnerId === player.id) return "champion";

  const lostMatch = allMatches.find((match) => match.loserId === player.id);
  if (lostMatch) return "eliminated";

  const activeMatch = allMatches.find(
    (match) =>
      match.status !== "completed" &&
      (match.player1Id === player.id || match.player2Id === player.id),
  );

  return activeMatch ? "active" : "pending";
}

function getFeederMatchLabel(matchId: string, slot: "player1" | "player2") {
  const feeders: Record<string, Partial<Record<"player1" | "player2", string>>> = {
    L5: { player1: "L1" },
    L6: { player1: "L2" },
    L7: { player1: "L3" },
    L8: { player1: "L4" },
    L9: { player1: "L5", player2: "L6" },
    L10: { player1: "L7", player2: "L8" },
    L13: { player1: "L9", player2: "L10" },
    R5: { player1: "R1", player2: "R2" },
    R6: { player1: "R3" },
    R8: { player1: "R4" },
    R9: { player1: "R5", player2: "R6" },
    R10: { player1: "R7", player2: "R8" },
    R13: { player1: "R9", player2: "R10" },
    F1: { player1: "L13", player2: "R13" },
  };

  return feeders[matchId]?.[slot] ?? null;
}

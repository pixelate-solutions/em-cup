import { Bracket } from "@/components/bracket/bracket";
import type { Player } from "@/db/schema";
import type { MatchWithPlayers } from "@/lib/types";

export function AdminMatchBracketEditor({
  matches,
  players,
}: {
  matches: MatchWithPlayers[];
  players: Player[];
}) {
  return <Bracket matches={matches} players={players} adminEditable />;
}

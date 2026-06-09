import type { Player } from "@/db/schema";

export function HandicapDisplay({ player }: { player: Pick<Player, "handicapIndex"> | null }) {
  return (
    <span className="text-xs text-muted-foreground">
      HCP {player?.handicapIndex != null ? Number(player.handicapIndex).toFixed(1) : "TBD"}
    </span>
  );
}

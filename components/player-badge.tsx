import { Badge } from "@/components/ui/badge";
import type { Player } from "@/db/schema";
import { cn } from "@/lib/utils";

export function PlayerBadge({
  player,
  muted = false,
}: {
  player: Pick<Player, "name"> | null;
  muted?: boolean;
}) {
  return (
    <span className={cn("font-medium", muted && "text-muted-foreground line-through")}>
      {player?.name ?? "TBD"}
    </span>
  );
}

export function PreviousWinnerBadge({ wins }: { wins: number }) {
  if (!wins) return null;
  return <Badge variant="outline">{wins}x winner</Badge>;
}

export function PaymentStatusBadge({ paid }: { paid: boolean }) {
  return paid ? <Badge variant="success">Paid</Badge> : <Badge variant="warning">Unpaid</Badge>;
}

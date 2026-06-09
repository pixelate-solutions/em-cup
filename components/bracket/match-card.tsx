"use client";

import { Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { HandicapDisplay } from "@/components/handicap-display";
import { PlayerBadge } from "@/components/player-badge";
import { StatusBadge } from "@/components/status-badge";
import type { MatchWithPlayers } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import { getSlotDisplay } from "@/lib/bracket-utils";

export function MatchCard({
  match,
  onSelect,
  compact = false,
}: {
  match: MatchWithPlayers;
  onSelect: (match: MatchWithPlayers) => void;
  compact?: boolean;
}) {
  const playerRows = [
    { slot: "player1" as const, player: match.player1 },
    { slot: "player2" as const, player: match.player2 },
  ];

  return (
    <button
      type="button"
      onClick={() => onSelect(match)}
      className="w-full cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Open details for ${match.id}`}
    >
      <Card
        className={cn(
          "overflow-hidden border-primary/15 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl",
          match.status === "completed" && "border-emerald-300 bg-emerald-50/70",
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b bg-white/45 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-xs font-semibold text-primary">{match.id}</span>
            <span className="truncate text-xs text-muted-foreground">{match.roundLabel}</span>
          </div>
          <StatusBadge status={match.status} />
        </div>
        <div className={cn("space-y-2 p-3", compact && "p-2")}>
          {playerRows.map(({ slot, player }) => {
            const isWinner = match.winnerId && player?.id === match.winnerId;
            const isLoser = match.loserId && player?.id === match.loserId;

            return (
              <div
                key={slot}
                className={cn(
                  "flex min-h-10 items-center justify-between gap-2 rounded-2xl border border-white/70 bg-white/58 px-3 py-2 backdrop-blur",
                  isWinner && "border-emerald-300 bg-white/85",
                  !player && "border-dashed",
                  isLoser && "opacity-55",
                )}
              >
                <div className="min-w-0">
                  {player ? (
                    <PlayerBadge player={player} muted={Boolean(isLoser)} />
                  ) : (
                    <span className="text-sm font-medium text-muted-foreground">{getSlotDisplay(match, slot)}</span>
                  )}
                  {player ? <div><HandicapDisplay player={player} /></div> : null}
                </div>
                {isWinner ? <Trophy className="h-4 w-4 shrink-0 text-emerald-600" /> : null}
              </div>
            );
          })}
          <div className="flex items-center justify-between gap-2 pt-1">
            <Badge variant="outline" className="font-normal">
              Deadline {formatDate(match.deadline)}
            </Badge>
          </div>
        </div>
      </Card>
    </button>
  );
}

"use client";

import { CheckCircle2 } from "lucide-react";

import { getMatchSlotHandicap, getSlotDisplay } from "@/lib/bracket-utils";
import type { MatchWithPlayers } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MatchCard({
  match,
  onSelect,
}: {
  match: MatchWithPlayers;
  onSelect: (match: MatchWithPlayers) => void;
  compact?: boolean;
  showConnector?: boolean;
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
      aria-label={`Open details for ${match.roundLabel} ${match.id}`}
    >
      <div
        className={cn(
          "relative overflow-visible rounded-md border border-slate-300 bg-white text-foreground shadow-none transition hover:border-primary/50 hover:bg-slate-50",
          match.status === "completed" && "border-primary/40",
        )}
      >
        <span className="pointer-events-none absolute -right-1.5 -top-3 z-10 rounded bg-slate-100 px-1 text-[9px] font-bold text-primary/70">
          {match.id}
        </span>
        {playerRows.map(({ slot, player }, index) => {
          const isWinner = Boolean(match.winnerId && player?.id === match.winnerId);
          const isLoser = Boolean(match.loserId && player?.id === match.loserId);
          const label = player?.name ?? shortSlotLabel(getSlotDisplay(match, slot));
          const handicap = getMatchSlotHandicap(match, slot);

          return (
            <div
              key={slot}
              className={cn(
                "flex h-8 items-center justify-between gap-1.5 px-2.5 text-sm",
                index === 0 && "border-b border-slate-200",
                !player && "bg-slate-50 text-slate-400",
                isWinner && "bg-blue-50 font-bold text-primary",
                isLoser && "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap pr-1",
                  !player && "font-medium italic",
                )}
              >
                {label}
              </span>
              <span className="flex shrink-0 items-center gap-1">
                {handicap != null ? (
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    {Number(handicap).toFixed(1)}
                  </span>
                ) : null}
                {isWinner ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> : null}
              </span>
            </div>
          );
        })}
      </div>
    </button>
  );
}

function shortSlotLabel(value: string) {
  if (value === "TBD") return "TBD";
  if (value.startsWith("Winner of ")) return `${value.replace("Winner of ", "")} Winner`;
  return value;
}

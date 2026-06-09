"use client";

import type { MatchWithPlayers } from "@/lib/types";
import { MatchCard } from "@/components/bracket/match-card";

export function BracketRound({
  label,
  matches,
  onSelect,
  compact,
}: {
  label: string;
  matches: MatchWithPlayers[];
  onSelect: (match: MatchWithPlayers) => void;
  compact?: boolean;
}) {
  return (
    <section className="min-w-64 space-y-3" aria-label={label}>
      <div className="sticky top-[73px] z-10 rounded-full bg-primary px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-primary-foreground shadow-lg shadow-primary/20 md:static">
        {label}
      </div>
      <div className="space-y-4">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} onSelect={onSelect} compact={compact} />
        ))}
      </div>
    </section>
  );
}

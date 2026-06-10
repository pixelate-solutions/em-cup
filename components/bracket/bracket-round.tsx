"use client";

import { MatchCard } from "@/components/bracket/match-card";
import type { MatchWithPlayers } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function BracketRound({
  label,
  deadline,
  matches,
  onSelect,
  compact,
  showConnectors = false,
}: {
  label: string;
  deadline?: string | null;
  matches: MatchWithPlayers[];
  onSelect: (match: MatchWithPlayers) => void;
  compact?: boolean;
  showConnectors?: boolean;
}) {
  return (
    <section className="min-w-[250px] space-y-3" aria-label={label}>
      <div className="sticky top-[65px] z-10 border-b border-slate-300 bg-slate-100/95 pb-3 pt-1 backdrop-blur">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">{label}</h2>
        {deadline ? (
          <p className="mt-1 text-xs font-medium text-slate-500">
            Deadline {label === "Final" ? `${formatDate(deadline)}` : formatDate(deadline)}
          </p>
        ) : null}
      </div>
      <div className="flex min-h-[760px] flex-col justify-around gap-4">
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            onSelect={onSelect}
            compact={compact}
            showConnector={showConnectors}
          />
        ))}
      </div>
    </section>
  );
}

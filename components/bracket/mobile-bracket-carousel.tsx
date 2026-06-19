"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Crown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getMatchSlotHandicap,
  getSlotDisplay,
} from "@/lib/bracket-utils";
import { ROUND_DEADLINES } from "@/lib/constants";
import type { MatchWithPlayers } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

const mobileRounds = ["Round 1", "Round of 16", "Quarterfinal", "Semifinal", "Final", "Champion"] as const;

type MobileRound = (typeof mobileRounds)[number];

export function MobileBracketCarousel({
  matches,
  initialRoundLabel,
  onSelect,
}: {
  matches: MatchWithPlayers[];
  initialRoundLabel: string;
  onSelect: (match: MatchWithPlayers) => void;
}) {
  const initialIndex = Math.max(
    0,
    mobileRounds.findIndex((round) => round === initialRoundLabel),
  );
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [activePaneHeight, setActivePaneHeight] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const roundTabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const roundPaneRefs = useRef<Array<HTMLDivElement | null>>([]);
  const activeRound = mobileRounds[activeIndex];
  const final = matches.find((match) => match.id === "F1");

  const rounds = useMemo(
    () =>
      mobileRounds.map((round) => ({
        label: round,
        deadline: ROUND_DEADLINES.find((deadline) => deadline.label === round)?.date ?? null,
        matches:
          round === "Champion"
            ? []
            : matches
                .filter((match) => match.roundLabel === round)
                .sort((a, b) => a.sortOrder - b.sortOrder),
      })),
    [matches],
  );

  const moveTo = (nextIndex: number) => {
    setActiveIndex(Math.min(Math.max(nextIndex, 0), mobileRounds.length - 1));
  };

  const handleTouchEnd = (x: number) => {
    if (touchStartX.current == null) return;
    const delta = touchStartX.current - x;
    touchStartX.current = null;
    if (Math.abs(delta) < 48) return;
    moveTo(activeIndex + (delta > 0 ? 1 : -1));
  };

  useEffect(() => {
    roundTabRefs.current[activeIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeIndex]);

  useEffect(() => {
    const activePane = roundPaneRefs.current[activeIndex];
    if (!activePane) return;

    setActivePaneHeight(activePane.scrollHeight);

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setActivePaneHeight(Math.ceil(activePane.scrollHeight));
    });

    observer.observe(activePane);
    return () => observer.disconnect();
  }, [activeIndex, rounds]);

  return (
    <section className="rounded-xl border border-slate-300 bg-slate-100" aria-label="Mobile bracket carousel">
      <div className="sticky top-[61px] z-20 border-b border-slate-300 bg-white/95 px-3 py-3 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-lg bg-white"
            aria-label="Previous round"
            disabled={activeIndex === 0}
            onClick={() => moveTo(activeIndex - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="min-w-0 flex-1 overflow-x-auto">
            <div className="flex min-w-max items-start justify-center gap-2 px-1">
              {rounds.map((round, index) => {
                const isActive = index === activeIndex;
                return (
                  <button
                    key={round.label}
                    ref={(element) => {
                      roundTabRefs.current[index] = element;
                    }}
                    type="button"
                    className={cn(
                      "min-w-20 cursor-pointer border-b-2 px-2 pb-2 text-center transition-colors",
                      isActive
                        ? "border-primary text-primary"
                        : "border-transparent text-slate-500 hover:text-primary",
                    )}
                    aria-current={isActive ? "step" : undefined}
                    onClick={() => moveTo(index)}
                  >
                    <span className="block text-xs font-extrabold uppercase tracking-wide">
                      {round.label === "Round of 16" ? "R16" : round.label}
                    </span>
                    <span className="mt-1 block text-[10px] font-semibold text-slate-500">
                      {round.deadline ? formatDate(round.deadline).replace(", 2026", "") : "Blue Jacket"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-lg bg-white"
            aria-label="Next round"
            disabled={activeIndex === mobileRounds.length - 1}
            onClick={() => moveTo(activeIndex + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-lg font-extrabold text-slate-950">{activeRound}</p>
            <p className="text-xs font-semibold text-slate-500">
              {rounds[activeIndex]?.deadline
                ? `${"Deadline "}${formatDate(rounds[activeIndex].deadline)}`
                : "Champion receives the Blue Jacket"}
            </p>
          </div>
          <Badge variant="outline" className="rounded-lg bg-white text-[10px]">
            {activeIndex + 1} / {mobileRounds.length}
          </Badge>
        </div>
      </div>

      <div
        className="overflow-hidden transition-[height] duration-300 ease-out"
        style={{ height: activePaneHeight ?? undefined }}
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          handleTouchEnd(event.changedTouches[0]?.clientX ?? 0);
        }}
      >
        <div
          className="flex items-start transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {rounds.map((round, index) => (
            <div
              key={round.label}
              ref={(element) => {
                roundPaneRefs.current[index] = element;
              }}
              className="h-fit w-full shrink-0 p-3"
            >
              {round.label === "Champion" ? (
                <ChampionPane final={final} onSelect={onSelect} />
              ) : (
                <RoundPane round={round} onSelect={onSelect} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RoundPane({
  round,
  onSelect,
}: {
  round: {
    label: MobileRound;
    matches: MatchWithPlayers[];
  };
  onSelect: (match: MatchWithPlayers) => void;
}) {
  const leftMatches = round.matches.filter((match) => match.side === "left");
  const rightMatches = round.matches.filter((match) => match.side === "right");
  const finalMatches = round.matches.filter((match) => !match.side);

  return (
    <div className="space-y-5">
      {leftMatches.length ? (
        <MatchGroup title="Left Side" matches={leftMatches} onSelect={onSelect} />
      ) : null}
      {rightMatches.length ? (
        <MatchGroup title="Right Side" matches={rightMatches} onSelect={onSelect} />
      ) : null}
      {finalMatches.length ? (
        <MatchGroup title="Blue Jacket Final" matches={finalMatches} onSelect={onSelect} />
      ) : null}
    </div>
  );
}

function MatchGroup({
  title,
  matches,
  onSelect,
}: {
  title: string;
  matches: MatchWithPlayers[];
  onSelect: (match: MatchWithPlayers) => void;
}) {
  return (
    <div className="space-y-2">
      <h3 className="px-1 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
        {title}
      </h3>
      <div className="space-y-3">
        {matches.map((match) => (
          <MobileMatchCard key={match.id} match={match} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function MobileMatchCard({
  match,
  onSelect,
}: {
  match: MatchWithPlayers;
  onSelect: (match: MatchWithPlayers) => void;
}) {
  const rows = [
    { slot: "player1" as const, player: match.player1 },
    { slot: "player2" as const, player: match.player2 },
  ];
  const winner = match.winner;
  const detailLine = [match.location, match.scheduledAt ? formatDate(match.scheduledAt) : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <button
      type="button"
      className="w-full cursor-pointer overflow-hidden rounded-lg border border-slate-300 bg-white text-left shadow-sm transition hover:border-primary/50 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Open details for ${match.roundLabel} ${match.id}`}
      onClick={() => onSelect(match)}
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-3 py-2">
        <div className="min-w-0">
          <p className="text-xs font-extrabold text-primary">{match.id}</p>
          <p className="truncate text-[11px] font-semibold text-slate-500">{match.roundLabel}</p>
        </div>
        {winner ? (
          <span className="truncate text-xs font-bold text-primary">
            {winner.name} advances
          </span>
        ) : null}
      </div>
      <div className="divide-y divide-slate-200">
        {rows.map(({ slot, player }) => {
          const isWinner = Boolean(match.winnerId && player?.id === match.winnerId);
          const isLoser = Boolean(match.loserId && player?.id === match.loserId);
          const label = player?.name ?? shortSlotLabel(getSlotDisplay(match, slot));
          const handicap = getMatchSlotHandicap(match, slot);

          return (
            <div
              key={slot}
              className={cn(
                "flex min-h-11 items-center justify-between gap-3 px-3 py-2",
                !player && "bg-slate-50 text-slate-400",
                isWinner && "bg-blue-50 font-bold text-primary",
                isLoser && "text-slate-500",
              )}
            >
              <span className={cn("min-w-0 truncate text-sm", !player && "italic")}>
                {isWinner ? <CheckCircle2 className="mr-1 inline h-3.5 w-3.5 align-[-2px]" /> : null}
                {label}
              </span>
              {handicap != null ? (
                <span className="shrink-0 text-xs font-semibold text-slate-500">
                  {Number(handicap).toFixed(1)}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
      {detailLine ? (
        <p className="border-t border-slate-200 px-3 py-2 text-xs font-medium text-slate-500">
          {detailLine}
        </p>
      ) : null}
    </button>
  );
}

function ChampionPane({
  final,
  onSelect,
}: {
  final: MatchWithPlayers | undefined;
  onSelect: (match: MatchWithPlayers) => void;
}) {
  const champion = final?.winner;

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-primary/20 bg-white p-5 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">
          <Crown className="h-6 w-6" />
        </div>
        <p className="mt-3 text-xs font-extrabold uppercase tracking-[0.16em] text-primary">
          EM Cup Champion
        </p>
        <p className="mt-2 text-2xl font-extrabold text-slate-950">{champion?.name ?? "TBD"}</p>
        <p className="mt-1 text-sm font-medium text-slate-500">Blue Jacket</p>
      </div>
      {final ? (
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-lg bg-white"
          onClick={() => onSelect(final)}
        >
          View Final Match
        </Button>
      ) : null}
    </div>
  );
}

function shortSlotLabel(value: string) {
  if (value === "TBD") return "TBD";
  if (value.startsWith("Winner of ")) return `${value.replace("Winner of ", "")} Winner`;
  return value;
}

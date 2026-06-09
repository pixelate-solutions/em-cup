"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Crown, Maximize2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AdminMatchEditDialog } from "@/components/admin/admin-match-edit-dialog";
import { MatchCard } from "@/components/bracket/match-card";
import { MatchDetails } from "@/components/bracket/match-details";
import { MobileBracketCarousel } from "@/components/bracket/mobile-bracket-carousel";
import type { Player } from "@/db/schema";
import type { MatchWithPlayers } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const designWidth = 1690;
const designHeight = 708;
const cardWidth = 156;
const cardHeight = 64;

type NodeSpec = {
  id: string;
  x: number;
  y: number;
};

const nodes: NodeSpec[] = [
  { id: "L1", x: 0, y: 106 },
  { id: "L2", x: 0, y: 235 },
  { id: "L3", x: 0, y: 430 },
  { id: "L4", x: 0, y: 560 },
  { id: "L5", x: 188, y: 124 },
  { id: "L6", x: 188, y: 253 },
  { id: "L7", x: 188, y: 448 },
  { id: "L8", x: 188, y: 578 },
  { id: "L9", x: 376, y: 188 },
  { id: "L10", x: 376, y: 512 },
  { id: "L13", x: 564, y: 350 },
  { id: "F1", x: 765, y: 350 },
  { id: "R13", x: 966, y: 350 },
  { id: "R9", x: 1154, y: 188 },
  { id: "R10", x: 1154, y: 512 },
  { id: "R5", x: 1342, y: 124 },
  { id: "R6", x: 1342, y: 305 },
  { id: "R7", x: 1342, y: 448 },
  { id: "R8B", x: 1342, y: 578 },
  { id: "R1", x: 1530, y: 80 },
  { id: "R2", x: 1530, y: 184 },
  { id: "R3", x: 1530, y: 305 },
  { id: "R4", x: 1530, y: 448 },
  { id: "R8", x: 1530, y: 578 },
];

const links: Array<[string, string]> = [
  ["L1", "L5"],
  ["L2", "L6"],
  ["L3", "L7"],
  ["L4", "L8"],
  ["L5", "L9"],
  ["L6", "L9"],
  ["L7", "L10"],
  ["L8", "L10"],
  ["L9", "L13"],
  ["L10", "L13"],
  ["L13", "F1"],
  ["R1", "R5"],
  ["R2", "R5"],
  ["R3", "R6"],
  ["R4", "R7"],
  ["R8", "R8B"],
  ["R5", "R9"],
  ["R6", "R9"],
  ["R7", "R10"],
  ["R8B", "R10"],
  ["R9", "R13"],
  ["R10", "R13"],
  ["R13", "F1"],
];

const headers = [
  { label: "Round 1", shortLabel: "Round 1", date: "2026-06-28", x: 0 },
  { label: "Round of 16", shortLabel: "R16", date: "2026-07-19", x: 188 },
  { label: "Quarterfinal", shortLabel: "QF", date: "2026-08-16", x: 376 },
  { label: "Semifinal", shortLabel: "SF", date: "2026-09-13", x: 564 },
  { label: "Final", shortLabel: "Final", date: "2026-10-04", x: 765 },
  { label: "Semifinal", shortLabel: "SF", date: "2026-09-13", x: 966 },
  { label: "Quarterfinal", shortLabel: "QF", date: "2026-08-16", x: 1154 },
  { label: "Round of 16", shortLabel: "R16", date: "2026-07-19", x: 1342 },
  { label: "Round 1", shortLabel: "Round 1", date: "2026-06-28", x: 1530 },
];

export function Bracket({
  matches,
  adminEditable = false,
  players = [],
}: {
  matches: MatchWithPlayers[];
  adminEditable?: boolean;
  players?: Player[];
}) {
  const [selected, setSelected] = useState<MatchWithPlayers | null>(null);
  const [focusMode, setFocusMode] = useState(false);

  const matchById = useMemo(() => new Map(matches.map((match) => [match.id, match])), [matches]);

  return (
    <>
      <div className="space-y-4">
        <div className="hidden items-center justify-between gap-3 lg:flex">
          <p className="text-sm text-slate-500"></p>
          <Button type="button" variant="outline" className="rounded-lg" onClick={() => setFocusMode(true)}>
            <Maximize2 className="h-4 w-4" />
            Focus Mode
          </Button>
        </div>

        <div className="hidden lg:block">
          <ScaledBracketCanvas matchById={matchById} onSelect={setSelected} heightClass="h-[calc(100vh-255px)] min-h-[420px]" />
        </div>

        <div className="lg:hidden">
          <MobileBracketCarousel
            matches={matches}
            initialRoundLabel={getCurrentRoundLabel()}
            onSelect={setSelected}
          />
        </div>
      </div>

      {focusMode ? (
        <div className="fixed inset-0 z-50 hidden bg-slate-100 p-4 lg:block">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">EM Cup 2026</p>
              <h2 className="text-xl font-bold text-slate-950">Full Bracket View</h2>
            </div>
            <Button type="button" variant="outline" className="rounded-lg bg-white" onClick={() => setFocusMode(false)}>
              <X className="h-4 w-4" />
              Exit
            </Button>
          </div>
          <ScaledBracketCanvas matchById={matchById} onSelect={setSelected} heightClass="h-[calc(100vh-76px)]" />
        </div>
      ) : null}

      {adminEditable ? (
        <AdminMatchEditDialog
          match={selected}
          players={players}
          open={Boolean(selected)}
          onOpenChange={(open) => !open && setSelected(null)}
        />
      ) : (
        <MatchDetails match={selected} open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)} />
      )}
    </>
  );
}

function ScaledBracketCanvas({
  matchById,
  onSelect,
  heightClass,
}: {
  matchById: Map<string, MatchWithPlayers>;
  onSelect: (match: MatchWithPlayers) => void;
  heightClass: string;
}) {
  const { ref, scale } = useBracketScale();
  const final = matchById.get("F1");
  const champion = final?.winner;

  return (
    <div ref={ref} className={`relative overflow-hidden rounded-xl border border-slate-300 bg-slate-100 p-3 ${heightClass}`}>
      <div
        className="absolute left-1/2 top-1/2 origin-center"
        style={{
          width: designWidth,
          height: designHeight,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        <div className="relative h-full w-full">
          <div className="absolute inset-0 rounded-lg bg-slate-100" />
          {headers.map((header) => (
            <div
              key={`${header.label}-${header.x}`}
              className="absolute top-2 text-center"
              style={{ left: header.x, width: cardWidth }}
            >
              <p className="text-lg font-extrabold text-slate-950">{header.shortLabel}</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                {header.label === "Final" ? `By ${formatDate(header.date)}` : formatDate(header.date)}
              </p>
            </div>
          ))}

          <ConnectorLines />

          <div className="absolute left-[765px] top-[240px] z-10 w-[148px] rounded-lg border border-primary/30 bg-white p-3 text-center shadow-none">
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
              <Crown className="h-4 w-4" />
            </div>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-primary">Champion</p>
            <p className="mt-0.5 truncate text-base font-extrabold text-slate-950">
              {champion?.name ?? "TBD"}
            </p>
            <p className="text-[10px] font-medium text-slate-500">Blue Jacket</p>
          </div>

          {nodes.map((node) => {
            const match = matchById.get(node.id);
            if (!match) return null;

            return (
              <div
                key={node.id}
                className="absolute z-10"
                style={{
                  left: node.x,
                  top: node.y,
                  width: cardWidth,
                  height: cardHeight,
                }}
              >
                <MatchCard match={match} onSelect={onSelect} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function useBracketScale() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const updateScale = () => {
      const width = Math.max(element.clientWidth - 24, 1);
      const height = Math.max(element.clientHeight - 24, 1);
      setScale(Math.min(width / designWidth, height / designHeight, 1));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return { ref, scale };
}

function ConnectorLines() {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      viewBox={`0 0 ${designWidth} ${designHeight}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {links.map(([fromId, toId]) => {
        const from = nodeById.get(fromId);
        const to = nodeById.get(toId);
        if (!from || !to) return null;

        const goesRight = from.x < to.x;
        const startX = goesRight ? from.x + cardWidth : from.x;
        const startY = from.y + cardHeight / 2;
        const endX = goesRight ? to.x : to.x + cardWidth;
        const endY = to.y + cardHeight / 2;
        const midX = goesRight ? startX + 18 : startX - 18;

        return (
          <path
            key={`${fromId}-${toId}`}
            d={`M ${startX} ${startY} H ${midX} V ${endY} H ${endX}`}
            fill="none"
            stroke="#b6beca"
            strokeWidth="1.4"
          />
        );
      })}
    </svg>
  );
}

function getCurrentRoundLabel() {
  const now = new Date();
  const year = 2026;
  const dates = {
    round1: new Date(year, 5, 28),
    roundOf16: new Date(year, 6, 19),
    quarterfinal: new Date(year, 7, 16),
    semifinal: new Date(year, 8, 13),
    final: new Date(year, 9, 4),
  };

  if (now < dates.round1) return "Round 1";
  if (now < dates.roundOf16) return "Round of 16";
  if (now < dates.quarterfinal) return "Quarterfinal";
  if (now < dates.semifinal) return "Semifinal";
  return "Final";
}

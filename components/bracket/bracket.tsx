"use client";

import { useMemo, useState } from "react";
import { Crown } from "lucide-react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { BracketRound } from "@/components/bracket/bracket-round";
import { MatchCard } from "@/components/bracket/match-card";
import { MatchDetails } from "@/components/bracket/match-details";
import type { MatchWithPlayers } from "@/lib/types";

const roundOrder = ["Play-In", "Round of 16", "Quarterfinal", "Semifinal", "Final"];

export function Bracket({ matches }: { matches: MatchWithPlayers[] }) {
  const [selected, setSelected] = useState<MatchWithPlayers | null>(null);

  const grouped = useMemo(() => {
    return roundOrder.map((label) => ({
      label,
      matches: matches
        .filter((match) => match.roundLabel === label)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    }));
  }, [matches]);

  const final = matches.find((match) => match.id === "F1");
  const champion = final?.winner;

  return (
    <>
      <div className="space-y-6">
        <Card className="border-primary/20 bg-gradient-to-r from-primary to-[#0a5fb4] text-primary-foreground">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-white/75">Champion</p>
              <p className="mt-1 text-3xl font-bold">{champion?.name ?? "TBD"}</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white/15">
              <Crown className="h-7 w-7" />
            </div>
          </CardContent>
        </Card>

        <div className="hidden overflow-x-auto rounded-[2rem] border border-white/70 bg-white/55 p-4 shadow-xl backdrop-blur-2xl lg:block">
          <div className="grid min-w-[1320px] grid-cols-5 gap-4">
            {grouped.map((round) => (
              <BracketRound
                key={round.label}
                label={round.label}
                matches={round.matches}
                onSelect={setSelected}
                compact={round.label === "Final"}
              />
            ))}
          </div>
        </div>

        <div className="lg:hidden">
          <Accordion
            type="single"
            collapsible
            defaultValue={getCurrentRoundLabel()}
            className="rounded-[2rem] border border-white/70 bg-white/55 px-4 shadow-xl backdrop-blur-2xl"
          >
            {grouped.map((round) => (
              <AccordionItem key={round.label} value={round.label}>
                <AccordionTrigger>
                  <span>{round.label}</span>
                  <span className="ml-auto mr-3 text-xs text-muted-foreground">{round.matches.length} matches</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    {round.matches.map((match) => (
                      <MatchCardMobile key={match.id} match={match} onSelect={setSelected} />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      <MatchDetails match={selected} open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)} />
    </>
  );
}

function getCurrentRoundLabel() {
  const now = new Date();
  const year = 2026;
  const dates = {
    playIn: new Date(year, 5, 28),
    roundOf16: new Date(year, 6, 19),
    quarterfinal: new Date(year, 7, 16),
    semifinal: new Date(year, 8, 13),
    final: new Date(year, 9, 4),
  };

  if (now < dates.playIn) return "Play-In";
  if (now < dates.roundOf16) return "Round of 16";
  if (now < dates.quarterfinal) return "Quarterfinal";
  if (now < dates.semifinal) return "Semifinal";
  return "Final";
}

function MatchCardMobile({
  match,
  onSelect,
}: {
  match: MatchWithPlayers;
  onSelect: (match: MatchWithPlayers) => void;
}) {
  return <MatchCard match={match} onSelect={onSelect} />;
}

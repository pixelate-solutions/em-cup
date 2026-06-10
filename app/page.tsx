import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  Crown,
  Trophy,
  Users,
} from "lucide-react";

import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ACTUAL_PAYMENT_COPY,
  PRIZE_COPY,
  ROUND_DEADLINES,
} from "@/lib/constants";
import { HeroLiveBracketPreview } from "@/components/bracket/hero-live-bracket-preview";
import { getTournamentData } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { players, matches, prizes } = await getTournamentData();
  const completedMatches = matches.filter((match) => match.status === "completed").length;
  const champion = matches.find((match) => match.id === "F1")?.winner;
  const previousWinners = players
    .filter((player) => player.isPreviousWinner)
    .sort((a, b) => b.previousWins - a.previousWins);
  const nextDeadline = getNextDeadline();

  return (
    <div className="bg-white">
      <section className="bg-[radial-gradient(circle_at_18%_18%,rgba(103,178,255,0.34),transparent_26rem),linear-gradient(135deg,#003b7a_0%,#0057ad_48%,#0b76d1_100%)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:py-16">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-100">
              Electro-Matic Golf Tournament
            </p>
            <h1 className="mt-4 max-w-3xl text-5xl font-extrabold tracking-normal text-white sm:text-6xl lg:text-7xl">
              EM Cup 2026
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-50/90">
              Live bracket, match deadlines, handicaps, payouts, and Blue Jacket tracking.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-xl bg-white px-6 text-primary shadow-white/10 hover:bg-blue-50">
                <Link href="/bracket">
                  View Live Bracket
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-xl border-white/30 bg-white/10 px-6 text-white hover:bg-white/18">
                <Link href="/rules">Rules & Payouts</Link>
              </Button>
            </div>
          </div>

          <div className="relative flex items-center">
            <div className="absolute inset-8 rounded-[2rem] bg-[linear-gradient(135deg,#dfefff,#edf8f1)] shadow-lg rotate-[-2deg]" />
            <Link
              href="/bracket"
              className="relative block w-full rounded-[1.75rem] border border-primary/10 bg-white p-3 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="View live EM Cup bracket"
            >
              <HeroLiveBracketPreview matches={matches} />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Players" value={players.length} icon={Users} />
            <StatCard label="Matches Played" value={`${completedMatches} / ${matches.length}`} icon={CalendarCheck} />
            <StatCard label="Next Deadline" value={nextDeadline.shortLabel} icon={CalendarDays} />
            <StatCard label="Champion" value={champion?.name ?? "TBD"} icon={Trophy} />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            25 listed players from the official bracket field, including both John Skope and Nick Skope.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary">Tournament Timeline</p>
          <h2 className="mt-3 text-3xl font-bold text-foreground">Round deadlines</h2>
          <div className="mt-7 divide-y rounded-3xl border bg-white shadow-sm">
            {ROUND_DEADLINES.map((deadline) => (
              <div key={deadline.label} className="flex items-center justify-between gap-4 px-5 py-4">
                <span className="font-semibold text-foreground">{deadline.label}</span>
                <time className="text-sm font-medium text-muted-foreground" dateTime={deadline.date}>
                  {deadline.label === "Final" ? `${formatDate(deadline.date)}` : formatDate(deadline.date)}
                </time>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary">Payouts & Blue Jacket</p>
          <h2 className="mt-3 text-3xl font-bold text-foreground">Top 4 paid out</h2>
          <p className="mt-4 text-muted-foreground">{ACTUAL_PAYMENT_COPY}</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {prizes.slice(0, 4).map((prize) => (
              <div key={prize.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-muted-foreground">{prize.name}</p>
                <p className="mt-1 text-3xl font-bold text-primary">{formatCurrency(prize.amount)}</p>
              </div>
            ))}
          </div>
          <Card className="mt-5 rounded-3xl bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Crown className="h-5 w-5 text-primary" />
                The Blue Jacket
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
              <p>{PRIZE_COPY}</p>
              <p>
                The EM Cup champion receives the coveted Blue Jacket. Repeat winners receive a patch added to their existing jacket.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary">History</p>
              <h2 className="mt-3 text-3xl font-bold text-foreground">Previous Champions</h2>
              <p className="mt-4 text-muted-foreground">
                Past winners set the standard for the bracket. Repeat champions keep the jacket and add another patch.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {previousWinners.map((winner) => (
                <div key={winner.id} className="flex items-center justify-between rounded-2xl border bg-white px-4 py-3 shadow-sm">
                  <span className="font-semibold">{winner.name}</span>
                  <Badge variant="outline">{winner.previousWins}x</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function getNextDeadline() {
  const today = new Date();
  const next = ROUND_DEADLINES.find((deadline) => new Date(`${deadline.date}T23:59:59`) >= today);

  if (!next) {
    return {
      shortLabel: "Complete",
    };
  }

  return {
    shortLabel: `${next.label} ${formatDate(next.date).replace(", 2026", "")}`,
  };
}

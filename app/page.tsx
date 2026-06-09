import Image from "next/image";
import Link from "next/link";
import { CalendarCheck, CircleDollarSign, Users, Trophy } from "lucide-react";

import { DeadlineTimeline } from "@/components/deadline-timeline";
import { PrizeCard } from "@/components/prize-card";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ACTUAL_PAYMENT_COPY, PRIZE_COPY, SITE_SUBTITLE } from "@/lib/constants";
import { getTournamentData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { players, matches, prizes } = await getTournamentData();
  const completedMatches = matches.filter((match) => match.status === "completed").length;
  const champion = matches.find((match) => match.id === "F1")?.winner;
  const previousWinners = players.filter((player) => player.isPreviousWinner).sort((a, b) => b.previousWins - a.previousWins);

  return (
    <div className="golf-surface">
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_460px] lg:px-8 lg:py-12">
        <div className="flex flex-col justify-center">
          <Image src="/em-logo.png" alt="Electro-Matic logo" width={230} height={58} className="mb-6 h-auto w-56" priority />
          <Badge className="w-fit bg-white text-primary shadow-sm">{SITE_SUBTITLE}</Badge>
          <h1 className="mt-5 max-w-3xl text-5xl font-bold tracking-normal text-primary sm:text-6xl">EM Cup</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            Live bracket, match deadlines, player handicaps, results, payouts, and Blue Jacket tracking for the Electro-Matic golf tournament.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/bracket">View Bracket</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/players">View Players</Link>
            </Button>
          </div>
        </div>
        <div className="liquid-glass relative aspect-[1.62] min-h-80 overflow-hidden rounded-[2rem] border border-white/70 p-3 shadow-2xl">
          <Image
            src="/images/em-cup-bracket.png"
            alt="EM Cup official bracket artwork"
            fill
            className="object-contain p-3"
            priority
          />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <StatCard label="Players" value={players.length} icon={Users} />
        <StatCard label="Matches Completed" value={`${completedMatches}/${matches.length}`} icon={CalendarCheck} />
        <StatCard label="Buy-In" value="$100" icon={CircleDollarSign} />
        <StatCard label="Champion" value={champion?.name ?? "TBD"} icon={Trophy} />
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-12 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
        <div className="space-y-6">
          <DeadlineTimeline />
          <Card>
            <CardHeader>
              <CardTitle>Blue Jacket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{ACTUAL_PAYMENT_COPY}</p>
              <p>{PRIZE_COPY}</p>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {prizes.slice(0, 4).map((prize) => (
              <PrizeCard key={prize.id} prize={prize} />
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Previous Winners</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {previousWinners.map((winner) => (
                <div key={winner.id} className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/60 px-3 py-2 backdrop-blur">
                  <span className="font-medium">{winner.name}</span>
                  <Badge variant="outline">{winner.previousWins}x</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

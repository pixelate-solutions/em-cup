import { DeadlineTimeline } from "@/components/deadline-timeline";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ACTUAL_PAYMENT_COPY, PRIZE_COPY } from "@/lib/constants";
import { getPlayers, getPrizes } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RulesPage() {
  const [players, prizes] = await Promise.all([getPlayers(), getPrizes()]);
  const previousWinners = players.filter((player) => player.isPreviousWinner).sort((a, b) => b.previousWins - a.previousWins);

  return (
    <div className="golf-surface">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-primary">Rules</h1>
            <p className="mt-2 text-muted-foreground">Tournament format, buy-in, payouts, handicaps, and finals guidance.</p>
          </div>

          <Card>
            <CardHeader><CardTitle>Buy-In and Payouts</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>{ACTUAL_PAYMENT_COPY}</p>
              <p>{PRIZE_COPY}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {prizes.slice(0, 4).map((prize) => (
                  <div key={prize.id} className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/60 px-3 py-2 backdrop-blur">
                    <span className="font-medium text-foreground">{prize.name}</span>
                    <Badge>{formatCurrency(prize.amount)}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Handicap Rules</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>Matches are played off the lower handicap.</p>
              <p>Example: if a 5 handicap plays a 10, the 5 handicap gives strokes on the 5 most difficult holes.</p>
              <p>Handicap is determined based on GHIN index on the day of the match.</p>
              <p>When matches are completed, results should be emailed to the tournament organizer.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Finals Note</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                If someone in the Semi-Finals is from outside Michigan, the tournament may try to do 36 holes in one day for the Semi-Finals and Finals, similar to past years.
              </p>
              <p>
                This will be determined once the first two rounds are completed. The finals have traditionally been held at Great Oaks, and unless there are extenuating circumstances, that should be the intention again.
              </p>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <DeadlineTimeline />
          <Card>
            <CardHeader><CardTitle>Previous Winners</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {previousWinners.map((winner) => (
                <div key={winner.id} className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/60 px-3 py-2 text-sm backdrop-blur">
                  <span className="font-medium">{winner.name}</span>
                  <Badge variant="outline">{winner.previousWins}x</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

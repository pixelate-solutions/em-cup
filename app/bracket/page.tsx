import { Bracket } from "@/components/bracket/bracket";
import { DeadlineTimeline } from "@/components/deadline-timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMatches } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function BracketPage() {
  const matches = await getMatches();

  return (
    <div className="golf-surface">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-bold text-primary">Live Bracket</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Tap any match to view handicap strokes, deadline, schedule, location, status, and result.
          </p>
        </div>
        <Bracket matches={matches} />
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <DeadlineTimeline />
          <Card>
            <CardHeader>
              <CardTitle>Bracket Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Play-In winners advance to face the players already placed in the Round of 16.</p>
              <p>Slots with pending upstream results display TBD or Winner of the relevant match.</p>
              <p>Completed winners are highlighted and eliminated players are muted.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

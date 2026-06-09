import { PlayersList } from "@/components/players-list";
import { getMatches, getPlayers } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const [players, matches] = await Promise.all([getPlayers(), getMatches()]);

  return (
    <div className="golf-surface">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-bold text-primary">Players</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Player list with handicap indexes, payment status, prior winners, and current tournament status.
          </p>
        </div>
        <PlayersList players={players} matches={matches} />
      </div>
    </div>
  );
}

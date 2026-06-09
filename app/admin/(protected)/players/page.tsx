import { AdminPlayerEditor } from "@/components/admin/admin-player-editor";
import { getMatches, getPlayers } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminPlayersPage() {
  const [players, matches] = await Promise.all([getPlayers(), getMatches()]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">Players</h2>
        <p className="mt-1 text-sm text-muted-foreground">Edit handicap indexes, payment status, notes, and player tournament state.</p>
      </div>
      <AdminPlayerEditor players={players} matches={matches} />
    </div>
  );
}

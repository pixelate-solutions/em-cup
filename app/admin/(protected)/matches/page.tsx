import { AdminMatchEditor } from "@/components/admin/admin-match-editor";
import { getMatches, getPlayers } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminMatchesPage() {
  const [matches, players] = await Promise.all([getMatches(), getPlayers()]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">Matches</h2>
        <p className="mt-1 text-sm text-muted-foreground">Update players, schedules, locations, notes, statuses, winners, and cleared results.</p>
      </div>
      <AdminMatchEditor matches={matches} players={players} />
    </div>
  );
}

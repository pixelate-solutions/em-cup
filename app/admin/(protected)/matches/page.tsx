import { AdminMatchBracketEditor } from "@/components/admin/admin-match-bracket-editor";
import { getMatches, getPlayers } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminMatchesPage() {
  const [matches, players] = await Promise.all([getMatches(), getPlayers()]);

  return (
    <div>
      <AdminMatchBracketEditor matches={matches} players={players} />
    </div>
  );
}

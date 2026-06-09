import { AdminPrizeEditor } from "@/components/admin/admin-prize-editor";
import { getMatches, getPlayers, getPrizes } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminPrizesPage() {
  const [prizes, players, matches] = await Promise.all([getPrizes(), getPlayers(), getMatches()]);

  return (
    <div>
      <AdminPrizeEditor prizes={prizes} players={players} matches={matches} />
    </div>
  );
}

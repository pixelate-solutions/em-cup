import { AdminPrizeEditor } from "@/components/admin/admin-prize-editor";
import { getMatches, getPlayers, getPrizes } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminPrizesPage() {
  const [prizes, players, matches] = await Promise.all([getPrizes(), getPlayers(), getMatches()]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">Prizes</h2>
        <p className="mt-1 text-sm text-muted-foreground">Assign payout winners, Blue Jacket, and repeat winner patch.</p>
      </div>
      <AdminPrizeEditor prizes={prizes} players={players} matches={matches} />
    </div>
  );
}

import { AdminPaymentEditor } from "@/components/admin/admin-payment-editor";
import { getMatches, getPlayers } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminPlayersPage() {
  const [players, matches] = await Promise.all([getPlayers(), getMatches()]);

  return (
    <div>
      <AdminPaymentEditor players={players} matches={matches} />
    </div>
  );
}

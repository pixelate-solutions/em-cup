import { AdminPaymentEditor } from "@/components/admin/admin-payment-editor";
import { ACTUAL_PAYMENT_COPY } from "@/lib/constants";
import { getPlayers } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const players = await getPlayers();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">Payments</h2>
        <p className="mt-1 text-sm text-muted-foreground">{ACTUAL_PAYMENT_COPY}</p>
      </div>
      <AdminPaymentEditor players={players} />
    </div>
  );
}

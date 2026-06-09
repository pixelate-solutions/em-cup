"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";

import { updatePaymentAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaymentStatusBadge } from "@/components/player-badge";
import { StatCard } from "@/components/stat-card";
import type { Player } from "@/db/schema";
import { BUY_IN_AMOUNT } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

export function AdminPaymentEditor({ players }: { players: Player[] }) {
  const paidCount = players.filter((player) => player.hasPaid).length;
  const unpaidCount = players.length - paidCount;
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const stats = useMemo(
    () => [
      { label: "Collected", value: formatCurrency(paidCount * BUY_IN_AMOUNT) },
      { label: "Paid", value: paidCount },
      { label: "Unpaid", value: unpaidCount },
      { label: "Expected", value: formatCurrency(players.length * BUY_IN_AMOUNT) },
    ],
    [paidCount, players.length, unpaidCount],
  );

  function updatePayment(playerId: number, hasPaid: boolean) {
    startTransition(async () => {
      try {
        await updatePaymentAction({ playerId, hasPaid });
        toast.success("Payment updated");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Payment update failed");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} icon={CreditCard} />
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Tournament Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((player) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">{player.name}</TableCell>
                  <TableCell><PaymentStatusBadge paid={player.hasPaid} /></TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => updatePayment(player.id, !player.hasPaid)}
                    >
                      {player.hasPaid ? "Mark unpaid" : "Mark paid"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

import { Gift } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PrizeWithWinner } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function PrizeCard({ prize }: { prize: PrizeWithWinner }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-3 text-base">
          <span>{prize.name}</span>
          <Gift className="h-4 w-4 text-primary" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-2xl font-semibold text-primary">{formatCurrency(prize.amount)}</p>
        {prize.description ? <p className="text-sm text-muted-foreground">{prize.description}</p> : null}
        <p className="text-sm font-medium">Winner: {prize.winner?.name ?? "TBD"}</p>
      </CardContent>
    </Card>
  );
}

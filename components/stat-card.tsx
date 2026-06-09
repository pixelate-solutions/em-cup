import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
}) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold text-primary">{value}</p>
        </div>
        {Icon ? (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/8 text-primary">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </CardContent>
    </Card>
  );
}

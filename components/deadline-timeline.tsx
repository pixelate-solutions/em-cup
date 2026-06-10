import { CalendarDays } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUND_DEADLINES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export function DeadlineTimeline() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          Tournament Deadlines
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4">
          {ROUND_DEADLINES.map((deadline) => (
            <li key={deadline.label} className="flex items-center justify-between gap-4 border-l-2 border-primary/25 pl-4">
              <span className="font-medium">{deadline.label}</span>
              <time className="text-sm text-muted-foreground" dateTime={deadline.date}>
                {deadline.label === "Final" ? `${formatDate(deadline.date)}` : formatDate(deadline.date)}
              </time>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

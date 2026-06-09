import { Badge } from "@/components/ui/badge";
import type { Match } from "@/db/schema";

export function StatusBadge({ status }: { status: Match["status"] }) {
  const variant = status === "completed" ? "success" : status === "scheduled" ? "warning" : "secondary";
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return <Badge variant={variant}>{label}</Badge>;
}

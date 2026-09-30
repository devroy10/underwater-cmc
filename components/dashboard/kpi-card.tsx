import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  tone?: "underwater" | "profit";
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="flex size-7 items-center justify-center rounded-md bg-muted">
            <Icon className="size-3.5" />
          </span>
          <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
        </div>
        <div
          className={
            tone === "underwater"
              ? "tabular text-3xl font-semibold text-underwater"
              : tone === "profit"
                ? "tabular text-3xl font-semibold text-profit"
                : "tabular text-3xl font-semibold text-foreground"
          }
        >
          {value}
        </div>
        {sub ? <div className="text-xs text-muted-foreground">{sub}</div> : null}
      </CardContent>
    </Card>
  );
}

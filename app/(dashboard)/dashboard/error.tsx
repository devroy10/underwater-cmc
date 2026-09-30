"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-[1400px] px-5 py-16">
      <Card className="w-full">
        <CardContent className="flex flex-col items-start gap-4">
          <div>
            <h2 className="font-heading text-lg font-medium">The dashboard failed to load</h2>
            <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
          </div>
          <Button onClick={reset}>Try again</Button>
        </CardContent>
      </Card>
    </div>
  );
}

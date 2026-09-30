import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-5 py-8">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent>
            <Skeleton className="h-72 w-full" />
          </CardContent>
        </Card>
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-14 w-32" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent>
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-3">
            <Skeleton className="h-4 w-48" />
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

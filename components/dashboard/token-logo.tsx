import Image from "next/image";
import { cmcLogoUrl } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Token logo served from the CoinMarketCap CDN. */
export function TokenLogo({
  id,
  symbol,
  size = 20,
  className,
}: {
  id: number;
  symbol: string;
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={cmcLogoUrl(id)}
      alt={symbol}
      width={size}
      height={size}
      unoptimized
      className={cn("shrink-0 rounded-full bg-muted object-cover", className)}
    />
  );
}

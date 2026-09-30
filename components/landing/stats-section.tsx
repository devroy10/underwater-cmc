import Image from "next/image";
import { mobileStats, stats } from "@/lib/landing/content";
import type { Stat } from "@/lib/landing/types";

export function StatsSection() {
  return (
    <section className="relative hidden bg-[#f8f9fc] xl:block">
      <Divider position="top" />
      <div className="relative z-10 flex w-full justify-center gap-2.5 px-10 py-20">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>
    </section>
  );
}

export function MobileStatsSection() {
  return (
    <section className="flex flex-col items-center gap-16 bg-[#f8f9fc] px-6 py-20 xl:hidden">
      {mobileStats.map((stat) => (
        <StatCard key={stat.label} stat={stat} />
      ))}
    </section>
  );
}

function StatCard({ stat }: { stat: Stat }) {
  return (
    <div className="flex w-[282px] max-w-full flex-col items-center gap-1.5 rounded-md p-6">
      <span className="text-center font-display text-[52px] leading-[60px] tracking-[-1.56px] text-[#111117]">
        {stat.value}
      </span>
      <span className="text-center text-sm leading-6 text-[#111117]">
        {stat.label}
      </span>
    </div>
  );
}

export function Divider({ position }: { position: "top" | "bottom" }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 z-0 h-[78px] overflow-hidden"
      style={position === "top" ? { top: 0 } : { bottom: 0 }}
    >
      <Image
        src={
          position === "top"
            ? "/images/divider-top.png"
            : "/images/divider-bottom.png"
        }
        alt=""
        width={4317}
        height={position === "top" ? 145 : 149}
        className="h-full w-full object-cover"
      />
    </div>
  );
}

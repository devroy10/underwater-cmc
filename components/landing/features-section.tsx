import Image from "next/image";
import { features } from "@/lib/landing/content";
import { cn } from "@/lib/utils";
import type { Feature } from "@/lib/landing/types";

const spanClass: Record<Feature["span"], string> = {
  1: "xl:col-span-1",
  2: "xl:col-span-2",
};

export function FeaturesSection() {
  return (
    <section className="bg-white px-6 pt-[60px] pb-8 md:px-10">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10">
        <h2 className="max-w-[960px] text-center font-display text-[32px] leading-10 tracking-[-1px] text-[#010110] xl:text-left xl:text-[42px] xl:leading-[48px] xl:tracking-[-1.26px]">
          See the market through its{" "}
          <span className="text-[#70707d]">cost basis</span>
        </h2>
        <div className="flex flex-col gap-8 xl:grid xl:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <article
      className={cn(
        "relative flex flex-col overflow-hidden rounded-lg bg-[#f4f5fa]",
        feature.image && "xl:block xl:h-[450px]",
        spanClass[feature.span],
      )}
    >
      <div
        className={cn(
          "relative z-10 p-6",
          feature.image && "xl:absolute xl:inset-x-0 xl:top-0 xl:p-8 xl:pt-6",
        )}
      >
        <h3 className="text-[18px] leading-6 font-normal text-[#111117] xl:text-[22px] xl:leading-7">
          {feature.title}
        </h3>
        <p className="mt-2.5 max-w-[504px] text-[14px] leading-5 font-light text-[#2e2e3d]">
          {feature.description}
        </p>
      </div>
      {feature.image ? (
        <div className="relative aspect-[16/10] w-full xl:absolute xl:inset-0 xl:aspect-auto xl:h-full">
          <Image
            src={feature.image}
            alt=""
            fill
            sizes={
              feature.span === 2
                ? "(min-width: 1200px) 66vw, 100vw"
                : "(min-width: 1200px) 33vw, 100vw"
            }
            className="rounded-lg object-cover"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-[#f4f5fa] via-[#f4f5fa]/80 to-transparent"
          />
        </div>
      ) : null}
    </article>
  );
}

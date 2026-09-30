import Image from "next/image";
import { Divider } from "@/components/landing/stats-section";
import { findings } from "@/lib/landing/content";
import type { Finding } from "@/lib/landing/types";

export function FindingsSection() {
  return (
    <section className="relative bg-[#f8f9fc] px-6 pt-14 pb-[158px] md:px-10">
      <Divider position="bottom" />
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10">
        <h2 className="text-center font-display text-[32px] leading-10 tracking-[-1px] text-[#010110] xl:text-left xl:text-[42px] xl:leading-[48px] xl:tracking-[-1.26px]">
          <span className="text-[#70707d]">See what the </span>
          data reveals
        </h2>
        <div className="flex flex-col items-center gap-4 xl:grid xl:grid-cols-4 xl:items-stretch xl:gap-5">
          {findings.map((finding) => (
            <FindingCard key={finding.title} finding={finding} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FindingCard({ finding }: { finding: Finding }) {
  return (
    <article className="relative block h-[420px] w-[286px] max-w-full shrink-0 overflow-hidden rounded-lg">
      <Image
        src={finding.image}
        alt={finding.alt}
        fill
        sizes="(min-width: 1200px) 286px, 286px"
        className="object-cover"
      />
      <span className="relative z-10 block px-5 pt-[82px] pb-8 text-[18px] leading-6 text-[#111117]">
        {finding.title}
      </span>
    </article>
  );
}

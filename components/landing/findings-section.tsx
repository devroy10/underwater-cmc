import { Divider } from "@/components/landing/stats-section";
import { findings } from "@/lib/landing/content";

export function FindingsSection() {
  return (
    <section className="relative bg-[#f8f9fc] px-6 pt-14 pb-[158px] md:px-10">
      <Divider position="bottom" />
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10">
        <h2 className="text-center font-display text-[32px] leading-10 tracking-[-1px] text-[#010110] xl:text-left xl:text-[42px] xl:leading-[48px] xl:tracking-[-1.26px]">
          <span className="text-[#70707d]">See what the </span>
          data reveals
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5">
          {findings.map((finding, index) => (
            <article
              key={finding.title}
              className="flex flex-col gap-2 rounded-sm border border-dashed border-[#010110]/20 bg-white p-6"
            >
              <p className="font-mono text-4xl decoration-dashed tabular-nums text-[#90909d]">
                {String(index + 1).padStart(2, "0")}
              </p>
              <p className="text-[18px] leading-6 text-[#111117]">{finding.title}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

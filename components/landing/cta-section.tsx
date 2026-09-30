import { CtaButtons } from "@/components/landing/cta-buttons";
import { Divider } from "@/components/landing/stats-section";

export function CtaSection() {
  return (
    <section className="relative bg-[#f8f9fc]">
      <Divider position="top" />
      <div className="relative z-10 mx-auto flex w-full max-w-[816px] flex-col items-center gap-8 px-6 pt-20 pb-16 text-center md:px-10">
        <h2 className="font-display text-[40px] leading-[48px] tracking-[-1.2px] text-[#010110] xl:text-[58px] xl:leading-16 xl:tracking-[-1.74px]">
          See where the market is trapped
          <br />
          <span className="text-[#70707d]">Open the dashboard</span>
        </h2>
        <p className="max-w-[599px] text-lg leading-7 text-black xl:text-xl xl:leading-[30px]">
          Explore the underwater index, the cost-basis map, and your own
          portfolio in seconds.
        </p>
        <CtaButtons className="justify-center" />
      </div>
      <Divider position="bottom" />
    </section>
  );
}

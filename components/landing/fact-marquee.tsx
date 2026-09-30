import { marqueeItems } from "@/lib/landing/content";

export function FactMarquee() {
  const items = [...marqueeItems, ...marqueeItems];
  return (
    <section className="w-full overflow-hidden bg-white py-5">
      <div className="marquee-track flex w-max items-center">
        {items.map((label, index) => (
          <div
            key={`${label}-${index}`}
            className="flex shrink-0 items-center gap-6 px-6 text-sm text-[#70707d]"
          >
            <span className="whitespace-nowrap">{label}</span>
            <span className="text-[#d3d3dd]">/</span>
          </div>
        ))}
      </div>
    </section>
  );
}

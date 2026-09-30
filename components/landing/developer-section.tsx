"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { developerItems } from "@/lib/landing/content";
import { cn } from "@/lib/utils";

export function DeveloperSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 0;
      const index = Math.min(
        developerItems.length - 1,
        Math.floor(progress * developerItems.length),
      );
      setActiveIndex(index);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section className="hidden bg-white xl:block">
      <div
        ref={containerRef}
        className="relative"
        style={{ height: `${developerItems.length * 80}vh` }}
      >
        <div className="sticky top-0 flex h-screen items-center">
          <div className="mx-auto flex w-full max-w-[1200px] gap-[100px] px-10">
            <div className="relative h-[600px] w-[550px] shrink-0 overflow-hidden rounded-xl bg-[#f4f5fa]">
              {developerItems.map((item, index) => (
                <Image
                  key={item.title}
                  src={item.image}
                  alt=""
                  fill
                  sizes="550px"
                  className={cn(
                    "object-cover transition-opacity duration-500 ease-out",
                    index === activeIndex ? "opacity-100" : "opacity-0",
                  )}
                />
              ))}
            </div>

            <div className="flex w-[550px] flex-col gap-[72px] pt-[10px]">
              <h2 className="font-display text-[42px] leading-[48px] tracking-[-1.26px] text-[#010110]">
                <span className="text-[#70707d]">Built on real data.</span>
                <br />
                Not on vibes.
              </h2>
              <div className="flex w-[400px] flex-col gap-[42px]">
                {developerItems.map((item, index) => {
                  const active = index === activeIndex;
                  return (
                    <div key={item.title} className="flex flex-col text-left">
                      <span
                        className={cn(
                          "font-display text-[26px] leading-8 tracking-[-0.26px] transition-colors duration-200",
                          active ? "text-[#111117]" : "text-[#70707d]",
                        )}
                      >
                        {item.title}
                      </span>
                      <span
                        className={cn(
                          "grid transition-[grid-template-rows] duration-300 ease-out",
                          active ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                        )}
                      >
                        <span className="overflow-hidden">
                          <span className="block max-w-[320px] pt-2 text-[14px] leading-[1.35] text-[#737373]">
                            {item.description}
                          </span>
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

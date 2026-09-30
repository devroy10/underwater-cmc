import Image from "next/image";
import { CtaButtons } from "@/components/landing/cta-buttons";
import { CoinMarketCapIcon } from "@/components/landing/icons";

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-[#8b84e8] xl:bg-[#f8f9fc]">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(160deg,#7d76e0_0%,#9a8ff0_45%,#c7a9f2_100%)] xl:hidden"
      />

      <div className="relative z-10 hidden h-[677px] w-full items-center gap-10 xl:flex">
        <div className="flex w-[46%] flex-col justify-center gap-[34px] pl-[60px]">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2 text-[#70707d]">
              <CoinMarketCapIcon className="h-5 w-5" />
              <span className="text-sm font-medium">
                Powered by CoinMarketCap
              </span>
            </div>
            <h1 className="max-w-[560px] font-display text-[58px] leading-16 tracking-[-1.74px] text-[#010110]">
              Half the market is{" "}
              <span className="text-[#70707d]">underwater</span>
            </h1>
            <p className="max-w-[520px] text-xl leading-[30px] text-black">
              View the hidden cost basis of 200+ crypto assets, and the supply waiting
              to break even.
            </p>
          </div>
          <CtaButtons />
        </div>
        <div className="relative h-full flex-1">
          <Image
            src="/images/hero.png"
            alt="UNDERWATER dashboard, cost-basis map, and underwater index"
            fill
            priority
            quality={90}
            sizes="(min-width: 1200px) 52vw, 100vw"
            className="object-cover object-left"
          />
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center px-6 pt-16 text-center xl:hidden">
        <div className="mb-5 flex items-center gap-2 text-white/80">
          <CoinMarketCapIcon className="h-5 w-5" />
          <span className="text-sm font-medium">Powered by CoinMarketCap</span>
        </div>
        <h1 className="font-display text-[34px] leading-10 tracking-[-1px] text-white sm:text-[44px] sm:leading-[52px]">
          Half the market is{" "}
          <span className="text-white/70">underwater</span>
        </h1>
        <p className="mt-5 max-w-[520px] text-base leading-6 text-white/90 sm:text-lg sm:leading-7">
          The hidden cost basis of 200 crypto assets, and the supply waiting to
          break even.
        </p>
        <CtaButtons className="mt-8 justify-center" />
        <Image
          src="/images/hero.png"
          alt="UNDERWATER dashboard, cost-basis map, and underwater index"
          width={2511}
          height={1500}
          priority
          unoptimized
          sizes="100vw"
          className="mt-10 h-auto w-full"
        />
      </div>
    </section>
  );
}

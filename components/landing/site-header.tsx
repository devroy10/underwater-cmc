import Link from "next/link";
import Image from "next/image";
import { UnderwaterIcon } from "@/components/landing/icons";

export function SiteHeader() {
  return (
    <header className="relative z-50 w-full bg-white">
      <div className="flex h-[72px] w-full items-center justify-between px-4 py-4 lg:px-12">
        <Link
          href="/"
          aria-label="Underwater home"
          className="flex h-9 items-center gap-2.5 text-[#010110]"
        >
          <UnderwaterIcon className="h-8 w-8" />
          <Image
            src="/wordmark.svg"
            alt="Underwater"
            width={913}
            height={154}
            unoptimized
            className="h-[28px] w-auto"
          />
        </Link>
        <Link
          href="/dashboard"
          className="flex h-9 items-center rounded-sm bg-[#111117] px-5 text-sm font-medium text-white transition-colors hover:bg-[#2a2a33]"
        >
          Get started
        </Link>
      </div>
    </header>
  );
}

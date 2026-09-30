import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="relative z-50 w-full bg-white">
      <div className="flex h-[72px] w-full items-center justify-between px-4 py-4 md:px-6">
        <Link
          href="/"
          aria-label="UNDERWATER home"
          className="flex h-10 items-center"
        >
          <span className="font-display text-xl tracking-[-0.4px] text-[#010110]">
            UNDERWATER
          </span>
        </Link>
        <Link
          href="/dashboard"
          className="flex h-9 items-center rounded-full bg-[#111117] px-5 text-sm font-medium text-white transition-colors hover:bg-[#2a2a33]"
        >
          Get started
        </Link>
      </div>
    </header>
  );
}

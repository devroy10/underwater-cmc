import Link from "next/link";
import { GithubIcon } from "@/components/landing/icons";
import { cn } from "@/lib/utils";

const REPO_URL = "https://github.com/devroy10/underwater-cmc";

export function CtaButtons({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2.5", className)}>
      <Link
        href="/dashboard"
        className="flex h-9 items-center rounded-full bg-[#111117] px-5 text-sm font-medium text-white transition-colors hover:bg-[#2a2a33]"
      >
        Get started
      </Link>
      <Link
        href={REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-9 items-center gap-2 rounded-full border border-[#010110] bg-white px-5 text-sm font-medium text-[#010110] transition-colors hover:bg-[#010110] hover:text-white"
      >
        <GithubIcon className="h-4 w-4" />
        View docs
      </Link>
    </div>
  );
}

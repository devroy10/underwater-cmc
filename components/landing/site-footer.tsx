export function SiteFooter() {
  return (
    <footer className="w-full bg-white px-6 py-12 md:px-10">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-start justify-between gap-4 border-t border-black/5 pt-8 sm:flex-row sm:items-center">
        <span className="font-display text-lg text-[#010110]">UNDERWATER</span>
        <p className="text-xs text-black/50">
          ©2026 UNDERWATER. Built for the Build with CMC API Hackathon.
        </p>
      </div>
    </footer>
  );
}

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-surface-container-lowest/80">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-heading text-lg font-bold text-surface-tint">EventFlow</p>
          <p className="mt-1 font-sans text-xs uppercase tracking-[0.2em] text-on-surface-variant">
            Precision logistics © {new Date().getFullYear()}
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-on-surface-variant" aria-label="Footer">
          <Link href="/#solutions" className="transition hover:text-surface-tint">
            Privacy Policy
          </Link>
          <Link href="/#contact" className="transition hover:text-surface-tint">
            Terms of Service
          </Link>
          <Link href="/hiringDetails" className="transition hover:text-surface-tint">
            Hire / support
          </Link>
        </nav>
        <div className="flex gap-3">
          <span className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-on-surface-variant">
            in
          </span>
          <span className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-on-surface-variant">
            𝕏
          </span>
        </div>
      </div>
    </footer>
  );
}

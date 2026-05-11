import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <p className="label-caps text-surface-tint">404</p>
      <h1 className="mt-4 font-heading text-h2 text-on-background">Signal lost</h1>
      <p className="mt-3 max-w-md text-on-surface-variant">
        That route is not registered in this deployment. Return to the directory or open the landing experience.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Link
          href="/events"
          className="rounded-xl bg-surface-tint px-6 py-3 font-heading text-sm font-semibold text-on-secondary shadow-[0_0_18px_rgba(81,153,245,0.35)]"
        >
          View events
        </Link>
        <Link href="/" className="rounded-xl border border-white/15 px-6 py-3 text-sm text-on-background hover:bg-white/5">
          Home
        </Link>
      </div>
    </div>
  );
}

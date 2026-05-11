import Link from "next/link";
import { Suspense } from "react";
import { FaceRegistrationForm } from "./FaceRegistrationForm";

export const metadata = {
  title: "Face Registration",
};

export default function RegisterPage() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden overflow-y-auto bg-background font-sans text-on-background">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-1/2 w-1/2 rounded-full bg-secondary-container/20 blur-[120px]" />
        <div className="absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-surface-tint/10 blur-[120px]" />
        <div className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 bg-glow opacity-50" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-2xl px-4 py-12 sm:px-10">
        <div className="mb-8 w-full text-center sm:mb-10">
          <h1 className="font-heading text-h1 tracking-tighter text-surface-tint drop-shadow-[0_0_12px_rgba(81,153,245,0.4)]">
            EventFlow
          </h1>
          <p className="label-caps mt-2 text-on-surface-variant">Intelligent precision logistics</p>
        </div>

        <div className="mx-auto w-full min-w-0 max-w-[min(100%,26rem)] sm:max-w-[28.5rem]">
          <Suspense
            fallback={
              <div className="glass-card w-full min-w-0 rounded-xl border border-white/10 bg-surface-container-low/40 p-10 text-center text-on-surface-variant">
                Loading…
              </div>
            }
          >
            <FaceRegistrationForm />
          </Suspense>
        </div>

        <div className="mt-10 w-full text-center">
          <Link href="/login" className="text-sm text-on-surface-variant transition hover:text-surface-tint">
            Already registered? Login here
          </Link>
        </div>
      </div>

      <div className="pointer-events-none fixed bottom-6 left-6 z-0 hidden space-y-1 font-mono text-xs text-surface-tint opacity-30 lg:block">
        <p>LOC_SYST: ACTIVE</p>
        <p>LAT: 40.7128 | LONG: -74.0060</p>
        <p>ENC_STAT: SHA-256_VERIFIED</p>
      </div>

      <div className="pointer-events-none fixed left-0 top-0 z-[5] h-px w-full bg-gradient-to-r from-transparent via-surface-tint/50 to-transparent" />
    </div>
  );
}
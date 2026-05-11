import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Login",
};

export default function LoginPage() {
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
          <LoginForm />
        </div>

        <div className="mt-10 w-full text-center">
          <Link href="/" className="text-sm text-on-surface-variant transition hover:text-surface-tint">
            ← Back to home
          </Link>
        </div>
      </div>

      <div className="pointer-events-none fixed left-0 top-0 z-[5] h-px w-full bg-gradient-to-r from-transparent via-surface-tint/50 to-transparent" />
    </div>
  );
}

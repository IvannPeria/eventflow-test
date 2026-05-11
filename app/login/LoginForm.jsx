"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Lock, ScanFace, User } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/lib/auth-context";

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [username, setUsername] = useState("urri");
  const [password, setPassword] = useState("123");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");

  const fromRaw = searchParams.get("from");
  const safeFrom =
    fromRaw && fromRaw.startsWith("/") && !fromRaw.startsWith("//") ? fromRaw : "/events";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const result = await login(username, password);
    if (!result?.ok) {
      setError(result?.error || "Invalid username or password.");
      return;
    }
    router.push(safeFrom);
    router.refresh();
  }

  return (
    <div className="glass-card w-full min-w-[min(100%,17rem)] max-w-full rounded-2xl border border-white/10 bg-surface-container-low/60 p-8 shadow-[0_0_40px_rgba(0,0,0,0.35)] sm:p-10">
      <div className="relative mx-auto mb-8 h-24 w-24 overflow-hidden rounded-2xl border border-surface-tint/30 sm:mb-10">
        <div className="absolute inset-0 flex items-center justify-center bg-surface-tint/5">
          <ScanFace className="size-10 text-surface-tint opacity-80" aria-hidden />
        </div>
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-2">
          <div className="flex justify-between">
            <div className="h-2 w-2 border-l-2 border-t-2 border-surface-tint" />
            <div className="h-2 w-2 border-r-2 border-t-2 border-surface-tint" />
          </div>
          <div className="flex justify-between">
            <div className="h-2 w-2 border-b-2 border-l-2 border-surface-tint" />
            <div className="h-2 w-2 border-b-2 border-r-2 border-surface-tint" />
          </div>
        </div>
        <div className="face-scan-line pointer-events-none absolute left-0 top-0 z-20 w-full" />
      </div>

      <div className="mb-6 text-center">
        <h2 className="font-heading text-2xl font-semibold text-on-surface sm:text-h3">Secure portal</h2>
        <p className="mt-2 text-sm text-on-surface-variant sm:text-base">Access your event dashboard</p>
        <p className="mt-3 text-xs leading-relaxed text-on-surface-variant/80">
          Demo: username <strong className="text-on-background">urri</strong> · password{" "}
          <strong className="text-on-background">123</strong>
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <Input
          label="Username"
          name="username"
          autoComplete="username"
          placeholder="urri"
          leftIcon={User}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="123"
          leftIcon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error ? (
          <p className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-between px-1 py-1">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="rounded border-white/20 bg-transparent text-surface-tint focus:ring-surface-tint focus:ring-offset-background"
            />
            <span className="text-[10px] font-heading uppercase tracking-widest text-on-surface-variant">
              Remember me
            </span>
          </label>
          <Link
            href="/"
            className="text-[10px] font-heading uppercase tracking-widest text-surface-tint hover:text-primary-fixed"
          >
            Emergency reset
          </Link>
        </div>

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-surface-tint to-brand-deep py-4 text-base font-semibold text-on-secondary shadow-[0_0_18px_rgba(81,153,245,0.35)] transition duration-300 hover:shadow-[0_0_26px_rgba(81,153,245,0.55)] active:scale-[0.98] sm:text-lg"
        >
          <span>Log in</span>
          <ArrowRight className="size-5" aria-hidden />
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-xs text-on-surface-variant/60">Protected by EventFlow platform security</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="label-caps rounded-full border border-white/5 bg-white/5 px-4 py-2 text-on-surface-variant/60 transition hover:border-surface-tint/20 hover:text-surface-tint"
          >
            Technical support
          </Link>
          <Link
            href="/"
            className="label-caps rounded-full border border-white/5 bg-white/5 px-4 py-2 text-on-surface-variant/60 transition hover:border-surface-tint/20 hover:text-surface-tint"
          >
            Documentation
          </Link>
        </div>
      </div>
    </div>
  );
}

export function LoginForm() {
  return (
    <Suspense
      fallback={
        <div className="glass-card w-full min-w-0 rounded-xl border border-white/10 bg-surface-container-low/40 p-10 text-center text-on-surface-variant">
          Loading…
        </div>
      }
    >
      <LoginFormInner />
    </Suspense>
  );
}

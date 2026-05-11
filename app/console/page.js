"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function ConsolePage() {
  const { ready, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      router.replace("/login?from=%2Fdashboard%3Fpanel%3Dattendance");
      return;
    }
    router.replace("/dashboard?panel=attendance");
  }, [ready, isAuthenticated, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-on-surface-variant">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-on-surface-variant">
      Redirecting…
    </div>
  );
}

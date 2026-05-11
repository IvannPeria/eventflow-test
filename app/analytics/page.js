"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function AnalyticsRedirectPage() {
  const { ready, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      router.replace("/login?from=%2Fdashboard%3Fpanel%3Danalytics");
      return;
    }
    router.replace("/dashboard?panel=analytics");
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

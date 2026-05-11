"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function RequireRole({ role, children, redirectTo }) {
  const { ready, isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      router.replace(redirectTo || "/login?from=%2Fdashboard");
      return;
    }
    if (role && user?.role !== role) {
      router.replace("/dashboard");
    }
  }, [ready, isAuthenticated, role, user?.role, router, redirectTo]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-on-surface-variant">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated || (role && user?.role !== role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-on-surface-variant">
        Redirecting…
      </div>
    );
  }

  return children;
}


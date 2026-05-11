import { Suspense } from "react";
import { OperationsShell } from "@/components/operations/OperationsShell";

export const metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-on-surface-variant">
          Loading…
        </div>
      }
    >
      <OperationsShell />
    </Suspense>
  );
}

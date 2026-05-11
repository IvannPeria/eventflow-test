"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BarChart2, Bell, Box, HelpCircle, LayoutDashboard, Scan, Settings, UserCheck, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { operationsHref, parseOperationsPanel } from "@/components/operations/panel-routes";
import { AnalyticsPanel } from "@/components/operations/panels/AnalyticsPanel";
import { AttendancePanel } from "@/components/operations/panels/AttendancePanel";
import { DashboardOverviewPanel } from "@/components/operations/panels/DashboardOverviewPanel";
import { ParticipantsPanel } from "@/components/operations/panels/ParticipantsPanel";

const AVATAR_ADMIN =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCdcj-Obv62XxaSwdptQCJZ6WLDvJAEX0BFcnHN1-NZ4HW__yvAe2ndNAF8EEHCpAmBedb6G4WAXlRNfJYF0AaJc8TX2Q0w0kosnB8s7awbqiYzW7X70KC6n6a3-NUo3uz5-3Mfa_5e3DmB4CnAyVmNB8bWiNQgQjXZ15eOK-Q39ge8pGIpjE-O_UvC_Z2myz84Nzif1rjaw9PZ0bl10jNVK4F3x0bGdozZuyC4T4LaNoxmkKZuonDHyJD7e565OOXXPOMhnG-PuA";

function ShellNavItem({ panel, current, icon: Icon, label, compact = false }) {
  const href = operationsHref(panel);
  const active = current === panel;
  return (
    <Link
      href={href}
      scroll={false}
      className={`flex items-center rounded-xl font-heading uppercase tracking-widest transition-all duration-300 ease-out ${
        compact ? "flex-col gap-0.5 p-2" : "gap-4 border-r-4 border-transparent px-4 py-3 text-sm"
      } ${
        active
          ? compact
            ? "text-[#4285F4] drop-shadow-[0_0_5px_rgba(66,133,244,0.55)]"
            : "border-[#4285F4] bg-[#4285F4]/10 text-[#4285F4] shadow-[inset_0_0_15px_rgba(66,133,244,0.1)]"
          : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
      }`}
    >
      <Icon className="size-5 shrink-0" strokeWidth={active ? 2.2 : 1.8} />
      <span className={compact ? "font-heading text-[10px] font-bold" : ""}>{label}</span>
    </Link>
  );
}

function PanelSwitch({ panel }) {
  switch (panel) {
    case "overview":
      return <DashboardOverviewPanel />;
    case "attendance":
      return <AttendancePanel />;
    case "participants":
      return <ParticipantsPanel />;
    case "analytics":
      return <AnalyticsPanel />;
    default:
      return <DashboardOverviewPanel />;
  }
}

export function OperationsShell() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { ready: authReady, isAuthenticated } = useAuth();

  const panel = useMemo(() => parseOperationsPanel(searchParams.get("panel")), [searchParams]);

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated) {
      const q = panel === "overview" ? "" : `?panel=${panel}`;
      router.replace(`/login?from=${encodeURIComponent(`/dashboard${q}`)}`);
    }
  }, [authReady, isAuthenticated, router, panel]);

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-on-surface-variant">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-on-surface-variant">
        Redirecting…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 font-sans text-on-background lg:pb-12">
      <nav className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-white/10 bg-slate-950/60 px-4 shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-md sm:px-6">
        <Link
          href={operationsHref("overview")}
          scroll={false}
          className="font-heading text-2xl font-black tracking-tighter text-[#4285F4] drop-shadow-[0_0_8px_rgba(66,133,244,0.5)]"
        >
          EventFlow
        </Link>
        <div className="hidden items-center gap-6 font-heading text-sm font-medium tracking-wide md:flex">
          <ShellNavItem panel="overview" current={panel} icon={LayoutDashboard} label="Dashboard" />
          <ShellNavItem panel="attendance" current={panel} icon={UserCheck} label="Attendance" />
          <ShellNavItem panel="participants" current={panel} icon={Users} label="Participants" />
          <ShellNavItem panel="analytics" current={panel} icon={BarChart2} label="Analytics" />
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/events"
            className="hidden rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/5 sm:inline"
          >
            Events
          </Link>
          <button type="button" className="text-slate-400 transition hover:text-[#4285F4] active:scale-95" aria-label="Notifications">
            <Bell className="size-5" />
          </button>
          <button type="button" className="text-slate-400 transition hover:text-[#4285F4] active:scale-95" aria-label="Settings">
            <Settings className="size-5" />
          </button>
          <Image src={AVATAR_ADMIN} alt="" width={32} height={32} className="rounded-full border border-[#4285F4]/30" />
        </div>
      </nav>

      <aside className="fixed left-0 top-16 z-40 hidden h-[calc(100vh-4rem)] w-64 flex-col border-r border-white/5 bg-slate-950/80 py-8 backdrop-blur-2xl lg:flex">
        <div className="mb-10 px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg border border-[#4285F4]/20 bg-[#4285F4]/10">
              <Box className="size-5 text-[#4285F4]" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-[#4285F4]">EventFlow</h2>
              <p className="font-heading text-[10px] uppercase tracking-[0.2em] text-slate-500">Precision logistics</p>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-2 px-3">
          <ShellNavItem panel="overview" current={panel} icon={LayoutDashboard} label="Dashboard" />
          <ShellNavItem panel="attendance" current={panel} icon={UserCheck} label="Attendance" />
          <ShellNavItem panel="participants" current={panel} icon={Users} label="Participants" />
          <ShellNavItem panel="analytics" current={panel} icon={BarChart2} label="Analytics" />
        </div>
        <div className="space-y-2 border-t border-white/5 px-3 pt-6">
          <Link
            href="/"
            className="flex items-center gap-4 rounded-xl px-4 py-3 font-heading text-sm uppercase tracking-widest text-slate-500 transition-all hover:bg-white/5 hover:text-slate-300"
          >
            <HelpCircle className="size-5 shrink-0" strokeWidth={1.8} />
            Support
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-4 rounded-xl px-4 py-3 font-heading text-sm uppercase tracking-widest text-slate-500 transition-all hover:bg-white/5 hover:text-slate-300"
          >
            <Settings className="size-5 shrink-0" strokeWidth={1.8} />
            Settings
          </Link>
        </div>
      </aside>

      <main className="min-w-0 pt-16 lg:ml-64">
        <PanelSwitch panel={panel} />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-20 items-center justify-around rounded-t-2xl border-t border-white/10 bg-slate-900/90 px-1 pb-safe backdrop-blur-xl shadow-[0_-8px_30px_rgba(0,0,0,0.5)] lg:hidden">
        <ShellNavItem panel="overview" current={panel} icon={LayoutDashboard} label="Home" compact />
        <ShellNavItem panel="attendance" current={panel} icon={Scan} label="Scan" compact />
        <ShellNavItem panel="participants" current={panel} icon={Users} label="People" compact />
        <ShellNavItem panel="analytics" current={panel} icon={BarChart2} label="Stats" compact />
      </nav>
    </div>
  );
}

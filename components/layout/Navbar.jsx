"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, Menu, Settings, UserRound, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const marketingLinks = [
  { href: "/", label: "Home" },
  { href: "/#solutions", label: "Solutions" },
  { href: "/#contact", label: "Contact" },
  { href: "/#about", label: "About" },
  { href: "/register", label: "Register" },
  { href: "/attendance_scanner", label: "Attendance Scanner" },
  { href: "/attendance_checkout", label: "Attendance Checkout" },
];

const appLinks = [
  { href: "/requests", label: "Requests" },
  { href: "/events", label: "Events" },
  { href: "/events/new", label: "Create" },
  { href: "/profile", label: "Profile" },
];

function isActive(pathname, href) {
  if (href === "/") return pathname === "/";
  if (href.startsWith("/#")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar({ variant = "marketing" }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const [open, setOpen] = useState(false);
  const links =
    variant === "marketing"
      ? marketingLinks
      : user?.role === "operator"
        ? appLinks
        : appLinks.filter((l) => l.href !== "/requests");

  function handleSignOut() {
    logout();
    router.push("/");
    router.refresh();
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/60 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="font-heading text-xl font-black tracking-tighter text-surface-tint drop-shadow-[0_0_8px_rgba(81,153,245,0.45)] sm:text-2xl"
        >
          EventFlow
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
          {links.map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href + label}
                href={href}
                className={`font-heading text-sm font-medium tracking-wide transition-colors ${
                  active
                    ? "border-b-2 border-surface-tint pb-0.5 text-surface-tint"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {label}
              </Link>
            );
          })}
          {variant === "marketing" ? (
            <Link
              href="/hiringDetails"
              className="rounded-full bg-gradient-to-r from-surface-tint to-brand-deep px-4 py-2 text-sm font-semibold text-on-secondary shadow-[0_0_16px_rgba(81,153,245,0.35)] transition hover:shadow-[0_0_24px_rgba(81,153,245,0.5)]"
            >
              Hire EventFlow
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleSignOut}
              className="text-sm text-slate-400 transition hover:text-surface-tint"
            >
              Sign out
            </button>
          )}
        </nav>

        {variant === "marketing" ? null : (
          <div className="hidden items-center gap-3 md:flex">
            <button
              type="button"
              className="rounded-lg p-2 text-slate-400 transition hover:text-surface-tint focus-visible:ring-2 focus-visible:ring-surface-tint/50"
              aria-label="Notifications"
            >
              <Bell className="size-5" />
            </button>
            <button
              type="button"
              className="rounded-lg p-2 text-slate-400 transition hover:text-surface-tint focus-visible:ring-2 focus-visible:ring-surface-tint/50"
              aria-label="Settings"
            >
              <Settings className="size-5" />
            </button>
            <Link
              href="/profile"
              className="flex size-9 items-center justify-center rounded-full border border-surface-tint/30 bg-surface-container-high text-on-surface-variant transition hover:border-surface-tint/60"
              aria-label="Account"
            >
              <UserRound className="size-4" />
            </Link>
          </div>
        )}

        <button
          type="button"
          className="inline-flex rounded-lg p-2 text-on-background md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
          <span className="sr-only">Menu</span>
        </button>
      </div>

      {open ? (
        <div id="mobile-nav" className="border-t border-white/10 bg-slate-950/95 px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {links.map(({ href, label }) => (
              <Link
                key={`m-${href}-${label}`}
                href={href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 font-heading text-sm font-medium text-on-background hover:bg-white/5"
              >
                {label}
              </Link>
            ))}
            {variant === "marketing" ? (
              <Link
                href="/hiringDetails"
                onClick={() => setOpen(false)}
                className="mt-2 rounded-xl bg-surface-tint px-3 py-3 text-center text-sm font-semibold text-on-secondary"
              >
                Hire EventFlow
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleSignOut}
                className="mt-2 rounded-xl border border-white/10 px-3 py-3 text-center text-sm font-semibold text-on-background"
              >
                Sign out
              </button>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

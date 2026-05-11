"use client";

import { useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, MapPin, Users } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useEvents } from "@/lib/events-context";
import { useAuth } from "@/lib/auth-context";

function formatRange(startIso, endIso) {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const opts = { month: "short", day: "numeric", year: "numeric" };
  return `${s.toLocaleDateString(undefined, opts)} · ${s.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} – ${e.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
}

export function EventDetailView() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const { resolveEvent, ready: eventsReady } = useEvents();
  const { isAuthenticated, ready: authReady } = useAuth();

  const event = useMemo(() => {
    if (typeof id !== "string") return null;
    return resolveEvent(id);
  }, [id, resolveEvent]);

  useEffect(() => {
    if (!eventsReady || !authReady || typeof id !== "string") return;
    if (!event) router.replace("/events");
  }, [eventsReady, authReady, event, id, router]);

  useEffect(() => {
    if (event?.title) document.title = `${event.title} | EventFlow`;
  }, [event?.title]);

  if (!eventsReady || !authReady || !event) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar variant="app" />
        <main className="flex flex-1 items-center justify-center text-on-surface-variant">Loading…</main>
        <Footer />
      </div>
    );
  }

  const pct = Math.min(100, Math.round((event.registered / event.capacity) * 100));
  const isDataImage = typeof event.image === "string" && event.image.startsWith("data:");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar variant="app" />
      <main className="flex-1 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/events"
            className="mb-8 inline-flex items-center gap-2 text-sm text-on-surface-variant transition hover:text-surface-tint"
          >
            <ArrowLeft className="size-4" aria-hidden />
            All events
          </Link>

          <div className="glass-panel overflow-hidden rounded-3xl border border-white/10">
            <div className="relative aspect-[21/9] w-full sm:aspect-[24/9]">
              {isDataImage ? (
                // eslint-disable-next-line @next/next/no-img-element -- data URLs from local file upload
                <img src={event.image} alt="" className="absolute inset-0 size-full object-cover" />
              ) : (
                <Image src={event.image} alt={event.title} fill className="object-cover" priority sizes="100vw" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
                <span
                  className={`label-caps mb-3 inline-block rounded-full px-3 py-1 ${
                    event.status === "live"
                      ? "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/30"
                      : event.status === "past"
                        ? "bg-white/10 text-on-surface-variant"
                        : "bg-surface-tint/20 text-surface-tint ring-1 ring-surface-tint/30"
                  }`}
                >
                  {event.status}
                </span>
                <h1 className="font-heading text-h2 text-on-background sm:text-4xl">{event.title}</h1>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-on-surface-variant">
                  <span className="inline-flex items-center gap-2">
                    <Calendar className="size-4 text-surface-tint" aria-hidden />
                    {formatRange(event.date, event.endDate)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="size-4 text-surface-tint" aria-hidden />
                    {event.location}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-3 sm:p-10">
              <div className="glass-panel rounded-2xl border border-white/5 p-5 sm:col-span-2">
                <h2 className="font-heading text-lg text-on-background">Overview</h2>
                <p className="mt-3 leading-relaxed text-on-surface-variant">{event.description}</p>
              </div>
              <div className="space-y-4">
                <div className="glass-panel rounded-2xl border border-white/5 p-5">
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <Users className="size-4 text-surface-tint" aria-hidden />
                    <span className="label-caps">Capacity</span>
                  </div>
                  <p className="mt-2 font-heading text-2xl text-on-background">
                    {event.registered.toLocaleString()}
                    <span className="text-base font-normal text-on-surface-variant">
                      {" "}
                      / {event.capacity.toLocaleString()}
                    </span>
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-900">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-800 to-surface-tint shadow-[0_0_10px_rgba(81,153,245,0.35)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                {isAuthenticated ? (
                  <Link
                    href="/dashboard?panel=attendance"
                    className="flex w-full items-center justify-center rounded-xl border border-[#4285F4]/40 bg-[#4285F4]/10 py-3 font-heading text-sm font-semibold text-[#4285F4] transition hover:bg-[#4285F4]/20"
                  >
                    Open attendance
                  </Link>
                ) : (
                  <Link
                    href={`/login?from=${encodeURIComponent("/dashboard?panel=attendance")}`}
                    className="flex w-full items-center justify-center rounded-xl border border-surface-tint/30 py-3 font-heading text-sm font-semibold text-surface-tint transition hover:bg-surface-tint/10"
                  >
                    Sign in for attendance
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { EventCard } from "@/components/events/EventCard";
import { useEvents } from "@/lib/events-context";
import { useAuth } from "@/lib/auth-context";

export function EventsPageClient() {
  const { events, removeEvent, ready } = useEvents();
  const { isAuthenticated, ready: authReady } = useAuth();

  if (!ready || !authReady) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar variant="app" />
        <main className="flex flex-1 items-center justify-center px-6 text-on-surface-variant">Loading…</main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar variant="app" />
      <main className="flex-1 px-4 py-10 sm:px-6">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="w-full min-w-0 max-w-2xl">
              <p className="label-caps text-surface-tint">Operations</p>
              <h1 className="font-heading text-h2 text-on-background">Events</h1>
              <p className="mt-3 text-base leading-relaxed text-on-surface-variant">
                Browse active programs, open registrations, and archived runs. Select an event to open its command
                view.
              </p>
            </div>
            {isAuthenticated ? (
              <Link
                href="/events/new"
                className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-gradient-to-r from-surface-tint to-brand-deep px-5 py-3 font-heading text-sm font-semibold text-on-secondary shadow-[0_0_18px_rgba(81,153,245,0.35)] transition hover:shadow-[0_0_26px_rgba(81,153,245,0.5)] lg:self-auto"
              >
                <Plus className="size-4" aria-hidden />
                New event
              </Link>
            ) : null}
          </div>

          {events.length === 0 ? (
            <div className="glass-panel mx-auto w-full max-w-3xl rounded-3xl border border-white/10 px-6 py-16 text-center sm:px-10">
              <p className="font-heading text-lg text-on-background">
                {isAuthenticated ? "Your workspace is empty" : "No demo events to show"}
              </p>
              <p className="mx-auto mt-4 max-w-xl text-balance text-base leading-relaxed text-on-surface-variant">
                {isAuthenticated
                  ? "Create an event to see it listed here. Demo data is only available before you sign in."
                  : "All sample events were removed, or you are signed in with an empty catalog."}
              </p>
              {isAuthenticated ? (
                <Link
                  href="/events/new"
                  className="mt-8 inline-flex rounded-xl bg-surface-tint px-6 py-3 font-heading text-sm font-semibold text-on-secondary"
                >
                  Create event
                </Link>
              ) : (
                <Link href="/" className="mt-8 inline-flex text-sm text-surface-tint underline-offset-4 hover:underline">
                  Back to home
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} onRemove={() => removeEvent(event.id)} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

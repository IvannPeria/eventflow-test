"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAttendanceLog } from "@/lib/attendance-log-context";
import { useEvents } from "@/lib/events-context";
import { operationsHref } from "@/components/operations/panel-routes";

function formatLocal(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function DashboardOverviewPanel() {
  const { events, ready: eventsReady } = useEvents();
  const { logs, recentRfid, ready: logReady } = useAttendanceLog();

  const stats = useMemo(() => {
    let approved = 0;
    let rejected = 0;
    for (const l of logs) {
      if (l.decision === "approved") approved += 1;
      else rejected += 1;
    }
    return { approved, rejected };
  }, [logs]);

  const ready = eventsReady && logReady;
  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-on-surface-variant">
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-6 sm:px-6">
      <div>
        <p className="label-caps text-surface-tint">Operations</p>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="glass-panel rounded-2xl border border-white/10 p-5">
          <p className="text-sm text-on-surface-variant">Active & upcoming</p>
          <p className="mt-1 font-heading text-3xl font-bold">{events.length}</p>
        </div>
        <div className="glass-panel rounded-2xl border border-emerald-500/20 p-5">
          <p className="text-sm text-on-surface-variant">Approved check-ins</p>
          <p className="mt-1 font-heading text-3xl font-bold text-emerald-300">{stats.approved}</p>
        </div>
        <div className="glass-panel rounded-2xl border border-error/20 p-5">
          <p className="text-sm text-on-surface-variant">Rejected / blocked</p>
          <p className="mt-1 font-heading text-3xl font-bold text-error">{stats.rejected}</p>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="font-heading text-xl font-semibold">Active events</h2>
          <Link href="/events/new" className="text-sm text-surface-tint hover:underline">
            + New event
          </Link>
        </div>
        {events.length === 0 ? (
          <div className="glass-panel rounded-2xl border border-dashed border-white/15 p-10 text-center text-on-surface-variant">
            No events yet.{" "}
            <Link href="/events/new" className="text-surface-tint hover:underline">
              Create one
            </Link>
            .
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {events.map((e) => (
              <li key={e.id} className="glass-panel rounded-2xl border border-white/10 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-on-background">{e.title}</p>
                    <p className="mt-1 truncate text-sm text-on-surface-variant">{e.location}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-xs uppercase text-on-surface-variant">
                    {e.status ?? "—"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-heading text-xl font-semibold">Recent RFID & attendance</h2>
          <Link href={operationsHref("attendance")} scroll={false} className="text-sm text-surface-tint hover:underline">
            Go to attendance
          </Link>
        </div>
        <div className="glass-panel overflow-hidden rounded-2xl border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.03] font-heading text-xs uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Attendee</th>
                  <th className="px-4 py-3">RFID</th>
                  <th className="px-4 py-3">Decision</th>
                </tr>
              </thead>
              <tbody>
                {recentRfid.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-on-surface-variant">
                      No log entries yet. Run a check-in from{" "}
                      <Link href={operationsHref("attendance")} scroll={false} className="text-surface-tint hover:underline">
                        Attendance
                      </Link>
                      .
                    </td>
                  </tr>
                ) : (
                  recentRfid.map((row) => (
                    <tr key={row.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                      <td className="whitespace-nowrap px-4 py-3 text-on-surface-variant">{formatLocal(row.timestamp)}</td>
                      <td className="max-w-[200px] truncate px-4 py-3">{row.eventTitle}</td>
                      <td className="px-4 py-3 font-medium">{row.attendeeName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-surface-tint/90">{row.rfidTag}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            row.decision === "approved"
                              ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-300"
                              : "rounded-full bg-error/15 px-2 py-0.5 text-error"
                          }
                        >
                          {row.decision}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

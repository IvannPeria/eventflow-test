"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAttendanceLog } from "@/lib/attendance-log-context";
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

export function ParticipantsPanel() {
  const { participants, ready } = useAttendanceLog();

  const sorted = useMemo(
    () => [...participants].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [participants],
  );

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-on-surface-variant">
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-6">
        <p className="label-caps text-surface-tint">Attendance</p>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Participants</h1>
        <p className="mt-1 text-sm text-on-surface-variant">Attendees with an approved check-in.</p>
      </div>

      <div className="glass-panel overflow-hidden rounded-2xl border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.03] font-heading text-xs uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">RFID</th>
                <th className="px-4 py-3">Last approved</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-on-surface-variant">
                    No approved attendees yet. Approve a check-in from{" "}
                    <Link href={operationsHref("attendance")} scroll={false} className="text-surface-tint hover:underline">
                      Attendance
                    </Link>
                    .
                  </td>
                </tr>
              ) : (
                sorted.map((p) => (
                  <tr key={`${p.eventId}-${p.attendeeName}`} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium">{p.attendeeName}</td>
                    <td className="max-w-[220px] truncate px-4 py-3">{p.eventTitle}</td>
                    <td className="px-4 py-3 font-mono text-xs text-surface-tint/90">{p.rfidTag}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-on-surface-variant">{formatLocal(p.timestamp)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

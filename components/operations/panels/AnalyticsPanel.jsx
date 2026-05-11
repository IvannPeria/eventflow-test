"use client";

import { useId, useMemo } from "react";
import { useAttendanceLog } from "@/lib/attendance-log-context";

const DAY_MS = 86400000;

function lastNDaysKeys(n) {
  const out = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now.getTime() - i * DAY_MS);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export function AnalyticsPanel() {
  const fillId = useId().replace(/:/g, "");
  const { logs, ready } = useAttendanceLog();

  const { keys, approved, rejected, maxY } = useMemo(() => {
    const keysInner = lastNDaysKeys(14);
    const approvedInner = keysInner.map(() => 0);
    const rejectedInner = keysInner.map(() => 0);
    const idx = (k) => keysInner.indexOf(k);

    for (const l of logs) {
      const day = l.timestamp.slice(0, 10);
      const i = idx(day);
      if (i < 0) continue;
      if (l.decision === "approved") approvedInner[i] += 1;
      else rejectedInner[i] += 1;
    }

    const base = Math.max(4, ...approvedInner, ...rejectedInner, 1);
    return { keys: keysInner, approved: approvedInner, rejected: rejectedInner, maxY: base };
  }, [logs]);

  const W = 720;
  const H = 260;
  const pad = 40;
  const innerW = W - pad * 2;
  const innerH = H - pad * 2;

  const linePath = (series) => {
    if (keys.length < 2) return "";
    return series
      .map((v, i) => {
        const x = pad + (innerW * i) / (keys.length - 1);
        const y = pad + innerH - (innerH * v) / maxY;
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ");
  };

  const pathApproved = linePath(approved);
  const pathRejected = linePath(rejected);

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
        <p className="label-caps text-surface-tint">Reporting</p>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-on-surface-variant">Check-ins per day from this session.</p>
      </div>

      <div className="glass-panel rounded-2xl border border-white/10 p-6">
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-2 text-sm">
            <span className="size-2 rounded-full bg-emerald-400" />
            Approved
          </span>
          <span className="flex items-center gap-2 text-sm">
            <span className="size-2 rounded-full bg-rose-400" />
            Rejected
          </span>
        </div>
        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="min-h-[240px] w-full max-w-full text-on-surface-variant" role="img" aria-label="Attendance per day">
            <defs>
              <linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgb(52 211 153)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="rgb(52 211 153)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 0.25, 0.5, 0.75, 1].map((t) => {
              const y = pad + innerH * (1 - t);
              return (
                <g key={t}>
                  <line x1={pad} y1={y} x2={W - pad} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                  <text x={4} y={y + 4} fontSize="10" fill="currentColor" opacity="0.5">
                    {Math.round(maxY * t)}
                  </text>
                </g>
              );
            })}
            {pathApproved ? (
              <path d={`${pathApproved} L ${pad + innerW},${pad + innerH} L ${pad},${pad + innerH} Z`} fill={`url(#${fillId})`} opacity="0.9" />
            ) : null}
            <path d={pathApproved} fill="none" stroke="rgb(52 211 153)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            <path d={pathRejected} fill="none" stroke="rgb(251 113 133)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="6 4" />
            {keys.map((k, i) => {
              const x = pad + (innerW * i) / (keys.length - 1 || 1);
              const show = i % 2 === 1 || keys.length <= 8;
              return show ? (
                <text key={k} x={x} y={H - 8} fontSize="9" textAnchor="middle" fill="currentColor" opacity="0.55">
                  {k.slice(5)}
                </text>
              ) : null;
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  History,
  LineChart,
  Nfc,
  Power,
  QrCode,
  UserCheck,
  XCircle,
  Zap,
} from "lucide-react";
import { useAttendanceLog } from "@/lib/attendance-log-context";
import { useEvents } from "@/lib/events-context";

const HALL_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDNICiXX6B-2kaZr0obfk4FdTQyKIb1ZFyqXjEZSC76WUxr2Q_ces6c-RAMoxdc5vqkBlXbyO4n4P1Rw9W8O-U7qy9PGe5Bb_ZvfYo7IgMqRqbKRuIyWlM9SqpiQa5BD-x-NF0rrDEV-G1jupCniKDnRHXbQef6hqjjQsCijzevTsfte8Quo1qn52bVOssZDMqyUyliH7YDg7zsmt7fZT6bJjpilrXpzGj4s5_xN7H33QNe4U2_w_ji2VOOMG5UgI7EiMDdvDSKug";

/** @type {{ name: string; tag: string; passType: string }[]} */
const RFID_ROSTER = [
  { name: "Sarah Jenkins", tag: "RFID-PREM-8821", passType: "Premium pass" },
  { name: "Marcus Thorne", tag: "RFID-GEN-4410", passType: "General entry" },
  { name: "Elena Rodriguez", tag: "RFID-STF-2291", passType: "Staff access" },
  { name: "James Okonkwo", tag: "RFID-VIP-1104", passType: "VIP lane" },
];

function formatTimeAgo(iso) {
  const t = new Date(iso).getTime();
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function AttendancePanel() {
  const { events, ready: eventsReady, resolveEvent } = useEvents();
  const { logs, appendLog, recentRfid, ready: logReady } = useAttendanceLog();

  const [userSessionEventId, setUserSessionEventId] = useState("");
  const [phase, setPhase] = useState("rfid");
  const [mode, setMode] = useState("checkin");
  /** @type {null | { name: string; tag: string; passType: string; eventId: string; eventTitle: string }} */
  const [pending, setPending] = useState(null);
  const [pendingEmail, setPendingEmail] = useState("");
  const [cameraError, setCameraError] = useState(null);
  const [faceScore] = useState(() => 96 + Math.floor(Math.random() * 4));
  /** @type {'approved'|'rejected'|null} */
  const [sessionOutcome, setSessionOutcome] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const sessionEventId = userSessionEventId || events[0]?.id || "";

  const sessionEvent = useMemo(
    () => (sessionEventId ? resolveEvent(sessionEventId) : null),
    [sessionEventId, resolveEvent],
  );

  const sessionTitle = sessionEvent?.title ?? "Check-in session";

  const eventWindow = useMemo(() => {
    const start = sessionEvent?.date || null;
    const end = sessionEvent?.endDate || null;
    return { start, end };
  }, [sessionEvent]);

  const occupancy = useMemo(() => {
    if (!sessionEvent?.capacity) return { current: 0, max: 1, pct: 0 };
    const extra = logs.filter((l) => l.eventId === sessionEventId && l.decision === "approved" && (l.kind || "checkin") === "checkin").length;
    const base = typeof sessionEvent.registered === "number" ? sessionEvent.registered : 0;
    const current = Math.min(base + extra, sessionEvent.capacity);
    const pct = Math.round((current / sessionEvent.capacity) * 100);
    return { current, max: sessionEvent.capacity, pct };
  }, [logs, sessionEvent, sessionEventId]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (phase !== "face" || !pending) {
      stopCamera();
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (e) {
        if (!cancelled) setCameraError(e instanceof Error ? e.message : "Camera unavailable");
      }
    })();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [phase, pending, stopCamera]);

  const simulateRfidSuccess = useCallback(() => {
    if (!sessionEventId || !sessionEvent) return;
    const roll = Math.random();
    if (roll < 0.12) {
      appendLog({
        id: `log-${Date.now()}`,
        eventId: sessionEventId,
        eventTitle: sessionEvent.title,
        attendeeName: "Unknown holder",
        rfidTag: `RFID-UNK-${Math.floor(Math.random() * 9000 + 1000)}`,
        timestamp: new Date().toISOString(),
        decision: "rejected",
        lastStage: "rfid",
      });
      setPhase("rfid");
      setPending(null);
      return;
    }
    const pick = RFID_ROSTER[Math.floor(Math.random() * RFID_ROSTER.length)];
    setPending({
      ...pick,
      eventId: sessionEventId,
      eventTitle: sessionEvent.title,
    });
    setPendingEmail("");
    setPhase("face");
  }, [appendLog, sessionEvent, sessionEventId]);

  const completeFace = useCallback(
    async (decision) => {
      if (!pending) return;
      const kind = mode === "checkout" ? "checkout" : "checkin";
      appendLog({
        id: `log-${Date.now()}`,
        eventId: pending.eventId,
        eventTitle: pending.eventTitle,
        attendeeName: pending.name,
        attendeeEmail: pendingEmail || null,
        rfidTag: pending.tag,
        timestamp: new Date().toISOString(),
        decision,
        lastStage: "complete",
        kind,
      });

      if (decision === "approved" && kind === "checkout" && pendingEmail) {
        try {
          const checkIn = logs.find(
            (l) =>
              l.decision === "approved" &&
              (l.kind || "checkin") === "checkin" &&
              l.eventId === pending.eventId &&
              l.attendeeName === pending.name,
          );

          await fetch("/api/attendance/checkout", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              attendeeEmail: pendingEmail,
              attendeeName: pending.name,
              eventTitle: pending.eventTitle,
              eventStart: eventWindow.start,
              eventEnd: eventWindow.end,
              checkInAt: checkIn?.timestamp || null,
              checkOutAt: new Date().toISOString(),
            }),
          });
        } catch {
          // ignore email failures in demo UI
        }
      }

      setSessionOutcome(decision);
      setPhase("result");
      setTimeout(() => {
        setPhase("rfid");
        setPending(null);
        setPendingEmail("");
        setSessionOutcome(null);
      }, 2200);
    },
    [appendLog, pending, pendingEmail, mode, logs, eventWindow.start, eventWindow.end],
  );

  const ready = eventsReady && logReady;

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-4 pb-8 pt-2 sm:px-6">
      <div className="col-span-12 mb-4 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0 w-full flex-1">
          <span className="label-caps mb-2 block text-[#4285F4]">Live session</span>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-on-background lg:text-4xl">
            {sessionTitle} — {mode === "checkout" ? "Check-out" : "Check-in"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">Scan RFID first, then confirm with the camera when it opens.</p>
        </div>
        <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:gap-4 xl:w-auto xl:shrink-0">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
            <label className="label-caps shrink-0 text-on-surface-variant">Event</label>
            <select
              value={sessionEventId}
              onChange={(e) => setUserSessionEventId(e.target.value)}
              disabled={!ready || events.length === 0}
              className="glass-panel w-full min-w-0 rounded-xl border border-white/10 bg-slate-950/50 px-4 py-2.5 font-sans text-sm text-on-background focus:border-[#4285F4]/50 focus:outline-none sm:min-w-[220px]"
            >
              {events.length === 0 ? (
                <option value="">No events — create one in Events</option>
              ) : (
                events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="glass-panel flex items-center gap-2 rounded-xl px-4 py-2">
              <span className="font-heading text-[10px] uppercase tracking-widest text-slate-400">Mode</span>
              <button
                type="button"
                onClick={() => setMode("checkin")}
                className={`rounded-lg px-2.5 py-1 font-heading text-[10px] uppercase tracking-widest transition ${
                  mode === "checkin" ? "bg-[#4285F4]/15 text-[#4285F4]" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Check-in
              </button>
              <button
                type="button"
                onClick={() => setMode("checkout")}
                className={`rounded-lg px-2.5 py-1 font-heading text-[10px] uppercase tracking-widest transition ${
                  mode === "checkout" ? "bg-[#4285F4]/15 text-[#4285F4]" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Check-out
              </button>
            </div>
            <div className="glass-panel flex items-center gap-3 rounded-xl px-4 py-2">
              <div className="size-2 animate-pulse rounded-full bg-green-400" />
              <span className="font-mono text-xs text-on-surface-variant sm:text-sm">
                {phase === "face" ? "CAMERA: LIVE" : "CAMERA: STANDBY"}
              </span>
            </div>
            <div className="glass-panel flex items-center gap-3 rounded-xl px-4 py-2">
              <Nfc className="size-4 text-[#4285F4]" />
              <span className="font-mono text-xs text-on-surface-variant sm:text-sm">
                {phase === "rfid" ? "STEP 1: RFID" : phase === "face" ? "STEP 2: FACE" : "COMPLETE"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="col-span-12 space-y-6 lg:col-span-8">
        <div className="glass-panel group relative aspect-video w-full min-w-0 overflow-hidden rounded-3xl border border-[#4285F4]/10 shadow-2xl">
          {phase === "rfid" ? (
            <>
              <Image src={HALL_IMG} alt="" fill className="object-cover brightness-75 grayscale-[20%]" sizes="(max-width:1024px) 100vw, 66vw" priority />
              <div className="pointer-events-none absolute inset-0">
                <div className="scanning-line-operator" />
              </div>
              <div className="absolute inset-0 flex w-full flex-col items-center justify-center gap-6 bg-slate-950/50 px-6 py-8 text-center backdrop-blur-sm">
                <div className="rfid-pulse-operator flex size-20 shrink-0 items-center justify-center rounded-full border border-[#4285F4]/50 glass-panel">
                  <Nfc className="size-10 text-[#4285F4]" />
                </div>
                <div className="w-full max-w-lg min-w-0">
                  <p className="font-heading text-lg uppercase tracking-widest text-[#4285F4]">Scan RFID</p>
                  <p className="mt-3 text-sm leading-relaxed text-on-surface-variant text-balance">
                    Present a badge, then use the button below to simulate a successful read. Unknown tags are rejected without opening the camera.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!sessionEventId}
                  onClick={simulateRfidSuccess}
                  className="shrink-0 rounded-xl bg-[#4285F4] px-8 py-3 font-heading text-sm uppercase tracking-widest text-white shadow-lg shadow-[#4285F4]/30 transition hover:brightness-110 disabled:opacity-40"
                >
                  Simulate RFID read
                </button>
              </div>
            </>
          ) : phase === "face" && pending ? (
            <>
              {cameraError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950 p-8 text-center">
                  <AlertCircle className="size-12 text-amber-400" />
                  <p className="text-on-surface-variant">{cameraError}</p>
                  <p className="text-sm text-on-surface-variant/80">You can still approve or reject manually.</p>
                </div>
              ) : (
                <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" playsInline muted autoPlay />
              )}
              <div className="pointer-events-none absolute inset-0">
                <div className="scanning-line-operator" />
                <div className="absolute left-1/3 top-1/4 h-64 w-48 rounded-lg border-2 border-[#4285F4]/50">
                  <div className="absolute -left-1 -top-1 size-4 border-l-2 border-t-2 border-[#4285F4]" />
                  <div className="absolute -right-1 -top-1 size-4 border-r-2 border-t-2 border-[#4285F4]" />
                  <div className="absolute -bottom-1 -left-1 size-4 border-b-2 border-l-2 border-[#4285F4]" />
                  <div className="absolute -bottom-1 -right-1 size-4 border-b-2 border-r-2 border-[#4285F4]" />
                  <div className="glass-panel absolute -top-8 left-0 flex items-center gap-2 rounded px-2 py-0.5 font-mono text-[10px] text-[#4285F4]">
                    <UserCheck className="size-3" />
                    MATCH: {faceScore.toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-slate-950/80 p-4 backdrop-blur-xl">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-heading text-xs uppercase text-slate-400">RFID matched</p>
                    <p className="font-mono text-sm text-[#4285F4]">{pending.tag}</p>
                    <p className="truncate text-lg font-semibold text-white">{pending.name}</p>
                    <p className="text-sm text-on-surface-variant">{pending.passType}</p>
                    <div className="mt-3">
                      <label className="block text-[10px] font-heading uppercase tracking-widest text-slate-400">
                        Attendee email (required for certificate)
                      </label>
                      <input
                        value={pendingEmail}
                        onChange={(e) => setPendingEmail(e.target.value)}
                        placeholder="name@gmail.com"
                        type="email"
                        className="mt-1 w-full max-w-[320px] rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-on-background placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={mode === "checkout" && !pendingEmail.trim()}
                      onClick={() => completeFace("approved")}
                      className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-heading text-xs uppercase tracking-widest text-white transition hover:brightness-110"
                    >
                      <Check className="size-4" />
                      {mode === "checkout" ? "Approve check-out" : "Approve attendance"}
                    </button>
                    <button
                      type="button"
                      onClick={() => completeFace("rejected")}
                      className="flex items-center gap-2 rounded-xl border border-error/40 bg-error/10 px-5 py-2.5 font-heading text-xs uppercase tracking-widest text-error transition hover:bg-error/20"
                    >
                      <XCircle className="size-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/90 p-8 text-center">
              {sessionOutcome === "approved" ? (
                <Check className="size-14 text-emerald-400" />
              ) : (
                <XCircle className="size-14 text-error" />
              )}
              <p className="font-heading text-xl text-white">
                {sessionOutcome === "approved" ? "Attendance approved" : "Attendance rejected"}
              </p>
              <p className="text-sm text-on-surface-variant">Returning to RFID in a moment…</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          <button
            type="button"
            className="glass-panel flex flex-col items-center justify-center gap-3 rounded-2xl p-6 transition hover:bg-white/5 active:scale-95"
          >
            <div className="flex size-12 items-center justify-center rounded-xl bg-surface-variant text-on-surface-variant transition group-hover:text-[#4285F4]">
              <QrCode className="size-7" />
            </div>
            <span className="font-heading text-sm uppercase tracking-widest">Toggle QR</span>
          </button>
          <button
            type="button"
            className="glass-panel flex flex-col items-center justify-center gap-3 rounded-2xl p-6 transition hover:bg-white/5 active:scale-95"
          >
            <div className="flex size-12 items-center justify-center rounded-xl bg-surface-variant text-on-surface-variant">
              <Zap className="size-7" />
            </div>
            <span className="font-heading text-sm uppercase tracking-widest">Low light</span>
          </button>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setPhase("rfid");
              setPending(null);
            }}
            className="glass-panel flex flex-col items-center justify-center gap-3 rounded-2xl border border-error/20 p-6 transition hover:bg-error/5 active:scale-95"
          >
            <div className="flex size-12 items-center justify-center rounded-xl bg-error-container text-error">
              <Power className="size-7" />
            </div>
            <span className="font-heading text-sm uppercase tracking-widest">Reset session</span>
          </button>
        </div>
      </div>

      <div className="col-span-12 space-y-6 lg:col-span-4">
        <div className="glass-panel rounded-3xl border border-white/5 p-6">
          <h3 className="mb-6 flex items-center gap-2 font-heading text-lg">
            <LineChart className="size-5 text-[#4285F4]" />
            Venue capacity
          </h3>
          <div>
            <div className="mb-2 flex items-end justify-between">
              <span className="font-heading text-xs uppercase text-slate-400">Occupancy</span>
              <span className="font-mono font-bold text-[#4285F4]">
                {sessionEvent ? `${occupancy.current} / ${occupancy.max}` : "—"}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-900">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-700 to-[#4285F4] shadow-[0_0_10px_rgba(66,133,244,0.3)]"
                style={{ width: `${occupancy.pct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-3xl border border-white/5 p-6">
          <h3 className="mb-4 flex items-center gap-2 font-heading text-lg">
            <History className="size-5 text-[#4285F4]" />
            Recent attendance
          </h3>
          <div className="max-h-[min(420px,50vh)] space-y-3 overflow-y-auto pr-1">
            {recentRfid.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No entries yet. Complete an RFID and face check to populate this list.</p>
            ) : (
              recentRfid.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex items-start gap-3 rounded-2xl border p-3 ${
                    entry.decision === "approved" ? "border-white/5 bg-white/[0.02]" : "border-error/15 bg-error/5"
                  }`}
                >
                  <div
                    className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${
                      entry.decision === "approved" ? "bg-emerald-500/20 text-emerald-400" : "bg-error/20 text-error"
                    }`}
                  >
                    {entry.decision === "approved" ? <Check className="size-4" /> : <XCircle className="size-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-on-background">{entry.attendeeName}</div>
                    <div className="font-mono text-[11px] text-[#4285F4]/90">{entry.rfidTag}</div>
                    <div className="mt-1 font-heading text-[10px] uppercase text-slate-500">
                      {entry.eventTitle} · {formatTimeAgo(entry.timestamp)}
                    </div>
                    <div className="mt-1 font-heading text-[10px] uppercase tracking-wider text-slate-400">
                      {entry.decision} · {entry.lastStage}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <Link
            href="/dashboard"
            scroll={false}
            className="mt-4 block w-full rounded-xl border border-[#4285F4]/20 py-3 text-center font-heading text-xs uppercase tracking-widest text-[#4285F4] transition hover:bg-[#4285F4]/5"
          >
            Open full log (dashboard)
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail, RefreshCcw, Search, ShieldCheck } from "lucide-react";

function formatDateTime(value) {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value ? String(value) : "";
  }
}

function badgeClass(status) {
  switch ((status || "").toLowerCase()) {
    case "new":
      return "border-[#00e5ff]/20 bg-[#00e5ff]/10 text-[#00e5ff]";
    case "in review":
      return "border-[#d0bcff]/20 bg-[#d0bcff]/10 text-[#d0bcff]";
    case "confirmed":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    case "closed":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    default:
      return "border-white/10 bg-white/5 text-slate-300";
  }
}

export function RequestsPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [requests, setRequests] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [confirmNotice, setConfirmNotice] = useState("");

  const active = useMemo(() => requests.find((r) => r.id === activeId) ?? null, [requests, activeId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter((r) => {
      const hay = [
        r.id,
        r.status,
        r?.applicant?.name,
        r?.applicant?.email,
        r?.event?.name,
        r?.event?.type,
        r?.event?.venue,
      ]
        .filter(Boolean)
        .join(" • ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [requests, query]);

  async function confirmActiveRequest() {
    if (!active?.id) return;
    setConfirmNotice("");
    setConfirmingId(active.id);
    try {
      const res = await fetch(`/api/requests/${active.id}/confirm`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to confirm request.");
      const emailError = data?.email?.applicant?.error || data?.email?.admin?.error || data?.email?.reason;
      setConfirmNotice(
        emailError
          ? `Request confirmed, but confirmation email failed: ${emailError}`
          : "Request confirmed and confirmation email sent."
      );
      const listRes = await fetch("/api/requests", { cache: "no-store" });
      const listData = await listRes.json();
      if (listRes.ok && Array.isArray(listData?.requests)) {
        setRequests(listData.requests);
      }
    } catch (e) {
      setConfirmNotice(e?.message || "Failed to confirm request.");
    } finally {
      setConfirmingId(null);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const res = await fetch("/api/requests", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load requests.");
        const items = Array.isArray(data?.requests) ? data.requests : [];
        if (cancelled) return;
        setRequests(items);
        setActiveId((prev) => {
          if (prev && items.some((r) => r.id === prev)) return prev;
          return items[0]?.id ?? null;
        });
        setError("");
      } catch (e) {
        if (cancelled) return;
        setError(e?.message || "Failed to load requests.");
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="min-h-[calc(100vh-4rem)] bg-background px-4 pb-32 pt-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-heading text-xs uppercase tracking-[0.25em] text-slate-500">Operations</p>
            <h1 className="mt-2 font-heading text-3xl font-black tracking-tight text-on-background">Requests Inbox</h1>
            <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
              A secure, Gmail-style view of incoming deployment requests. Open any request to review details exactly as the applicant submitted.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search requests…"
                className="h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 text-sm text-on-background placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30 sm:w-[320px]"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                (async () => {
                  try {
                    const res = await fetch("/api/requests", { cache: "no-store" });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data?.error || "Failed to load requests.");
                    const items = Array.isArray(data?.requests) ? data.requests : [];
                    setRequests(items);
                    setActiveId((prev) => {
                      if (prev && items.some((r) => r.id === prev)) return prev;
                      return items[0]?.id ?? null;
                    });
                    setError("");
                  } catch (e) {
                    setError(e?.message || "Failed to load requests.");
                  } finally {
                    setLoading(false);
                  }
                })();
              }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/8 active:scale-[0.99]"
            >
              <RefreshCcw className="size-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[420px_1fr]">
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 shadow-[inset_0_0_15px_rgba(66,133,244,0.05)] backdrop-blur-2xl">
            <div className="flex items-center justify-between px-2 py-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Mail className="size-4 text-[#4285F4]" />
                Incoming
              </div>
              <div className="text-xs text-slate-500">{requests.length} total</div>
            </div>

            <div className="mt-2 space-y-2">
              {loading ? (
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-slate-400">Loading requests…</div>
              ) : error ? (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-6 text-sm text-rose-200">{error}</div>
              ) : filtered.length ? (
                filtered.map((r) => {
                  const selected = r.id === activeId;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setActiveId(r.id)}
                      className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                        selected
                          ? "border-[#4285F4]/35 bg-[#4285F4]/10 shadow-[inset_0_0_12px_rgba(66,133,244,0.12)]"
                          : "border-white/10 bg-white/5 hover:bg-white/8"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-on-background">
                            {r?.applicant?.name || "Unknown applicant"}{" "}
                            <span className="text-slate-500 font-normal">• {r?.event?.name || "Untitled event"}</span>
                          </div>
                          <div className="mt-1 truncate text-xs text-on-surface-variant">
                            {r?.applicant?.email || "—"} • {r?.event?.venue || r?.event?.address || "—"}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${badgeClass(r.status)}`}>
                            {r.status || "New"}
                          </div>
                          <div className="mt-1 text-[10px] text-slate-500">{formatDateTime(r.createdAt)}</div>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-slate-400">
                  No requests yet. Submit one from the hiring flow to see it here.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
            {!active ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <ShieldCheck className="size-6 text-[#00e5ff]" />
                </div>
                <h2 className="mt-4 text-lg font-bold text-on-background">Select a request</h2>
                <p className="mt-2 max-w-md text-sm text-on-surface-variant">Pick an item from the inbox to review its full submission details.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-xl font-black tracking-tight text-on-background">
                        {active?.event?.name || "Deployment Request"}
                      </h2>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${badgeClass(active.status)}`}>
                        {active.status || "New"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      From <span className="font-semibold text-on-background">{active?.applicant?.name || "Unknown"}</span>{" "}
                      <span className="text-slate-500">&lt;{active?.applicant?.email || "—"}&gt;</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Request ID: {active.id} • Received: {formatDateTime(active.createdAt)}</p>
                  </div>
                  <button
                    type="button"
                    disabled={confirmingId === active.id || String(active?.status || "").toLowerCase() === "confirmed"}
                    onClick={confirmActiveRequest}
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-[#00e5ff] to-[#5d8dff] px-4 text-xs font-bold uppercase tracking-widest text-[#001f24] shadow-[0_0_18px_rgba(0,229,255,0.35)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {String(active?.status || "").toLowerCase() === "confirmed"
                      ? "Confirmed"
                      : confirmingId === active.id
                        ? "Confirming..."
                        : "Confirm Request"}
                  </button>
                </div>
                {confirmNotice ? (
                  <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">{confirmNotice}</p>
                ) : null}
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <button
                    type="button"
                    disabled={confirmingId === active.id || String(active?.status || "").toLowerCase() === "confirmed"}
                    onClick={confirmActiveRequest}
                    className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#00e5ff] to-[#5d8dff] px-4 text-sm font-bold uppercase tracking-wider text-[#001f24] shadow-[0_0_18px_rgba(0,229,255,0.35)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {String(active?.status || "").toLowerCase() === "confirmed"
                      ? "Booking Confirmed"
                      : confirmingId === active.id
                        ? "Confirming Booking..."
                        : "Confirm Booking"}
                  </button>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <h3 className="font-heading text-xs uppercase tracking-[0.25em] text-slate-500">Event</h3>
                    <dl className="mt-3 space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Type</dt>
                        <dd className="text-on-background">{active?.event?.type || "—"}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Date</dt>
                        <dd className="text-on-background">{active?.event?.date || "—"}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Time</dt>
                        <dd className="text-on-background">
                          {active?.event?.startTime || active?.event?.endTime
                            ? `${active?.event?.startTime || "—"} – ${active?.event?.endTime || "—"}`
                            : "—"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Venue</dt>
                        <dd className="text-on-background">{active?.event?.venue || "—"}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Address</dt>
                        <dd className="text-on-background">{active?.event?.address || "—"}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Attendance</dt>
                        <dd className="text-on-background">{active?.event?.attendance || "—"}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <h3 className="font-heading text-xs uppercase tracking-[0.25em] text-slate-500">Organizer</h3>
                    <dl className="mt-3 space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Organization</dt>
                        <dd className="text-on-background">{active?.organizer?.organization || "—"}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Org type</dt>
                        <dd className="text-on-background">{active?.organizer?.organizationType || "—"}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Phone</dt>
                        <dd className="text-on-background">{active?.organizer?.phone || "—"}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Contact</dt>
                        <dd className="text-on-background">{active?.applicant?.name || "—"}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Email</dt>
                        <dd className="text-on-background">{active?.applicant?.email || "—"}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 lg:col-span-2">
                    <h3 className="font-heading text-xs uppercase tracking-[0.25em] text-slate-500">Systems</h3>
                    <div className="mt-3 grid gap-4 lg:grid-cols-2">
                      <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                        <div className="text-xs uppercase tracking-widest text-slate-500">Systems</div>
                        {Array.isArray(active?.systems?.technologies) && active.systems.technologies.length ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {active.systems.technologies.map((t) => (
                              <span key={t} className="rounded-full border border-[#00e5ff]/15 bg-[#00e5ff]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#00e5ff]">
                                {t}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-2 text-sm text-on-background">—</div>
                        )}
                        <div className="mt-3 text-xs text-slate-500">
                          Consent:{" "}
                          {active?.consents?.privacy ? "Privacy ✓" : "Privacy —"} • {active?.consents?.security ? "Security ✓" : "Security —"} •{" "}
                          {active?.consents?.identity ? "Identity ✓" : "Identity —"} • {active?.consents?.biometric ? "Biometric ✓" : "Biometric —"}
                        </div>
                      </div>
                    </div>
                    {active?.notes?.specialRequirements || active?.notes?.additionalNotes ? (
                      <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/40 p-4">
                        <div className="text-xs uppercase tracking-widest text-slate-500">Notes</div>
                        {active?.notes?.specialRequirements ? (
                          <p className="mt-2 text-sm text-on-background">
                            <span className="font-semibold text-slate-200">Special requirements:</span> {active.notes.specialRequirements}
                          </p>
                        ) : null}
                        {active?.notes?.additionalNotes ? (
                          <p className="mt-2 text-sm text-on-background">
                            <span className="font-semibold text-slate-200">Additional notes:</span> {active.notes.additionalNotes}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}


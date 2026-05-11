"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, CheckCircle, Loader2, Users, XCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { mockEvents } from "@/lib/mockEvents";

const CAPTURE_INTERVAL_MS = 1500;
const RESULT_HOLD_MS = 3500;
const WARMUP_MS = 1500;

export function AttendanceCheckout({ eventName = "Event" }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const captureTimerRef = useRef(null);
  const resetTimerRef = useRef(null);

  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const [isWarmedUp, setIsWarmedUp] = useState(false);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [checkedOut, setCheckedOut] = useState([]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let stream = null;
    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480 } })
      .then((s) => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
        setTimeout(() => setIsWarmedUp(true), WARMUP_MS);
      })
      .catch(() => setCameraError("Unable to access camera. Please allow camera permissions."));

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      clearInterval(captureTimerRef.current);
      clearTimeout(resetTimerRef.current);
    };
  }, []);

  // emailMap is initialized from localStorage in useState initializer

  useEffect(() => {
    const fetchEvents = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from("events").select();

      if (error) {
        setEvents(mockEvents.filter((e) => e.status === "live"));
        if (mockEvents.length > 0) setSelectedEvent(mockEvents[0].id);
        return;
      }

      const dbEvents = data || [];
      const transformed =
        dbEvents.length > 0
          ? dbEvents.map((event) => ({
              id: event.event_id || event.id,
              title: event.event_name || event.title || event.name,
              status: event.status || "live",
            }))
          : mockEvents.filter((e) => e.status === "live");

      setEvents(transformed);
      if (transformed.length > 0) setSelectedEvent(transformed[0].id);
    };
    fetchEvents();
  }, []);

  const eventTitle = useMemo(
    () => events.find((e) => e.id === selectedEvent)?.title || "Event",
    [events, selectedEvent],
  );

  const attendeeEmail = useMemo(() => {
    return String(result?.email || "");
  }, [result?.email]);

  const captureAndVerify = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL("image/png");
    setStatus("capturing");
    setNotice("");

    try {
      const res = await fetch("/api/face-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageDataUrl, eventId: selectedEvent }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("idle");
        return;
      }

      if (!data.verified) {
        setResult(data);
        setStatus(data.similarity > 0 ? "rejected" : "idle");
        return;
      }

      setResult(data);
      setStatus("verified");

      if (attendeeEmail) {
        await fetch("/api/attendance/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            attendeeEmail,
            attendeeName: data.name || "Participant",
            eventTitle,
            eventStart: null,
            eventEnd: null,
            checkInAt: null,
            checkOutAt: new Date().toISOString(),
          }),
        });
        setNotice("Check-out verified. Certificate email will be sent if configured.");
      } else {
        setNotice("Check-out verified. No email available for certificate.");
      }

      setCheckedOut((prev) => {
        const sid = data.student_id;
        if (prev.find((p) => p.student_id === sid)) return prev;
        return [{ name: data.name, student_id: sid, time: new Date().toLocaleTimeString() }, ...prev];
      });

      resetTimerRef.current = setTimeout(() => {
        setStatus("idle");
        setResult(null);
      }, RESULT_HOLD_MS);
    } catch {
      setStatus("idle");
    }
  }, [attendeeEmail, eventTitle, selectedEvent]);

  useEffect(() => {
    if (!isWarmedUp) return;
    captureTimerRef.current = setInterval(() => {
      setStatus((current) => {
        if (current === "idle") void captureAndVerify();
        return current;
      });
    }, CAPTURE_INTERVAL_MS);

    return () => clearInterval(captureTimerRef.current);
  }, [isWarmedUp, captureAndVerify]);

  const overlay = (() => {
    switch (status) {
      case "capturing":
        return { text: "Verifying…", color: "text-yellow-400", border: "border-yellow-400/60" };
      case "verified":
        return { text: `Checked out: ${result?.name || "Verified"}`, color: "text-green-400", border: "border-green-400/80" };
      case "rejected":
        return { text: "Not recognized", color: "text-red-400", border: "border-red-400/80" };
      default:
        return {
          text: isWarmedUp ? "Ready for check-out" : "Warming up camera…",
          color: "text-on-surface-variant",
          border: "border-surface-tint/40",
        };
    }
  })();

  return (
    <div className="flex min-h-screen w-full flex-col items-center gap-8 bg-background px-4 py-10 font-sans text-on-background">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-heading text-3xl font-semibold text-surface-tint drop-shadow-[0_0_12px_rgba(81,153,245,0.4)]">
          EventFlow
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">{eventName} — Attendance Check-out</p>
        {events.length > 0 ? (
          <div className="mt-4">
            <label htmlFor="event-select" className="block text-sm font-medium text-on-surface-variant mb-2">
              Select Active Event
            </label>
            <select
              id="event-select"
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="rounded-lg border border-white/20 bg-surface-container px-3 py-2 text-on-surface focus:border-surface-tint focus:outline-none"
            >
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      {cameraError ? (
        <div className="rounded-xl border border-error/30 bg-error/10 px-6 py-4 text-center text-error">{cameraError}</div>
      ) : (
        <div className="flex w-full max-w-4xl flex-col items-center gap-6 lg:flex-row lg:items-start">
          {/* Webcam panel */}
          <div className="flex w-full flex-col items-center gap-4 lg:w-auto">
            <div
              className={`relative overflow-hidden rounded-2xl border-4 transition-colors duration-300 ${overlay.border}`}
              style={{ width: 480, height: 360 }}
            >
              <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />

              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-3 top-3 h-6 w-6 border-l-2 border-t-2 border-surface-tint/60" />
                <div className="absolute right-3 top-3 h-6 w-6 border-r-2 border-t-2 border-surface-tint/60" />
                <div className="absolute bottom-3 left-3 h-6 w-6 border-b-2 border-l-2 border-surface-tint/60" />
                <div className="absolute bottom-3 right-3 h-6 w-6 border-b-2 border-r-2 border-surface-tint/60" />
              </div>

              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 bg-black/50 py-2 backdrop-blur-sm">
                {status === "capturing" ? <Loader2 className="size-4 animate-spin text-yellow-400" /> : null}
                {status === "verified" ? <CheckCircle className="size-4 text-green-400" /> : null}
                {status === "rejected" ? <XCircle className="size-4 text-red-400" /> : null}
                {status === "idle" ? <Camera className="size-4 text-on-surface-variant" /> : null}
                <span className={`text-sm font-medium ${overlay.color}`}>{overlay.text}</span>
              </div>
            </div>

            {notice ? (
              <p className="w-full max-w-sm rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-on-surface-variant">
                {notice}
              </p>
            ) : null}
          </div>

          {/* Session log panel */}
          <div className="w-full flex-1 rounded-2xl border border-white/10 bg-surface-container-low/60 p-6">
            <div className="mb-4 flex items-center gap-2">
              <Users className="size-5 text-surface-tint" />
              <h2 className="font-semibold text-on-surface">Checked Out</h2>
              <span className="ml-auto rounded-full bg-surface-tint/20 px-2 py-0.5 text-xs font-medium text-surface-tint">
                {checkedOut.length}
              </span>
            </div>

            {checkedOut.length === 0 ? (
              <p className="text-center text-sm text-on-surface-variant py-8">No participants checked out yet.</p>
            ) : (
              <ul className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {checkedOut.map((p, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-lg border border-white/5 bg-surface-container/40 px-4 py-2">
                    <CheckCircle className="size-4 shrink-0 text-green-400" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-on-surface">{p.name}</p>
                      <p className="text-xs text-on-surface-variant">{p.student_id}</p>
                    </div>
                    <span className="text-xs text-on-surface-variant shrink-0">{p.time}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { CheckCircle, XCircle, Camera, Loader2, Users } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { mockEvents } from "@/lib/mockEvents";

// ── Constants ─────────────────────────────────────────────────────────────────
const CAPTURE_INTERVAL_MS = 1500;   // how often to auto-capture a frame (ms)
const RESULT_HOLD_MS      = 3500;   // how long to show result before resetting
const WARMUP_MS           = 1500;   // delay before starting capture after mount

// ── Status types ──────────────────────────────────────────────────────────────────
// idle       → waiting, scanning for a face
// capturing  → frame sent to API, waiting for response
// verified   → face matched successfully
// rejected   → face not recognized
// error      → API/camera error

export function AttendanceScanner({ eventName = "Event" }) {
  const videoRef       = useRef(null);
  const canvasRef      = useRef(null);
  const captureTimerRef = useRef(null);
  const resetTimerRef   = useRef(null);

  const [status,        setStatus]        = useState("idle");
  const [result,        setResult]        = useState(null);   // API response
  const [cameraError,   setCameraError]   = useState("");
  const [checkedIn,     setCheckedIn]     = useState([]);     // list of verified names this session
  const [isWarmedUp,    setIsWarmedUp]    = useState(false);
  const [events,        setEvents]        = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");

  // ── Camera setup ────────────────────────────────────────────────────────────
  useEffect(() => {
    let stream = null;

    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480 } })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
        // Small warmup delay so auto-exposure settles
        setTimeout(() => setIsWarmedUp(true), WARMUP_MS);
      })
      .catch(() => {
        setCameraError("Unable to access camera. Please allow camera permissions.");
      });

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      clearInterval(captureTimerRef.current);
      clearTimeout(resetTimerRef.current);
    };
  }, []);

  // emailMap is initialized from localStorage in useState initializer

  // ── Fetch events ────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchEvents = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('events')
        .select();

      if (error) {
        console.error('Error fetching events:', error);
        // Fallback to mock events if database fails
        setEvents(mockEvents.filter(e => e.status === 'live'));
        if (mockEvents.length > 0) {
          setSelectedEvent(mockEvents[0].id);
        }
        return;
      }

      console.log('Fetched events data:', data);

      // If no events from database, use mock
      const dbEvents = data || [];
      const transformedEvents = dbEvents.length > 0 ? dbEvents.map(event => ({
        id: event.event_id || event.id,
        title: event.event_name || event.title || event.name,
        status: event.status || 'live'
      })) : mockEvents.filter(e => e.status === 'live');

      setEvents(transformedEvents);
      if (transformedEvents.length > 0) {
        setSelectedEvent(transformedEvents[0].id);
      }
    };

    fetchEvents();
  }, []);

  // ── Capture + verify ─────────────────────────────────────────────────────────
  const captureAndVerify = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video  = videoRef.current;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL("image/png");

    setStatus("capturing");

    try {
      const res  = await fetch("/api/face-verify", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ image: imageDataUrl, eventId: selectedEvent }),
      });
      const data = await res.json();

      if (!res.ok) {
        // API error — silently reset and keep scanning
        setStatus("idle");
        return;
      }

      if (data.verified) {
        setResult(data);
        setStatus("verified");
        setCheckedIn((prev) => {
          // Avoid duplicate entries in the session list
          if (prev.find((p) => p.student_id === data.student_id)) return prev;
          return [{ name: data.name, student_id: data.student_id, time: new Date().toLocaleTimeString() }, ...prev];
        });
      } else if (data.similarity > 0) {
        // A face was detected but didn't pass threshold — show rejected
        setResult(data);
        setStatus("rejected");
      } else {
        // No face detected — stay idle silently
        setStatus("idle");
        return;
      }

      // Auto-reset after showing result
      resetTimerRef.current = setTimeout(() => {
        setStatus("idle");
        setResult(null);
      }, RESULT_HOLD_MS);

    } catch {
      setStatus("idle");
    }
  }, [selectedEvent]);

  // ── Auto-capture loop ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isWarmedUp) return;

    captureTimerRef.current = setInterval(() => {
      // Only capture when idle — don't interrupt an in-progress verification
      setStatus((current) => {
        if (current === "idle") {
          captureAndVerify();
        }
        return current;
      });
    }, CAPTURE_INTERVAL_MS);

    return () => clearInterval(captureTimerRef.current);
  }, [isWarmedUp, captureAndVerify]);

  // ── UI helpers ─────────────────────────────────────────────────────────────────
  const overlayConfig = {
    idle: {
      border: "border-surface-tint/40",
      label:  isWarmedUp ? "Scanning…" : "Warming up camera…",
      color:  "text-on-surface-variant",
    },
    capturing: {
      border: "border-yellow-400/60",
      label:  "Verifying…",
      color:  "text-yellow-400",
    },
    verified: {
      border: "border-green-400/80",
      label:  `Welcome, ${result?.name}!`,
      color:  "text-green-400",
    },
    rejected: {
      border: "border-red-400/80",
      label:  "Not Recognized",
      color:  "text-red-400",
    },
    error: {
      border: "border-red-400/60",
      label:  "Error",
      color:  "text-red-400",
    },
  };

  const overlay = overlayConfig[status] ?? overlayConfig.idle;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen w-full flex-col items-center gap-8 bg-background px-4 py-10 font-sans text-on-background">

      {/* Header */}
      <div className="text-center">
        <h1 className="font-heading text-3xl font-semibold text-surface-tint drop-shadow-[0_0_12px_rgba(81,153,245,0.4)]">
          EventFlow
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">{eventName} — Attendance Check-In</p>
        {events.length > 0 && (
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
        )}
      </div>

      {cameraError ? (
        <div className="rounded-xl border border-error/30 bg-error/10 px-6 py-4 text-center text-error">
          {cameraError}
        </div>
      ) : (
        <div className="flex w-full max-w-4xl flex-col items-center gap-6 lg:flex-row lg:items-start">

          {/* ── Webcam panel ── */}
          <div className="flex w-full flex-col items-center gap-4 lg:w-auto">
            <div className={`relative overflow-hidden rounded-2xl border-4 transition-colors duration-300 ${overlay.border}`}
                 style={{ width: 480, height: 360 }}>

              {/* Live video feed */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Corner scan-line decoration */}
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-3 top-3 h-6 w-6 border-l-2 border-t-2 border-surface-tint/60" />
                <div className="absolute right-3 top-3 h-6 w-6 border-r-2 border-t-2 border-surface-tint/60" />
                <div className="absolute bottom-3 left-3 h-6 w-6 border-b-2 border-l-2 border-surface-tint/60" />
                <div className="absolute bottom-3 right-3 h-6 w-6 border-b-2 border-r-2 border-surface-tint/60" />
              </div>

              {/* Status overlay at bottom of video */}
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 bg-black/50 py-2 backdrop-blur-sm">
                {status === "capturing" && (
                  <Loader2 className="size-4 animate-spin text-yellow-400" />
                )}
                {status === "verified" && (
                  <CheckCircle className="size-4 text-green-400" />
                )}
                {status === "rejected" && (
                  <XCircle className="size-4 text-red-400" />
                )}
                {status === "idle" && (
                  <Camera className="size-4 text-on-surface-variant" />
                )}
                <span className={`text-sm font-medium ${overlay.color}`}>
                  {overlay.label}
                </span>
              </div>
            </div>

            {/* Result card */}
            {result && status !== "idle" && (
              <div className={`w-full max-w-sm rounded-xl border px-6 py-4 text-center transition-all duration-300 ${
                status === "verified"
                  ? "border-green-400/30 bg-green-400/10"
                  : "border-red-400/30 bg-red-400/10"
              }`}>
                {status === "verified" ? (
                  <>
                    <CheckCircle className="mx-auto mb-2 size-10 text-green-400" />
                    <p className="text-lg font-semibold text-on-surface">{result.name}</p>
                    <p className="text-sm text-on-surface-variant">{result.student_id}</p>
                    <p className="mt-1 text-xs text-green-400">
                      Confidence: {(result.similarity * 100).toFixed(1)}%
                    </p>
                  </>
                ) : (
                  <>
                    <XCircle className="mx-auto mb-2 size-10 text-red-400" />
                    <p className="text-lg font-semibold text-on-surface">Not Recognized</p>
                    <p className="text-xs text-on-surface-variant mt-1">
                      Score: {(result.similarity * 100).toFixed(1)}% — below threshold
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── Session log panel ── */}
          <div className="w-full flex-1 rounded-2xl border border-white/10 bg-surface-container-low/60 p-6">
            <div className="mb-4 flex items-center gap-2">
              <Users className="size-5 text-surface-tint" />
              <h2 className="font-semibold text-on-surface">Checked In</h2>
              <span className="ml-auto rounded-full bg-surface-tint/20 px-2 py-0.5 text-xs font-medium text-surface-tint">
                {checkedIn.length}
              </span>
            </div>

            {checkedIn.length === 0 ? (
              <p className="text-center text-sm text-on-surface-variant py-8">
                No participants checked in yet.
              </p>
            ) : (
              <ul className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {checkedIn.map((p, i) => (
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

"use client";

/* eslint-disable react-hooks/set-state-in-effect -- hydrate log from storage */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "eventflow-attendance-log";

/** See `lib/api-types.js` for AttendanceLogEntryDto (future REST contract). */

const AttendanceLogContext = createContext(null);

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function AttendanceLogProvider({ children }) {
  const [logs, setLogs] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLogs(loadStored());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch {
      /* ignore */
    }
  }, [logs, ready]);

  const appendLog = useCallback((entry) => {
    setLogs((prev) => [entry, ...prev]);
  }, []);

  const participants = useMemo(() => {
    const approved = logs.filter((l) => l.decision === "approved" && (l.kind || "checkin") === "checkin");
    const seen = new Set();
    const out = [];
    for (const p of approved) {
      const k = `${p.attendeeName}|${p.eventId}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(p);
    }
    return out;
  }, [logs]);

  const recentRfid = useMemo(() => logs.slice(0, 25), [logs]);

  return (
    <AttendanceLogContext.Provider value={{ logs, appendLog, participants, recentRfid, ready }}>
      {children}
    </AttendanceLogContext.Provider>
  );
}

export function useAttendanceLog() {
  const ctx = useContext(AttendanceLogContext);
  if (!ctx) throw new Error("useAttendanceLog must be used within AttendanceLogProvider");
  return ctx;
}

"use client";

import { AuthProvider } from "@/lib/auth-context";
import { AttendanceLogProvider } from "@/lib/attendance-log-context";
import { EventsProvider } from "@/lib/events-context";

export function Providers({ children }) {
  return (
    <AuthProvider>
      <EventsProvider>
        <AttendanceLogProvider>{children}</AttendanceLogProvider>
      </EventsProvider>
    </AuthProvider>
  );
}

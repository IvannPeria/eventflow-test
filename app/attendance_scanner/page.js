import { AttendanceScanner } from "./attendance_scanner";

export const metadata = {
  title: "Attendance Scanner",
};

export default function AttendanceScannerPage() {
  return <AttendanceScanner eventName="EventFlow" />;
}

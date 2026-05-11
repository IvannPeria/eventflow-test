import { AttendanceCheckout } from "./attendance_checkout";

export const metadata = {
  title: "Attendance Checkout",
};

export default function AttendanceCheckoutPage() {
  return <AttendanceCheckout eventName="EventFlow" />;
}


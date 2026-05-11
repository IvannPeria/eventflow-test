import { Inter, Space_Grotesk } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: {
    default: "EventFlow | Intelligent Precision Logistics",
    template: "%s | EventFlow",
  },
  description:
    "Smart event attendance with RFID and face recognition. Real-time logistics, secure access, and operational dashboards.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`dark ${inter.variable} ${spaceGrotesk.variable} h-full`}
    >
      <body className="min-h-full bg-background text-on-background"
      suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

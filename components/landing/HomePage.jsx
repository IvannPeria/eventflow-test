"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, BarChart3, CheckCircle2, Printer, Shield, Zap } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const REVEAL_KEYS = ["lp-hero", "lp-visual", "lp-about", "lp-solutions", "lp-stats", "lp-pricing"];

function FeatureCard({ icon: Icon, title, children, visual }) {
  return (
    <div className="glass-panel flex h-full flex-col rounded-3xl border border-white/5 p-6 transition duration-300 hover:scale-[1.02] hover:border-surface-tint/20 hover:shadow-[0_0_24px_rgba(81,153,245,0.08)]">
      <div className="mb-4 flex size-12 items-center justify-center rounded-xl border border-surface-tint/20 bg-surface-tint/10 text-surface-tint">
        <Icon className="size-6" aria-hidden />
      </div>
      <h3 className="font-heading text-lg font-semibold text-on-background">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-on-surface-variant">{children}</p>
      {visual ? <div className="mt-6">{visual}</div> : null}
    </div>
  );
}

function MiniBars() {
  return (
    <div className="flex h-24 items-end gap-2 rounded-2xl border border-white/10 bg-surface-container-low/60 p-4">
      {[40, 55, 35, 70, 45, 90, 50].map((h, i) => (
        <div
          key={i}
          className={`flex-1 rounded-t-md ${i === 5 ? "bg-gradient-to-t from-surface-tint/30 to-surface-tint shadow-[0_0_12px_rgba(81,153,245,0.35)]" : "bg-surface-container-highest/80"}`}
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

function CertProgress() {
  return (
    <div className="mt-4">
      
    </div>
  );
}

export function HomePage() {
  const [visible, setVisible] = useState(() => Object.fromEntries(REVEAL_KEYS.map((k) => [k, false])));
  const mainRef = useRef(null);

  const revealClass = (key) => `reveal-section ${visible[key] ? "is-visible" : ""}`;

  useEffect(() => {
    const root = mainRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const key = entry.target.getAttribute("data-reveal-key");
          if (key) {
            setVisible((prev) => ({ ...prev, [key]: true }));
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" },
    );

    root.querySelectorAll("[data-reveal-key]").forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -left-1/4 -top-1/4 h-1/2 w-1/2 rounded-full bg-secondary-container/20 blur-[120px]" />
        <div className="absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-surface-tint/10 blur-[120px]" />
        <div className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 bg-glow opacity-50" />
      </div>

      <Navbar />

      <main ref={mainRef} className="relative z-10">
        <section
          data-reveal-key="lp-hero"
          className={`mx-auto max-w-5xl px-4 pb-20 pt-12 text-center sm:px-6 sm:pt-16 ${revealClass("lp-hero")}`}
        >
          <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-heading uppercase tracking-widest text-on-surface-variant">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-surface-tint opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-surface-tint" />
            </span>
            New: EventFlow release
          </div>
          <h1 className="font-heading text-h1 text-on-background">
            Smart Event Attendance with RFID + Face Recognition
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-on-surface-variant">
            Revolutionize event logistics with seamless automation. Track attendees in real time, eliminate queues, and
            deliver a futuristic experience with our precision-engineered platform.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/hiringDetails"
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-surface-tint to-brand-deep px-8 font-heading text-sm font-semibold text-on-secondary shadow-[0_0_20px_rgba(81,153,245,0.35)] transition hover:shadow-[0_0_28px_rgba(81,153,245,0.5)] active:scale-[0.98]"
            >
              Hire EventFlow
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-8 py-4 font-heading text-sm font-medium text-on-background transition hover:border-surface-tint/30 hover:bg-white/10"
            >
              Access Your Event
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          <div data-reveal-key="lp-visual" className={revealClass("lp-visual")}>
            {/* Gradient border frame (replaces flat single border) */}
            <div className="rounded-[2rem] bg-gradient-to-br from-teal-400/45 via-surface-tint/35 to-violet-500/40 p-[1px] shadow-[0_0_48px_rgba(45,212,191,0.12),0_0_60px_rgba(81,153,245,0.08)]">
              <div className="rounded-[calc(2rem-1px)] bg-background/90 p-2 sm:p-3">
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl bg-black ring-1 ring-white/5">
                  <div
                    className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(rgba(81,153,245,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(81,153,245,0.05)_1px,transparent_1px)] bg-[size:28px_28px] opacity-60"
                    aria-hidden
                  />
                  <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-background/80 via-transparent to-background/40" aria-hidden />
                  {/* eslint-disable-next-line @next/next/no-img-element -- animated GIF */}
                  <img
                    src="/faceIdgif.gif"
                    alt="EventFlow face verification preview"
                    className="absolute inset-0 z-0 h-full w-full object-contain object-center"
                    width={1600}
                    height={1000}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute bottom-6 left-6 z-[2] flex items-center gap-2 rounded-full border border-emerald-400/25 bg-slate-950/80 px-4 py-2 text-xs text-emerald-100/90 backdrop-blur-md">
                    <CheckCircle2 className="size-4 text-emerald-400" aria-hidden />
                    <span>Live status</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="about"
          data-reveal-key="lp-about"
          className={`mx-auto max-w-6xl px-4 pb-16 sm:px-6 ${revealClass("lp-about")}`}
        >
          <h2 className="font-heading text-h2 text-on-background">Precision event infrastructure</h2>
          <p className="mt-3 max-w-2xl text-on-surface-variant">
            Engineered for speed, scale, and high-fidelity data capture across venues, conferences, and secure access
            lanes.
          </p>
        </section>

        <section
          id="solutions"
          data-reveal-key="lp-solutions"
          className={`mx-auto max-w-6xl px-4 pb-20 sm:px-6 ${revealClass("lp-solutions")}`}
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FeatureCard icon={Shield} title="Enterprise security">
              Hardened access patterns, audit-friendly logs, and policy-driven controls built for high-traffic venues.
            </FeatureCard>
            <FeatureCard
              icon={Zap}
              title="Fast check-in"
              visual={
                <div className="flex justify-end">
                  <div className="h-28 w-28 rounded-full border border-surface-tint/40 bg-gradient-to-br from-surface-container-highest to-surface-container-lowest shadow-[0_0_30px_rgba(81,153,245,0.25)] ring-4 ring-surface-tint/20" />
                </div>
              }
            >
              Parallel scan lanes, RFID tap targets, and sub-second verification tuned for peak ingress.
            </FeatureCard>
            <FeatureCard icon={BarChart3} title="Live dashboard" visual={<MiniBars />}>
              Real-time occupancy, throughput, and exception streams with glass UI tuned for control rooms.
            </FeatureCard>
            <FeatureCard icon={Printer} title="Auto certificates" visual={<CertProgress />}>
              Branded credentials and attendance proofs generated automatically as participants clear checkpoints.
            </FeatureCard>
          </div>
        </section>

        <section
          id="contact"
          data-reveal-key="lp-pricing"
          className={`mx-auto max-w-4xl px-4 py-16 sm:px-6 ${revealClass("lp-pricing")}`}
        >
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-heading text-h2 text-on-background">Ready to deploy EventFlow?</h2>
            <p className="mt-3 text-on-surface-variant">
              Tell us about your event and workforce needs — we respond within one business day.
            </p>
          </div>
          <div className="mx-auto mt-6 flex w-full max-w-2xl flex-col gap-3 sm:mt-8 sm:flex-row sm:justify-center sm:gap-4">
            <Link
              href="/hiringDetails"
              className="inline-flex min-h-[52px] w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-gradient-to-r from-surface-tint to-brand-deep px-8 py-4 font-heading text-sm font-semibold text-on-secondary shadow-[0_0_20px_rgba(81,153,245,0.35)] transition hover:shadow-[0_0_28px_rgba(81,153,245,0.5)] active:scale-[0.99] sm:flex-1 sm:basis-0 sm:min-w-[12rem]"
            >
              Hire EventFlow
              <ArrowRight className="size-4 shrink-0" aria-hidden />
            </Link>
            <Link
              href="mailto:hello@eventflow.example"
              className="inline-flex min-h-[52px] w-full shrink-0 items-center justify-center whitespace-nowrap rounded-2xl border border-white/15 px-8 py-4 font-heading text-sm font-medium text-on-background transition hover:border-surface-tint/30 hover:bg-white/5 sm:flex-1 sm:basis-0 sm:min-w-[10rem]"
            >
              Email us
            </Link>
          </div>
        </section>
      </main>

      <Footer />

      <div className="pointer-events-none fixed left-0 top-0 z-[5] h-px w-full bg-gradient-to-r from-transparent via-surface-tint/50 to-transparent" />
    </div>
  );
}

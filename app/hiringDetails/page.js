'use client';

/* eslint-disable react-hooks/refs -- callback refs register section nodes for IntersectionObserver */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

const technologyOptions = [
  {
    key: 'rfid',
    name: 'RFID Attendance Tracking',
    desc: 'Accelerates check-in throughput and secures access credentials.',
    icon: 'RFID',
  },
  {
    key: 'face',
    name: 'Facial Recognition System',
    desc: 'Adds biometric identity verification for critical control points.',
    icon: 'FACE',
  },
  {
    key: 'geo',
    name: 'Geofencing Location Monitoring',
    desc: 'Monitors workforce movement across geofenced operational zones.',
    icon: 'GEO',
  },
  {
    key: 'live',
    name: 'Real-time Staff Tracking',
    desc: 'Provides live deployment visibility for supervisors and dispatch.',
    icon: 'LIVE',
  },
];

export default function HiringDetailsPage() {
  const sectionRefs = useRef({});
  const [visibleSections, setVisibleSections] = useState({});
  const [activeOverviewTab, setActiveOverviewTab] = useState('event');
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [requestId, setRequestId] = useState('');
  const [emailNotice, setEmailNotice] = useState('');

  const [form, setForm] = useState({
    eventName: '',
    eventType: '',
    eventDate: '',
    eventStartTime: '',
    eventEndTime: '',
    venue: '',
    address: '',
    attendance: '',
    organization: '',
    contactName: '',
    email: '',
    phone: '',
    organizationType: '',
    specialRequirements: '',
    additionalNotes: '',
    technologies: ['rfid', 'face'],
    consentIdentity: false,
    consentBiometric: false,
    consentPrivacy: false,
    consentSecurity: false,
  });

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleTechnology = (key) => {
    setForm((prev) => ({
      ...prev,
      technologies: prev.technologies.includes(key)
        ? prev.technologies.filter((t) => t !== key)
        : [...prev.technologies, key],
    }));
  };

  const activeSystems = useMemo(
    () => technologyOptions.filter((system) => form.technologies.includes(system.key)),
    [form.technologies]
  );

  const overviewTabs = [
    {
      key: 'event',
      label: 'Event',
      title: form.eventName || 'Event details',
      body: form.eventType || 'Configure the event scope and location details.',
      target: 'event-config',
    },
    {
      key: 'organizer',
      label: 'Organizer',
      title: form.organization || 'Organizer profile',
      body: form.contactName || 'Client identity and contact information.',
      target: 'client-identity',
    },
    {
      key: 'systems',
      label: 'Systems',
      title: activeSystems.length ? `${activeSystems.length} systems active` : 'System activation',
      body: activeSystems.length ? activeSystems.map((system) => system.name).join(' • ') : 'Select modules to deploy for this event.',
      target: 'system-activation',
    },
  ];

  const setSectionRef = (key) => (node) => {
    if (node) {
      sectionRefs.current[key] = node;
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const key = entry.target.getAttribute('data-reveal-key');
            if (key) {
              setVisibleSections((prev) => ({ ...prev, [key]: true }));
              observer.unobserve(entry.target);
            }
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -6% 0px',
      }
    );

    Object.values(sectionRefs.current).forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, []);

  const revealClass = (key) =>
    `reveal-section ${visibleSections[key] ? 'is-visible' : ''}`;

  const jumpToSection = (tab) => {
    setActiveOverviewTab(tab.key);
    const target = sectionRefs.current[tab.target];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const inputClass =
    'w-full rounded-lg border border-white/10 bg-surface-container-highest/50 px-4 py-3 text-sm text-on-background transition placeholder:text-on-surface-variant/45 focus:outline-none focus:ring-2 focus:ring-surface-tint/35';

  const submitRequest = async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError('');
    setEmailNotice('');
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Submission failed. Please try again.');
      }
      setRequestSubmitted(true);
      setRequestId(data?.request?.id || '');
      const applicantErr = data?.email?.applicant?.error;
      const adminErr = data?.email?.admin?.error;
      if (data?.email?.enabled && (applicantErr || adminErr)) {
        setEmailNotice(`Request submitted, but email sending failed. ${applicantErr || adminErr}`);
      } else if (data?.email?.reason) {
        setEmailNotice(data.email.reason);
      }
    } catch (e) {
      setSubmitError(e?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: 'var(--background)', color: 'var(--foreground)' }} className="relative overflow-hidden">
      <div className="hero-bg" aria-hidden>
        <div className="bg-grid absolute inset-0 opacity-40" />
        <div
          className="hero-blob"
          style={{
            width: 460,
            height: 460,
            background:
              'radial-gradient(circle at 30% 25%, rgba(30,144,255,0.16), transparent 55%)',
            left: '-12%',
            top: '-14%',
          }}
        />
        <div
          className="hero-blob"
          style={{
            width: 420,
            height: 420,
            background:
              'radial-gradient(circle at 80% 75%, rgba(22,160,133,0.14), transparent 55%)',
            right: '-12%',
            bottom: '-10%',
          }}
        />
        <div className="vignette" />
      </div>

      <header className="sticky top-0 backdrop-blur-md border-b border-white/6 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold highlight hover:opacity-80 transition">EventFlow</Link>
          <Link href="/" className="muted text-sm hover:accent transition">
            ← Back to EventFlow
          </Link>
        </div>
      </header>

      <main className="relative z-10 min-h-screen pb-20">
        <section className="relative mx-auto max-w-7xl px-4 pb-6 pt-6 sm:px-6 sm:pt-8">
          <div className={`${revealClass('hero')}`} ref={setSectionRef('hero')} data-reveal-key="hero">
            <h1 className="mb-4 text-center text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              <span className="highlight">EventFlow</span> Infrastructure
            </h1>
            <p className="mx-auto max-w-2xl text-center text-lg leading-relaxed text-on-surface-variant">
              Configure RFID tracking, facial recognition, and geofencing for your event operations.
            </p>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 pb-8 relative">
          <div className="space-y-10">
            <div
              className={`glass p-12 rounded-xl lift-card bg-linear-to-br from-blue-500/8 to-transparent ${revealClass('event-config')}`}
              ref={setSectionRef('event-config')}
              data-reveal-key="event-config"
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2">Event Configuration</h2>
                <p className="text-sm muted">Core details about your event deployment scope</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-xs uppercase tracking-wider muted block mb-2">Event Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Summer Music Festival 2026"
                    className={inputClass}
                    value={form.eventName}
                    onChange={(e) => updateField('eventName', e.target.value)}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs uppercase tracking-wider muted block mb-2">Event Type</label>
                    <select
                      className={inputClass}
                      value={form.eventType}
                      onChange={(e) => updateField('eventType', e.target.value)}
                    >
                      <option value="">Select event type</option>
                      <option value="Concert">Concert</option>
                      <option value="Festival">Festival</option>
                      <option value="Corporate Event">Corporate Event</option>
                      <option value="Conference">Conference</option>
                      <option value="Private Event">Private Event</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider muted block mb-2">Expected Attendance</label>
                    <input
                      type="number"
                      placeholder="e.g., 5000"
                      className={inputClass}
                      value={form.attendance}
                      onChange={(e) => updateField('attendance', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-6">
                  <div>
                    <label className="text-xs uppercase tracking-wider muted block mb-2">Event Date</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={form.eventDate}
                      onChange={(e) => updateField('eventDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider muted block mb-2">Start Time</label>
                    <input
                      type="time"
                      className={inputClass}
                      value={form.eventStartTime}
                      onChange={(e) => updateField('eventStartTime', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider muted block mb-2">End Time</label>
                    <input
                      type="time"
                      className={inputClass}
                      value={form.eventEndTime}
                      onChange={(e) => updateField('eventEndTime', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider muted block mb-2">Event Location</label>
                  <input
                    type="text"
                    placeholder="Venue name"
                    className={`${inputClass} mb-3`}
                    value={form.venue}
                    onChange={(e) => updateField('venue', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Full address"
                    className={inputClass}
                    value={form.address}
                    onChange={(e) => updateField('address', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div
              className={`glass p-12 rounded-xl lift-card bg-linear-to-br from-teal-500/8 to-transparent ${revealClass('client-identity')}`}
              ref={setSectionRef('client-identity')}
              data-reveal-key="client-identity"
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2">Client Identity</h2>
                <p className="text-sm muted">Contact and organization credentials</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-xs uppercase tracking-wider muted block mb-2">Organization / Company Name</label>
                  <input
                    type="text"
                    placeholder="e.g., ABC Events Inc."
                    className={inputClass}
                    value={form.organization}
                    onChange={(e) => updateField('organization', e.target.value)}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs uppercase tracking-wider muted block mb-2">Full Name</label>
                    <input
                      type="text"
                      placeholder="Contact person"
                      className={inputClass}
                      value={form.contactName}
                      onChange={(e) => updateField('contactName', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider muted block mb-2">Email Address</label>
                    <input
                      type="email"
                      placeholder="you@company.com"
                      className={inputClass}
                      value={form.email}
                      onChange={(e) => updateField('email', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs uppercase tracking-wider muted block mb-2">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      className={inputClass}
                      value={form.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider muted block mb-2">Organization Type</label>
                    <input
                      type="text"
                      placeholder="Event production, venue, corporate"
                      className={inputClass}
                      value={form.organizationType}
                      onChange={(e) => updateField('organizationType', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`glass p-12 rounded-xl lift-card bg-linear-to-br from-teal-500/8 to-transparent ${revealClass('system-activation')}`}
              ref={setSectionRef('system-activation')}
              data-reveal-key="system-activation"
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2">System Activation</h2>
                <p className="text-sm muted">Enable modules required for this deployment</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                {technologyOptions.map((system) => {
                  const enabled = form.technologies.includes(system.key);
                  return (
                    <button
                      key={system.key}
                      type="button"
                      onClick={() => toggleTechnology(system.key)}
                      className={`glass p-6 rounded-xl text-left transition lift-card ${
                        enabled ? 'border border-emerald-400/35 bg-emerald-500/8' : 'border border-white/8'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <span className="text-xs tracking-widest font-semibold text-blue-200">{system.icon}</span>
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                            enabled
                              ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/35'
                              : 'bg-white/8 text-slate-300'
                          }`}
                        >
                          {enabled ? 'Enabled' : 'Available'}
                        </span>
                      </div>
                      <h4 className="font-semibold mb-2">{system.name}</h4>
                      <p className="text-sm muted leading-relaxed">{system.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className={`glass p-12 rounded-xl lift-card bg-linear-to-br from-blue-500/8 to-transparent ${revealClass('compliance')}`}
              ref={setSectionRef('compliance')}
              data-reveal-key="compliance"
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2">Compliance & Consent</h2>
                <p className="text-sm muted">Enterprise requirements for secure operation</p>
              </div>

              <div className="space-y-4">
                {[
                  ['consentIdentity', 'Identity verification requirement'],
                  ['consentBiometric', 'Biometric consent agreement'],
                  ['consentPrivacy', 'Data privacy acknowledgment'],
                  ['consentSecurity', 'Security compliance confirmation'],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-white/4 transition">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded accent-blue-500"
                      checked={form[key]}
                      onChange={(e) => updateField(key, e.target.checked)}
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div
              className={`glass p-12 rounded-xl lift-card bg-linear-to-br from-teal-500/8 to-transparent ${revealClass('notes')}`}
              ref={setSectionRef('notes')}
              data-reveal-key="notes"
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2">Additional Notes</h2>
                <p className="text-sm muted">Special instructions, venue rules, and workflow requests</p>
              </div>

              <textarea
                placeholder="Add instructions for security posture, gate policies, restricted zones, or custom operational workflows"
                className={`${inputClass} resize-none`}
                rows="6"
                value={form.additionalNotes}
                onChange={(e) => updateField('additionalNotes', e.target.value)}
              />
            </div>
            <div
              className={`glass p-8 rounded-xl h-fit lift-card ${revealClass('overview')}`}
              ref={setSectionRef('overview')}
              data-reveal-key="overview"
            >
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold">Deployment Overview</h3>
                  <p className="text-xs uppercase tracking-wider muted mt-1">Interactive summary</p>
                </div>
                <span className="px-2.5 py-1 text-[11px] rounded-full bg-white/6 text-slate-200 border border-white/8">Live</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-2 mb-6">
                {overviewTabs.map((tab) => {
                  const selected = activeOverviewTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => jumpToSection(tab)}
                      className={`rounded-lg px-3 py-2 text-left transition border ${
                        selected
                          ? 'border-blue-400/35 bg-blue-500/18 text-white'
                          : 'border-white/8 bg-white/4 text-slate-300 hover:bg-white/8'
                      }`}
                    >
                      <div className="text-xs uppercase tracking-wider muted">{tab.label}</div>
                      <div className="text-sm font-medium mt-1">{tab.title}</div>
                    </button>
                  );
                })}
              </div>

              <div className="glass p-4 rounded-xl border border-white/6 mb-6 bg-white/3">
                <div className="text-xs uppercase tracking-wider muted mb-2">Current focus</div>
                <div className="font-semibold mb-2">{overviewTabs.find((tab) => tab.key === activeOverviewTab)?.title}</div>
                <p className="text-sm muted leading-relaxed">{overviewTabs.find((tab) => tab.key === activeOverviewTab)?.body}</p>
              </div>

              <div className="space-y-4 text-sm">
                <div className="pb-4 border-b border-white/6">
                  <p className="text-xs uppercase tracking-wider muted mb-3">Event</p>
                  <p className="muted">Name: <span className="text-white">{form.eventName || 'Not entered'}</span></p>
                  <p className="muted">Type: <span className="text-white">{form.eventType || 'Not selected'}</span></p>
                  <p className="muted">Location: <span className="text-white">{form.venue || 'Not entered'}</span></p>
                </div>

                <div className="pb-4 border-b border-white/6">
                  <p className="text-xs uppercase tracking-wider muted mb-3">Organizer</p>
                  <p className="muted">Company: <span className="text-white">{form.organization || 'Not entered'}</span></p>
                  <p className="muted">Contact: <span className="text-white">{form.contactName || 'Not entered'}</span></p>
                </div>

                <div className="pb-4 border-b border-white/6">
                  <p className="text-xs uppercase tracking-wider muted mb-3">Systems</p>
                  <div className="space-y-2">
                    {activeSystems.length ? (
                      activeSystems.map((system) => (
                        <button
                          type="button"
                          key={system.key}
                          onClick={() => jumpToSection(overviewTabs[2])}
                          className="flex items-center justify-between w-full rounded-lg border border-white/6 bg-white/3 px-3 py-2 text-left hover:bg-white/8 transition"
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 pulse" />
                            {system.name}
                          </span>
                          <span className="text-[11px] uppercase tracking-wider muted">Open</span>
                        </button>
                      ))
                    ) : (
                      <button
                        type="button"
                        onClick={() => jumpToSection(overviewTabs[2])}
                        className="w-full rounded-lg border border-white/6 bg-white/3 px-3 py-2 text-left muted hover:bg-white/8 transition"
                      >
                        No systems enabled
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-6 w-full max-w-6xl border-t border-white/10 px-4 pb-16 pt-12 sm:px-6">
          <div
            className={`${revealClass('submit')}`}
            ref={setSectionRef('submit')}
            data-reveal-key="submit"
          >
            <div className="glass mx-auto max-w-5xl rounded-2xl p-8">
              <div className="grid gap-6 lg:grid-cols-[minmax(420px,1fr)_360px] lg:items-center">
                <div className="min-w-[320px] max-w-none">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-300/90">Enterprise onboarding</p>
                  <h3 className="mt-2 text-3xl font-extrabold tracking-tight text-on-background">Request Deployment</h3>
                  <p className="mt-2 max-w-xl whitespace-normal text-lg leading-relaxed text-on-surface-variant">
                    Response time: within 24 hours. Enterprise onboarding required. Secure submission.
                  </p>
                  {requestSubmitted ? (
                    <p className="mt-4 text-sm font-medium leading-relaxed text-emerald-300">
                      Your request has been received{requestId ? ` (${requestId})` : ''}. Our EventFlow team will contact you within 24 hours.
                    </p>
                  ) : null}
                  {submitError ? (
                    <p className="mt-4 text-sm font-medium leading-relaxed text-rose-200">{submitError}</p>
                  ) : null}
                  {emailNotice ? (
                    <p className="mt-3 text-xs font-semibold tracking-[0.04em] text-amber-200/90">{emailNotice}</p>
                  ) : null}
                </div>

                <div className="shrink-0">
                  <div className="rounded-2xl border border-white/10 bg-white/4 p-5 shadow-[inset_0_0_18px_rgba(81,153,245,0.10)] backdrop-blur-xl lg:w-[360px]">
                    <button
                      type="button"
                      disabled={submitting || requestSubmitted}
                      onClick={submitRequest}
                      className="inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-surface-tint to-brand-deep px-8 py-4 text-base font-semibold text-on-secondary shadow-[0_0_24px_rgba(81,153,245,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70 active:scale-[0.99]"
                    >
                      {submitting ? 'Submitting…' : requestSubmitted ? 'Request Submitted' : 'Submit Hiring Request'}
                    </button>
                    <button
                      type="button"
                      className="mt-3 w-full text-sm text-surface-tint/90 underline-offset-4 transition hover:text-surface-tint hover:underline"
                      onClick={(e) => e.preventDefault()}
                    >
                      Download request summary (PDF mock)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

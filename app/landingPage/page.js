import Image from 'next/image';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--background)', color: 'var(--foreground)' }} className="relative overflow-hidden">
      <div className="hero-bg" aria-hidden>
        <div className="bg-grid absolute inset-0 opacity-40" />
        <div className="vignette" />
      </div>
      <header className="sticky top-0 backdrop-blur-md border-b border-white/6 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold highlight hover:opacity-85 transition">EventFlow</Link>
          <nav className="flex gap-8 items-center"> 
            <a className="muted text-sm hover:accent transition" href="#features">Features</a>
            <a className="muted text-sm hover:accent transition" href="#how">How it works</a>
            <a className="muted text-sm hover:accent transition" href="#contact">Industries</a>
            <a className="btn-primary" href="#contact">Get in touch</a>
          </nav>
        </div>
      </header>

      <main className="min-h-screen">
        <section className="relative overflow-hidden py-20">
          <div className="hero-bg" aria-hidden>
            <div className="hero-blob" style={{ width: 420, height: 420, background: 'radial-gradient(circle at 20% 30%, rgba(30,144,255,0.18), transparent 30%)', left: '-10%', top: '-10%' }} />
            <div className="hero-blob" style={{ width: 360, height: 360, background: 'radial-gradient(circle at 80% 70%, rgba(22,160,133,0.14), transparent 30%)', right: '-10%', bottom: '-10%' }} />
          </div>

          <div className="max-w-6xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2 text-center lg:text-left fade-up">
              <p className="text-sm uppercase tracking-wide muted">Smarter Event Operations</p>
              <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight mt-4 mb-6">
                <span className="highlight">EventFlow</span> Intelligent Event Management
              </h1>
              <p className="text-lg muted mb-8 leading-relaxed">Use RFID tracking, facial recognition, and geofencing to streamline workforce management, access control, and real-time event operations.</p>
              <div className="flex gap-4 justify-center lg:justify-start">
                <a className="btn-primary hover-scale" href="/hiringDetails">Hire EventFlow</a>
                <a className="muted hover:accent transition mt-3" href="#features">Learn more</a>
              </div>
            </div>

            <div className="lg:w-1/2 flex justify-center scale-in">
              <div className="glass p-4 soft-drift lift-card" style={{ animation: 'floatUp 800ms ease both' }}>
                <div className="gif-frame">
                  <Image
                    src="/faceIdgif.gif"
                    alt="Face ID verification preview"
                    width={960}
                    height={640}
                    className="w-full h-auto object-cover"
                    priority
                    unoptimized
                  />
                </div>
                <div className="mt-4 flex items-center justify-between rounded-xl bg-white/4 px-4 py-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide muted">Identity Engine</p>
                    <p className="text-sm font-medium">Real-time biometric gate validation</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs bg-emerald-500/15 text-emerald-200 border border-emerald-400/25 pulse">Active</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="max-w-6xl mx-auto px-6 py-20">
          <h3 className="text-3xl font-bold mb-12">Core Features</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'RFID Attendance & Access', desc: 'Fast check-ins, secure access control, and attendance logs.' },
              { title: 'Facial Recognition', desc: 'Identity verification to reduce fraud and speed entry.' },
              { title: 'Geofencing & Location', desc: 'Real-time location monitoring and zone-based alerts.' },
              { title: 'Live Analytics', desc: 'Operational dashboards for crowd flow, staffing, and safety.' },
              { title: 'Staff & Attendee Management', desc: 'Roster management, credentialing, and shift oversight.' },
              { title: 'Automated Reports', desc: 'Scheduled and on-demand reports for audits and security logs.' },
            ].map((f, i) => (
              <div key={i} className="glass p-6 hover-scale lift-card" style={{animationDelay: `${i * 50}ms`}}>
                <div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-500/20 to-teal-500/20 mb-4" />
                <h4 className="font-semibold mb-2">{f.title}</h4>
                <p className="muted text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="max-w-6xl mx-auto px-6 py-20">
          <h3 className="text-3xl font-bold mb-12 text-center">How it Works</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              'Register staff & attendees with secure profiles',
              'Verify identities through facial recognition',
              'Track entries using RFID scanning',
              'Monitor movement via geofencing',
              'Review analytics & reports in real time'
            ].map((step, i) => (
              <div key={i} className="glass p-6 text-center relative lift-card" style={{animationDelay: `${i * 80}ms`}}>
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-teal-500 mx-auto mb-3 flex items-center justify-center text-white text-sm font-bold">{i + 1}</div>
                <p className="muted text-sm leading-relaxed">{step}</p>
                {i < 4 && <div className="hidden lg:block absolute -right-2 top-1/2 transform -translate-y-1/2 text-muted">→</div>}
              </div>
            ))}
          </div>
        </section>

        <section id="industries" className="max-w-6xl mx-auto px-6 py-20">
          <h3 className="text-3xl font-bold mb-12">Built for Every Event</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {['Concerts','Corporate Events','Festivals','Conferences','Venues','Security Ops'].map((s, i)=> (
              <div key={s} className="glass px-4 py-3 text-center hover-scale lift-card muted text-sm" style={{animationDelay: `${i * 40}ms`}}>{s}</div>
            ))}
          </div>
        </section>

        <section id="why" className="max-w-6xl mx-auto px-6 py-16">
          <h3 className="text-3xl font-bold mb-12">Why Choose EventFlow</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {title: 'Improved Security', desc: 'Prevent unauthorized access and reduce security incidents in real time.' },
              {title: 'Faster Check-ins', desc: 'Reduce entry delays with RFID and facial recognition technology.' },
              {title: 'Real-time Visibility', desc: 'Monitor operations with live dashboards and instant alerts.' },
              {title: 'Automated Compliance', desc: 'Generate auditable logs and reports automatically for accountability.' },
            ].map((item, i) => (
              <div key={i} className="glass p-8 hover-scale lift-card">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h4 className="font-semibold mb-2">{item.title}</h4>
                <p className="muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="max-w-6xl mx-auto px-6 py-20">
          <h3 className="text-3xl font-bold mb-12 text-center">Ready to Hire EventFlow?</h3>
          <div className="flex flex-col lg:flex-row gap-8 max-w-4xl mx-auto">
            <div className="flex-1 glass p-8 hover-scale lift-card">
              <h4 className="font-semibold mb-3 text-lg">Custom Event Solutions</h4>
              <p className="muted mb-6 leading-relaxed">Discuss deployment options, integration requirements, and custom SLAs tailored to your event size and venue.</p>
              <a className="btn-primary" href="#contact">Contact our team</a>
            </div>
            <div className="flex-1 glass p-8 hover-scale lift-card">
              <h4 className="font-semibold mb-3 text-lg">Quick Setup</h4>
              <p className="muted mb-6 leading-relaxed">Get EventFlow operational for your next event. Our team handles installation, setup, and on-site support.</p>
              <a className="btn-primary" href="#contact">Get started now</a>
            </div>
          </div>
        </section>

        <section id="contact" className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h3 className="text-4xl font-bold mb-4">Let&apos;s Talk</h3>
          <p className="muted mb-8 text-lg leading-relaxed">
            Tell us about your event and let&apos;s discuss how EventFlow can streamline operations and enhance security.
          </p>
          <div className="flex gap-4 justify-center">
            <a className="btn-primary" href="mailto:sales@eventflow.com">Email us</a>
            <a className="glass px-6 py-3 muted" href="tel:+1234567890">Call us</a>
          </div>
        </section>

      </main>

      <footer className="border-t border-white/6 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between">
          <div className="highlight font-bold">EventFlow</div>
          <div className="flex gap-6 items-center muted text-sm">
            <a className="hover:accent transition" href="#">Twitter</a>
            <a className="hover:accent transition" href="#">LinkedIn</a>
            <a className="hover:accent transition" href="#">Privacy</a>
            <a className="hover:accent transition" href="mailto:sales@eventflow.com">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

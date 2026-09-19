import Link from "next/link";

// Stats shown on landing — in a real deploy these come from the DB
const stats = [
  { label: "Registered Donors", value: "150+", id: "stat-donors" },
  { label: "Requests Fulfilled", value: "12", id: "stat-fulfilled" },
  { label: "Districts Active", value: "1", id: "stat-districts" },
  { label: "Avg Response Time", value: "< 45 min", id: "stat-response" },
];

const steps = [
  {
    num: "01",
    title: "Hospital raises a request",
    desc: "Blood group, units needed, urgency level, and deadline — that's all it takes.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Engine finds compatible donors",
    desc: "ABO+Rh compatibility, donation intervals, age, distance — all checked automatically.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Small batches are notified",
    desc: "Only a few donors at a time — no mass spam. If they don't respond, the next batch goes out.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
  },
  {
    num: "04",
    title: "Donor accepts, contacts revealed",
    desc: "Only after explicit acceptance do both parties see each other's details. Never before.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="container-main flex flex-col items-center py-16 text-center sm:py-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted mb-6">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green animate-pulse" aria-hidden="true" />
            Active in Ernakulam, Kerala
          </div>

          <h1 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl sm:leading-tight">
            Blood donor matching that respects{" "}
            <span className="text-crimson">privacy</span> and{" "}
            <span className="text-crimson">eligibility</span>
          </h1>

          <p className="mt-4 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
            No more WhatsApp forwards reaching the wrong blood group.
            Proximo. matches verified, eligible donors to real requests — 
            and never shares a phone number without consent.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/request/new"
              id="cta-need-blood"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-crimson px-8 text-base font-medium text-black transition-base hover:opacity-90 focus-visible:outline-crimson min-w-[180px]"
            >
              Need Blood
            </Link>
            <Link
              href="/join"
              id="cta-become-donor"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-card px-8 text-base font-medium text-foreground transition-base hover:bg-surface-hover min-w-[180px]"
            >
              Become a Donor
            </Link>
          </div>

          {/* Decorative blood drop shape */}
          <div className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full opacity-[0.03]" style={{ background: "radial-gradient(circle, var(--crimson) 0%, transparent 70%)" }} aria-hidden="true" />
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-subtle" aria-label="Platform statistics">
        <div className="container-main grid grid-cols-2 gap-4 py-8 sm:grid-cols-4 sm:gap-8 sm:py-10">
          {stats.map((s) => (
            <div key={s.id} id={s.id} className="text-center">
              <div className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {s.value}
              </div>
              <div className="mt-1 text-xs text-muted sm:text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-20" aria-labelledby="how-heading">
        <div className="container-main">
          <div className="text-center">
            <h2 id="how-heading" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              How Proximo. works
            </h2>
            <p className="mt-2 text-sm text-muted max-w-md mx-auto">
              From request to donation in four steps — privacy-first at every stage.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div
                key={step.num}
                className="card p-6 transition-base"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground">{step.num}</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-subtle text-muted">
                    {step.icon}
                  </div>
                </div>
                <h3 className="mt-4 text-sm font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy callout */}
      <section className="border-t border-border bg-subtle py-12 sm:py-16">
        <div className="container-main flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-light">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-green" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            Your data stays private
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
            Phone numbers are never shared until a donor explicitly accepts a request.
            There is no public donor directory. Every contact reveal is logged and auditable.
          </p>
          <Link
            href="/privacy"
            className="mt-4 text-sm font-medium text-crimson transition-base hover:opacity-80"
          >
            Read our privacy model →
          </Link>
        </div>
      </section>
    </>
  );
}

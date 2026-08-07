import Image from 'next/image'
import {
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  MapPin,
  User,
  ShieldAlert,
  Phone,
} from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { PreparationChecklist } from '@/components/preparation-checklist'

const JOURNEY = [
  {
    phase: 'Before',
    title: 'Orientation & preparation',
    body: 'Set intentions, review safety and medications, and arrange the practical support around your session.',
    state: 'In progress',
    active: true,
  },
  {
    phase: 'Session day',
    title: 'Presence & setting',
    body: 'A grounded, unhurried environment. Bearings steps back — this time belongs to you and your facilitator.',
    state: 'Scheduled',
    active: false,
  },
  {
    phase: 'After',
    title: 'Integration & reflection',
    body: 'Return slowly. Capture what surfaced and give it time to settle into daily life through structured reflection.',
    state: 'Not started',
    active: false,
  },
]

export default function Page() {
  return (
    <div id="top" className="min-h-screen">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-stretch lg:grid-cols-[1.05fr_0.95fr]">
            <div className="flex flex-col justify-center px-6 py-16 lg:py-28">
              <p className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Psychedelic therapy support
              </p>
              <h1 className="max-w-xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Find your bearings before, during, and after the work.
              </h1>
              <p className="mt-6 max-w-md text-pretty text-base leading-relaxed text-muted-foreground">
                A quiet workspace for preparing for psychedelic therapy and
                integrating what follows. Bearings does not provide therapy or
                promise outcomes — it helps you stay oriented, informed, and
                supported alongside your clinician.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href="#preparation"
                  className="group inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  Continue preparation
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </a>
                <a
                  href="#journey"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  See the full journey
                </a>
              </div>
            </div>

            <div className="relative min-h-72 overflow-hidden lg:min-h-full">
              <Image
                src="/images/hero-visionary.png"
                alt="Abstract visionary artwork of a luminous central portal woven from neural, botanical, and cellular geometry in deep indigo, petrol, violet, and gold."
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="hero-art-drift object-cover object-center"
              />
              {/* Readability veil */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-r from-background via-background/25 to-transparent lg:via-transparent"
              />
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent lg:hidden"
              />
            </div>
          </div>
        </section>

        {/* Journey rail */}
        <section
          id="journey"
          className="contour-field border-b border-border"
          aria-labelledby="journey-heading"
        >
          <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
            <div className="mb-12 max-w-lg">
              <h2
                id="journey-heading"
                className="text-2xl font-semibold tracking-tight text-foreground"
              >
                One continuous arc
              </h2>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                Preparation and integration are not separate from the session —
                they hold it. Bearings keeps the whole arc in view.
              </p>
            </div>

            <ol className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
              {JOURNEY.map((step) => (
                <li
                  key={step.phase}
                  className="relative flex flex-col bg-card p-6"
                >
                  <div className="mb-4 flex items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className={`size-2 rounded-full ${step.active ? 'bg-primary' : 'bg-border'}`}
                    />
                    <span className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
                      {step.phase}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                  <p
                    className={`mt-5 text-xs font-medium ${step.active ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    {step.state}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Preparation + session */}
        <section
          id="preparation"
          className="border-b border-border"
          aria-labelledby="preparation-heading"
        >
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 py-16 lg:grid-cols-[1fr_20rem] lg:py-20">
            <div>
              <h2
                id="preparation-heading"
                className="text-2xl font-semibold tracking-tight text-foreground"
              >
                Your preparation
              </h2>
              <p className="mt-3 max-w-lg text-base leading-relaxed text-muted-foreground">
                A short, practical set of steps to complete before your session.
                Progress is saved on this device.
              </p>
              <div className="mt-8">
                <PreparationChecklist />
              </div>
            </div>

            <aside className="lg:pt-1">
              <div className="rounded-lg border border-border bg-card p-6">
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
                  Upcoming session
                </p>
                <dl className="mt-5 flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <CalendarClock
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <div>
                      <dt className="sr-only">Date and time</dt>
                      <dd className="text-sm text-foreground">
                        Thursday, 12 March · 9:30 AM
                      </dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <div>
                      <dt className="sr-only">Facilitator</dt>
                      <dd className="text-sm text-foreground">
                        Dr. Ana Reyes, licensed therapist
                      </dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <div>
                      <dt className="sr-only">Location</dt>
                      <dd className="text-sm text-foreground">
                        Meridian Clinic · Room 2
                      </dd>
                    </div>
                  </div>
                </dl>
                <div className="mt-5 border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground">
                    Preparation status:{' '}
                    <span className="text-primary">In progress</span>
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* Integration note */}
        <section
          id="integration"
          className="border-b border-border"
          aria-labelledby="integration-heading"
        >
          <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
            <div className="max-w-lg">
              <h2
                id="integration-heading"
                className="text-2xl font-semibold tracking-tight text-foreground"
              >
                Integration
              </h2>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                Reflection continues long after the session ends. Pick up where
                you left off, without pressure to reach conclusions.
              </p>
            </div>

            <div className="mt-8 rounded-lg border border-border bg-card p-6 lg:p-8">
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
                Last reflection · 3 days ago
              </p>
              <blockquote className="mt-4 max-w-2xl text-pretty text-lg font-medium leading-relaxed text-foreground">
                “I keep returning to the image of the doorway — less afraid of it
                than I expected. I want to sit with what it asked of me.”
              </blockquote>
              <a
                href="#integration"
                className="group mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Continue this reflection
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
          </div>
        </section>

        {/* Safety — trust-critical, deliberately plain */}
        <section id="safety" aria-labelledby="safety-heading" className="bg-background">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
            <div className="rounded-lg border border-border bg-secondary p-6 lg:p-8">
              <div className="flex items-center gap-3">
                <ShieldAlert
                  className="size-5 shrink-0 text-caution"
                  aria-hidden="true"
                />
                <h2
                  id="safety-heading"
                  className="text-lg font-semibold text-foreground"
                >
                  Safety & medical information
                </h2>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Medications & contraindications
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Some medications — including SSRIs, MAOIs, and lithium — can
                    interact dangerously with psychedelics. Never change or stop a
                    prescription on your own. Review every medication and
                    supplement with your prescribing clinician before your
                    session.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Medical & psychiatric history
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    A personal or family history of psychosis, bipolar disorder,
                    or certain heart conditions may make these therapies unsafe.
                    Share your full history with your care team so they can assess
                    whether treatment is appropriate for you.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-start gap-3 border-t border-border pt-6">
                <Phone
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="text-sm leading-relaxed text-muted-foreground">
                  In a crisis or medical emergency, contact your local emergency
                  number immediately. In the US, call or text{' '}
                  <span className="font-medium text-foreground">988</span> for the
                  Suicide &amp; Crisis Lifeline. Bearings is not a medical device
                  and does not monitor you in real time.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Bearings — preparation &amp; integration support.</p>
          <p>Not a substitute for professional medical or psychological care.</p>
        </div>
      </footer>
    </div>
  )
}

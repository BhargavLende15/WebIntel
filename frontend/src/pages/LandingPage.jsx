import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ThemeToggle from '../components/ui/ThemeToggle';

const features = [
  {
    number: '01',
    title: 'Digital Readiness Assessment',
    description:
      'Review performance, SEO, accessibility, security, mobile experience, content, and AI readiness through a unified assessment.',
    icon: '◎',
  },
  {
    number: '02',
    title: 'Actionable Recommendations',
    description:
      'Understand assessment findings and identify practical improvements to help strengthen your website.',
    icon: '↗',
  },
  {
    number: '03',
    title: 'Analytics Dashboard',
    description:
      'Explore assessment scores, category-level results, and priority breakdowns in one place.',
    icon: '▥',
  },
  {
    number: '04',
    title: 'Assessment History',
    description:
      'Review previous assessments and follow score changes across the results available in your account.',
    icon: '◷',
  },
  {
    number: '05',
    title: 'PDF Reports',
    description:
      'Generate a report of your assessment findings to support review, communication, and planning.',
    icon: '▤',
  },
  {
    number: '06',
    title: 'AI Decision Support',
    description:
      'Ask questions about assessment findings with the Gemini-powered assistant when the provider is configured.',
    icon: '✳',
  },
];

const categories = [
  'Performance',
  'SEO',
  'Accessibility',
  'Security',
  'Mobile',
  'Content',
  'AI readiness',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-primary-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-3"
          aria-label="WebIntel home"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-lg font-bold text-white shadow-lg shadow-primary-600/20">
            W
          </span>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            WebIntel
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          <Link to="/login">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link to="/register">
            <Button>Get started</Button>
          </Link>
        </div>
      </nav>

      <main>
        <section className="relative mx-auto max-w-7xl px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24 lg:pt-28">
          <div
            className="pointer-events-none absolute left-1/2 top-12 -z-0 h-72 w-72 -translate-x-1/2 rounded-full bg-primary-400/10 blur-3xl sm:h-96 sm:w-96"
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-4xl text-center">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50/80 px-4 py-2 text-xs font-semibold tracking-wide text-primary-700 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-300 sm:text-sm">
              <span className="h-2 w-2 rounded-full bg-primary-500" />
              WEBSITE INTELLIGENCE & DIGITAL READINESS
            </div>

            <h1 className="text-4xl font-bold leading-[1.12] tracking-tight text-slate-950 dark:text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Understand your website.
              <span className="mt-2 block bg-gradient-to-r from-primary-600 to-indigo-500 bg-clip-text pb-2 text-transparent">
                Improve what matters.
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
              WebIntel turns website assessment results into a clearer picture
              of digital readiness, helping you understand key findings,
              prioritize improvements, and track available results.
            </p>

            <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Link to="/register">
                <Button size="lg" block>
                  Start your assessment
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" block>
                  Sign in to WebIntel
                </Button>
              </Link>
            </div>

            <p className="mt-5 text-xs text-slate-500 dark:text-slate-400">
              Read-only website assessment. WebIntel does not modify your site.
            </p>
          </div>

          <div className="relative mx-auto mt-16 max-w-5xl">
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-2xl shadow-slate-900/5 backdrop-blur sm:p-7 dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-black/20">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-700">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-400">
                    WEBINTEL OVERVIEW
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white sm:text-xl">
                    One place for website insights
                  </h2>
                </div>
                <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  Assessment workspace
                </span>
              </div>

              <div className="grid gap-3 pt-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Assessment
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                    Website readiness
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    A consolidated view
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Findings
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                    Category insights
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Understand key metrics
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Next steps
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                    Prioritized actions
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Focus on improvements
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Reporting
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                    History & reports
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Review available results
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <span
                    key={category}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
              Product overview illustration — not live assessment data.
            </p>
          </div>
        </section>

        <section className="border-y border-slate-200/80 bg-white/70 py-16 dark:border-slate-800 dark:bg-slate-900/30 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">
                THE WORKSPACE
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                From assessment to action
              </h2>
              <p className="mt-4 leading-7 text-slate-600 dark:text-slate-400">
                Explore the tools that help you interpret your website findings
                and organize the next steps.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card
                  key={feature.number}
                  glass
                  className="h-full transition duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-2xl text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                      {feature.icon}
                    </span>
                    <span className="text-xs font-semibold tracking-widest text-slate-400">
                      {feature.number}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    {feature.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 py-20 text-center sm:px-8 sm:py-24">
          <div className="rounded-3xl border border-primary-100 bg-gradient-to-br from-primary-50 to-indigo-50/70 px-6 py-12 dark:border-slate-700 dark:from-slate-900 dark:to-indigo-950/40 sm:px-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">
              GET STARTED
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Make your next website improvement an informed one.
            </h2>
            <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-600 dark:text-slate-400">
              Sign in to review your assessments, explore findings, and plan
              practical improvements.
            </p>
            <div className="mt-8">
              <Link to="/register">
                <Button size="lg">Create your account</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-sm text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              WebIntel
            </span>{' '}
            — Website intelligence and digital readiness.
          </p>
          <p>Read-only assessment · Your website remains unchanged.</p>
        </div>
      </footer>
    </div>
  );
}

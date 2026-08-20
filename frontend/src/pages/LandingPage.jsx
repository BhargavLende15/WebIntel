import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ThemeToggle from '../components/ui/ThemeToggle';

const features = [
  {
    title: 'Unified Digital Readiness Score',
    description:
      'Combines performance, SEO, accessibility, security, AI readiness, content, and mobile into one actionable score.',
    icon: '🎯',
  },
  {
    title: 'AI-Powered Recommendations',
    description:
      'Gemini AI analyzes your metrics and delivers prioritized fixes with business impact estimates.',
    icon: '🤖',
  },
  {
    title: 'Business Intelligence Dashboards',
    description:
      'Interactive charts, radar plots, trend lines, and priority matrices for executive reporting.',
    icon: '📊',
  },
  {
    title: 'Predictive Analytics',
    description:
      'Machine learning models forecast score improvements and category growth over time.',
    icon: '🔮',
  },
  {
    title: 'Continuous Monitoring',
    description:
      'Track websites over time, compare reports, and measure improvement after each fix.',
    icon: '📡',
  },
  {
    title: 'Executive Reports',
    description: 'Generate professional PDF and HTML reports with charts and recommendations.',
    icon: '📄',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-primary-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 text-2xl font-bold text-primary-600">
          <span>🌐</span> WebIntel
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link to="/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link to="/dashboard">
            <Button>Get Started</Button>
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-6 py-20 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-sm text-primary-700 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-500" />
          </span>
          AI-Powered Digital Readiness Assessment
        </div>
        <h1 className="mb-6 text-5xl font-bold tracking-tight text-slate-900 dark:text-white md:text-6xl">
          Is Your Website Ready for the{' '}
          <span className="bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
            AI-Driven Web
          </span>
          ?
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
          WebIntel evaluates your website across performance, SEO, accessibility, security, AI
          search readiness, and business intelligence — delivering a unified score and actionable
          recommendations.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/analyze">
            <Button size="lg">Analyze Your Website</Button>
          </Link>
          <Link to="/dashboard">
            <Button size="lg" variant="outline">
              View Dashboard
            </Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold text-slate-900 dark:text-white">
          Everything You Need for Digital Readiness
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} glass className="transition hover:scale-[1.02]">
              <div className="mb-4 text-4xl">{feature.icon}</div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <p>WebIntel – AI-Powered Digital Readiness Assessment Platform</p>
        <p className="mt-1">Phase 1 Foundation Complete • Analysis-only • Never modifies your website</p>
      </footer>
    </div>
  );
}

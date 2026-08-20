import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md">
      <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h2>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Authentication structure prepared for Phase 8. Sign in to access your dashboard.
      </p>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Email
          </label>
          <input
            type="email"
            placeholder="you@company.com"
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-800"
          />
        </div>
        <Link to="/dashboard" className="block">
          <Button className="w-full" type="button">
            Sign In (Demo)
          </Button>
        </Link>
      </form>
      <p className="mt-4 text-center text-xs text-slate-400">
        Full authentication will be implemented in Phase 8
      </p>
    </Card>
  );
}

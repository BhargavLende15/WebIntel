import { Link, Outlet } from 'react-router-dom';
import ThemeToggle from '../components/ui/ThemeToggle';

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-primary-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="flex items-center justify-between p-6">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-xl text-xl font-bold text-primary-600"
        >
          <span aria-hidden="true">{'\uD83C\uDF10'}</span>
          WebIntel
        </Link>
        <ThemeToggle />
      </header>
      <div className="flex flex-1 items-center justify-center p-6">
        <Outlet />
      </div>
    </div>
  );
}

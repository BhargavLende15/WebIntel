import { NavLink } from 'react-router-dom';
import ThemeToggle from '../ui/ThemeToggle';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/analyze', label: 'Analyze', icon: '🔍' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar() {
  return (
    <aside className="hidden w-64 flex-shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:block">
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-6 dark:border-slate-800">
        <span className="text-2xl">🌐</span>
        <span className="text-xl font-bold text-primary-600">WebIntel</span>
      </div>
      <nav className="space-y-1 p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export function MobileNav() {
  return (
    <nav className="flex gap-2 overflow-x-auto border-t border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium ${
              isActive
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                : 'text-slate-600 dark:text-slate-400'
            }`
          }
        >
          {item.icon} {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function Header({ title, subtitle }) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      <ThemeToggle />
    </header>
  );
}

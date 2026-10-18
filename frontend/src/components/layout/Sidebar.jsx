
import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { getLatestDashboard } from '../../services/api';
import ThemeToggle from '../ui/ThemeToggle';

const primaryItems = [
  { to: '/dashboard', label: 'Dashboard', description: 'Overview and insights', icon: 'dashboard' },
  { to: '/analyze', label: 'Analyze website', description: 'Start a new assessment', icon: 'analyze' },
];

const assessmentItems = [
  { path: 'results', label: 'Results', description: 'Detailed assessment findings' },
  { path: 'recommendations', label: 'Recommendations', description: 'Prioritized improvements' },
  { path: 'analytics', label: 'Analytics', description: 'Score trends and breakdowns' },
  { path: 'reports', label: 'Reports', description: 'Assessment reports' },
  { path: 'assistant', label: 'AI Assistant', description: 'Ask about this assessment' },
];

function NavIcon({ name, className = 'h-5 w-5' }) {
  const common = {
    className,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    viewBox: '0 0 24 24',
    'aria-hidden': true,
  };

  switch (name) {
    case 'dashboard':
      return <svg {...common}><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="4" rx="1.5" /><rect x="13.5" y="11.5" width="7" height="9" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /></svg>;
    case 'analyze':
      return <svg {...common}><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /><path d="M7.5 11h2l1.5-3 2 5 1.5-2h1" /></svg>;
    case 'history':
      return <svg {...common}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l3 2" /></svg>;
    case 'results':
      return <svg {...common}><path d="M5 3.5h10l4 4V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" /><path d="M14 3.5V8h5M8 12h8M8 16h8" /></svg>;
    case 'recommendations':
      return <svg {...common}><path d="m12 3 2.5 5.1 5.6.8-4.1 4 .9 5.6-4.9-2.6-4.9 2.6.9-5.6-4.1-4 5.6-.8Z" /></svg>;
    case 'analytics':
      return <svg {...common}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>;
    case 'reports':
      return <svg {...common}><path d="M6 3h9l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v5h5M8 12h8M8 16h8" /></svg>;
    case 'assistant':
      return <svg {...common}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1" /><circle cx="12" cy="12" r="5" /></svg>;
    case 'settings':
      return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.5 2.6-1.7-.7a8 8 0 0 1-1.7 1l-.3 1.8h-3l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.7-1.5-2.6 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.5-2.6 1.7.7a8 8 0 0 1 1.7-1l.3-1.8h3l.3 1.8a8 8 0 0 1 1.7 1l1.7-.7 1.5 2.6-1.4 1.1a7 7 0 0 1 0 2Z" transform="translate(-1 -1) scale(1.08)" /></svg>;
    case 'logout':
      return <svg {...common}><path d="M10 17l5-5-5-5M15 12H3M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></svg>;
    default:
      return null;
  }
}

function NavigationLinks({ groups, onNavigate, mobile = false }) {
  return (
    <div className={mobile ? 'flex items-center gap-1' : 'space-y-6'}>
      {groups.map((group) => (
        <section key={group.label} className={mobile ? 'contents' : undefined}>
          {!mobile && (
            <h2 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
              {group.label}
            </h2>
          )}
          <div className={mobile ? 'flex items-center gap-1' : 'space-y-1'}>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                aria-label={mobile ? item.label : undefined}
                title={mobile ? item.label : undefined}
                className={({ isActive }) => [
                  'group flex items-center gap-3 rounded-xl font-medium transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900',
                  mobile ? 'min-h-11 shrink-0 px-3 py-2 text-xs' : 'px-3 py-3 text-sm',
                  isActive
                    ? 'bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-600/10 dark:bg-primary-500/10 dark:text-primary-300 dark:ring-primary-400/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white',
                ].join(' ')}
              >
                {({ isActive }) => (
                  <>
                    <span className={[
                      'flex shrink-0 items-center justify-center rounded-lg transition-colors',
                      mobile ? 'h-7 w-7' : 'h-9 w-9',
                      isActive
                        ? 'bg-white text-primary-600 shadow-sm dark:bg-slate-800 dark:text-primary-300'
                        : 'text-slate-500 group-hover:text-slate-800 dark:text-slate-400 dark:group-hover:text-white',
                    ].join(' ')}>
                      <NavIcon name={item.icon} className={mobile ? 'h-4 w-4' : 'h-5 w-5'} />
                    </span>
                    {!mobile && (
                      <span className="min-w-0 flex-1">
                        <span className="block">{item.label}</span>
                        <span className="mt-0.5 block text-xs font-normal text-slate-500 dark:text-slate-400">
                          {item.description}
                        </span>
                      </span>
                    )}
                    {mobile && <span>{item.label}</span>}
                    {!mobile && isActive && <span className="h-1.5 w-1.5 rounded-full bg-primary-600 dark:bg-primary-400" />}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function LogoutButton({ mobile = false }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      aria-label={mobile ? 'Sign out' : undefined}
      title={mobile ? 'Sign out' : undefined}
      className={[
        'flex items-center justify-center gap-2 rounded-xl font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900',
        mobile
          ? 'h-11 w-11 shrink-0 px-0 text-xs'
          : 'w-full min-h-11 px-3 py-2 text-sm',
        'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30',
      ].join(' ')}
    >
      <NavIcon name="logout" className={mobile ? 'h-4 w-4' : 'h-5 w-5'} />
      {mobile ? <span className="sr-only">Sign out</span> : 'Sign out'}
    </button>
  );
}


function useLatestDashboard() {
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    let active = true;

    const refreshDashboard = () => {
      getLatestDashboard()
        .then(({ data }) => {
          if (active) setDashboard(data);
        })
        .catch(() => {
          if (active) setDashboard(null);
        });
    };

    refreshDashboard();
    window.addEventListener('webintel:dashboard-refresh', refreshDashboard);

    return () => {
      active = false;
      window.removeEventListener('webintel:dashboard-refresh', refreshDashboard);
    };
  }, []);

  return dashboard;
}

export default function Sidebar() {
  const { user } = useAuth();
  const dashboard = useLatestDashboard();

  const analysisId = dashboard?.analysis_id;
  const websiteId = dashboard?.website_id;

  const groups = [
    {
      label: 'Workspace',
      items: [
        ...primaryItems,
        ...(websiteId
          ? [{ to: `/history/${websiteId}`, label: 'History', description: 'Previous assessments', icon: 'history' }]
          : []),
      ],
    },
    ...(analysisId
      ? [{
          label: 'Insights',
          items: assessmentItems.map((item) => ({
            to: `/${item.path}/${analysisId}`,
            label: item.label,
            description: item.description,
            icon: item.path,
          })),
        }]
      : []),
    {
      label: 'Preferences',
      items: [{ to: '/settings', label: 'Settings', description: 'Account and preferences', icon: 'settings' }],
    },
  ];

  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 lg:flex lg:flex-col">
      <div className="flex h-[72px] items-center gap-3 border-b border-slate-200/80 px-6 dark:border-slate-800">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-base font-bold text-white shadow-sm shadow-primary-600/20">
          W
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold tracking-tight text-slate-950 dark:text-white">WebIntel</p>
          <p className="text-[11px] font-medium tracking-wide text-slate-500 dark:text-slate-400">WEBSITE INTELLIGENCE</p>
        </div>
      </div>

      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-4 py-6">
        <NavigationLinks groups={groups} />
      </nav>

      <div className="border-t border-slate-200/80 p-4 dark:border-slate-800">
        <div className="mb-3 flex min-w-0 items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700 dark:bg-primary-900/50 dark:text-primary-300">
            {(user?.full_name || user?.email || 'U').trim().charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{user?.full_name || 'Account'}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400" title={user?.email}>{user?.email || 'Signed in'}</p>
          </div>
        </div>
        <ThemeToggle />
        <div className="mt-3">
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const dashboard = useLatestDashboard();

  const analysisId = dashboard?.analysis_id;
  const websiteId = dashboard?.website_id;

  const groups = [{
    label: 'Workspace',
    items: [
      ...primaryItems,
      ...(websiteId ? [{ to: `/history/${websiteId}`, label: 'History', icon: 'history' }] : []),
      ...(analysisId ? assessmentItems.map((item) => ({
        to: `/${item.path}/${analysisId}`,
        label: item.label,
        icon: item.path,
      })) : []),
      { to: '/settings', label: 'Settings', icon: 'settings' },
    ],
  }];

  return (
    <nav
      aria-label="Mobile navigation"
      className="sticky bottom-0 z-30 flex items-stretch gap-1 border-t border-slate-200 bg-white/95 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(15,23,42,0.04)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 lg:hidden"
    >
      {/* The link list scrolls horizontally; sign-out stays pinned so it can
          never be pushed off-screen on a narrow viewport. */}
      <div className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain">
        <NavigationLinks groups={groups} mobile />
      </div>
      <span
        aria-hidden="true"
        className="my-1 w-px shrink-0 bg-slate-200 dark:bg-slate-700"
      />
      <div className="shrink-0">
        <LogoutButton mobile />
      </div>
    </nav>
  );
}

export function Header({ title, subtitle }) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex min-h-[72px] items-center justify-between gap-4 border-b border-slate-200/80 bg-white/90 px-4 py-4 backdrop-blur sm:px-6 xl:px-8 dark:border-slate-800 dark:bg-slate-900/90">
      <div className="min-w-0">
        <h1
          title={title}
          className="truncate text-lg font-semibold tracking-tight text-slate-950 sm:text-xl dark:text-white"
        >
          {title}
        </h1>
        {subtitle && (
          <p
            title={typeof subtitle === 'string' ? subtitle : undefined}
            className="mt-0.5 hidden truncate text-sm text-slate-500 sm:block dark:text-slate-400"
          >
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <div className="hidden min-w-0 text-right md:block">
          <p
            title={user?.full_name || user?.email || undefined}
            className="max-w-48 truncate text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            {user?.full_name || user?.email || 'WebIntel user'}
          </p>
          {user?.full_name && user?.email && (
            <p
              title={user.email}
              className="max-w-48 truncate text-xs text-slate-500 dark:text-slate-400"
            >
              {user.email}
            </p>
          )}
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}


import Card, { CardHeader } from '../components/ui/Card';
import ThemeToggle from '../components/ui/ThemeToggle';
import { PageWrapper } from '../layouts/MainLayout';
import { useTheme } from '../hooks/useTheme';

const THEME_LABELS = {
  light: 'Light',
  dark: 'Dark',
};

export default function SettingsPage() {
  const { theme } = useTheme();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

  return (
    <PageWrapper title="Settings" subtitle="Configure your WebIntel experience">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader title="Appearance" subtitle="Customize the interface" />
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Theme</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Currently: {THEME_LABELS[theme] || 'Unknown'}
              </p>
            </div>
            <ThemeToggle />
          </div>
        </Card>

        <Card>
          <CardHeader title="API configuration" subtitle="Backend connection" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            API URL
          </p>
          <p className="mt-1 break-all font-mono text-xs text-slate-700 dark:text-slate-300">
            {apiUrl}
          </p>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Set with the <code className="font-mono">VITE_API_URL</code> environment variable
            before building.
          </p>
        </Card>

        <Card>
          <CardHeader title="Monitoring" subtitle="Continuous assessment" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Scheduled reassessments and notification preferences are not part of the current
            implementation. Nothing is scheduled in the background today.
          </p>
        </Card>
      </div>
    </PageWrapper>
  );
}

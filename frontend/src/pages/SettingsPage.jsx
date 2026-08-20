import Card, { CardHeader } from '../components/ui/Card';
import ThemeToggle from '../components/ui/ThemeToggle';
import { PageWrapper } from '../layouts/MainLayout';
import { useTheme } from '../hooks/useTheme';

export default function SettingsPage() {
  const { theme } = useTheme();

  return (
    <PageWrapper title="Settings" subtitle="Configure your WebIntel experience">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader title="Appearance" subtitle="Customize the interface" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Theme</p>
              <p className="text-xs text-slate-500">Currently: {theme}</p>
            </div>
            <ThemeToggle />
          </div>
        </Card>

        <Card>
          <CardHeader title="API Configuration" subtitle="Backend connection" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            API URL: {import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}
          </p>
        </Card>

        <Card>
          <CardHeader title="Monitoring" subtitle="Continuous assessment — Phase 7" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configure reassessment frequency and notification preferences in Phase 7.
          </p>
        </Card>
      </div>
    </PageWrapper>
  );
}

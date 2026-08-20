import { Link } from 'react-router-dom';
import ChartPlaceholder from '../charts/ChartPlaceholder';
import Button from '../components/ui/Button';
import Card, { CardHeader } from '../components/ui/Card';
import { PageWrapper } from '../layouts/MainLayout';

const categories = [
  { name: 'Performance', weight: '20%', score: '—' },
  { name: 'SEO', weight: '20%', score: '—' },
  { name: 'Accessibility', weight: '15%', score: '—' },
  { name: 'Security', weight: '15%', score: '—' },
  { name: 'AI Readiness', weight: '15%', score: '—' },
  { name: 'Content Quality', weight: '10%', score: '—' },
  { name: 'Mobile Experience', weight: '5%', score: '—' },
];

export default function DashboardPage() {
  return (
    <PageWrapper
      title="Dashboard"
      subtitle="Overview of your digital readiness assessments"
    >
      <div className="mb-6 flex flex-wrap gap-4">
        <Link to="/analyze">
          <Button>Analyze Website</Button>
        </Link>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <Card glass className="lg:col-span-1">
          <CardHeader title="Digital Readiness Score" subtitle="Overall unified score" />
          <div className="flex flex-col items-center py-6">
            <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-8 border-slate-200 dark:border-slate-700">
              <span className="text-4xl font-bold text-slate-300 dark:text-slate-600">—</span>
            </div>
            <p className="mt-4 text-sm text-slate-500">Run an analysis to see your score</p>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Category Breakdown" subtitle="Weighted scoring categories" />
          <div className="space-y-3">
            {categories.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {cat.name}
                  </span>
                  <span className="ml-2 text-xs text-slate-400">({cat.weight})</span>
                </div>
                <span className="text-sm font-semibold text-slate-400">{cat.score}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Score Trends" subtitle="Historical performance" />
          <ChartPlaceholder title="Line Chart – Score Over Time" type="line" />
        </Card>
        <Card>
          <CardHeader title="Category Radar" subtitle="Multi-dimensional view" />
          <ChartPlaceholder title="Radar Chart – Category Scores" type="radar" />
        </Card>
      </div>
    </PageWrapper>
  );
}

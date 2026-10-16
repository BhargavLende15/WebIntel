import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card, { CardHeader } from '../components/ui/Card';
import { PageWrapper } from '../layouts/MainLayout';
import { getLatestDashboard } from '../services/api';

const categories = [
  { key: 'performance', name: 'Performance', weight: '20%' },
  { key: 'seo', name: 'SEO', weight: '20%' },
  { key: 'accessibility', name: 'Accessibility', weight: '15%' },
  { key: 'security', name: 'Security', weight: '15%' },
  { key: 'ai_readiness', name: 'AI Readiness', weight: '15%' },
  { key: 'content_quality', name: 'Content Quality', weight: '10%' },
  { key: 'mobile_experience', name: 'Mobile Experience', weight: '5%' },
];

function formatScore(value) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toFixed(1)
    : 'N/A';
}

function CategoryRow({ category, value }) {
  const valid = typeof value === 'number' && Number.isFinite(value);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {category.name}
          </span>
          <span className="ml-2 text-xs text-slate-400">
            ({category.weight} weight)
          </span>
        </div>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {formatScore(value)}{valid ? '/100' : ''}
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700"
        role="progressbar"
        aria-label={`${category.name} score`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={valid ? value : undefined}
      >
        {valid && (
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
          />
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      try {
        const response = await getLatestDashboard();
        if (active) setDashboard(response.data);
      } catch (err) {
        if (!active) return;

        const status = err.response?.status;
        if (status === 404 || status === 409) {
          setError(
            'No completed analysis with a saved score is available yet. Analyze a website first, then return here.'
          );
        } else if (!err.response) {
          setError(
            'Cannot reach the WebIntel API. Check that the backend is running and try again.'
          );
        } else {
          setError(
            err.response?.data?.detail ||
              'The dashboard could not be loaded. Please try again.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const score = dashboard?.overall_score;
  const validScore = typeof score === 'number' && Number.isFinite(score);
  const categoryScores = dashboard?.category_scores || {};

  return (
    <PageWrapper
      title="Dashboard"
      subtitle="Overview of your website readiness assessments"
    >
      <div className="mb-6 flex flex-wrap gap-3">
        <Link to="/analyze">
          <Button>Analyze Website</Button>
        </Link>
        {dashboard?.analysis_id && (
          <Link to={`/results/${dashboard.analysis_id}`}>
            <Button variant="secondary">View Latest Results</Button>
          </Link>
        )}
      </div>

      {loading && (
        <Card>
          <div className="animate-pulse space-y-4" aria-label="Loading dashboard">
            <div className="h-5 w-48 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-800" />
            <div className="h-3 w-4/5 rounded bg-slate-100 dark:bg-slate-800" />
            <div className="h-3 w-3/5 rounded bg-slate-100 dark:bg-slate-800" />
          </div>
        </Card>
      )}

      {!loading && error && (
        <Card>
          <CardHeader title="Dashboard unavailable" />
          <p className="text-sm text-slate-600 dark:text-slate-300">{error}</p>
          <div className="mt-4">
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </Card>
      )}

      {!loading && !error && dashboard && (
        <>
          <div className="mb-8 grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader
                title="Digital Readiness Score"
                subtitle="Latest completed assessment"
              />
              <div className="flex flex-col items-center py-6">
                <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full border-8 border-blue-500/70">
                  <span className="text-4xl font-bold text-slate-900 dark:text-white">
                    {validScore ? score.toFixed(1) : 'N/A'}
                  </span>
                  <span className="text-xs text-slate-500">out of 100</span>
                </div>
                <p className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-200">
                  Grade: {dashboard.grade || 'N/A'}
                </p>
                <p className="mt-2 text-center text-xs text-slate-500">
                  Weighted measurement coverage: {formatScore(dashboard.confidence * 100)}
                  {typeof dashboard.confidence === 'number' ? '%' : ''}
                </p>
              </div>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader
                title="Category Breakdown"
                subtitle="Scores returned by the latest saved assessment"
              />
              <div className="space-y-5">
                {categories.map((category) => (
                  <CategoryRow
                    key={category.key}
                    category={category}
                    value={categoryScores[category.key]}
                  />
                ))}
              </div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Score Trends"
                subtitle="Historical trend data"
              />
              <p className="text-sm text-slate-500">
                Historical trend data is not available from this dashboard response yet.
                No trend values are fabricated.
              </p>
            </Card>

            <Card>
              <CardHeader
                title="Assessment Details"
                subtitle="About this result"
              />
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {dashboard.explanation ||
                  'This score is a heuristic assessment based on the available measurements.'}
              </p>
              {dashboard.analysis_id && (
                <p className="mt-4 break-all text-xs text-slate-500">
                  Analysis ID: {dashboard.analysis_id}
                </p>
              )}
            </Card>
          </div>

          <p className="mt-6 text-xs leading-5 text-slate-500">
            WebIntel readiness scores are heuristic indicators based on collected
            signals. They are not a calibrated industry benchmark and do not predict
            search rankings. Measurement coverage indicates how much of the scoring
            model could be evaluated; it is not statistical confidence.
          </p>
        </>
      )}
    </PageWrapper>
  );
}

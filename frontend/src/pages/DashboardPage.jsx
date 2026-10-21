import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card, { CardHeader } from '../components/ui/Card';
import { PageWrapper } from '../layouts/MainLayout';
import { getLatestDashboard, getWebsite } from '../services/api';
import { clampScore, formatScore as formatScoreValue, isNumericValue } from '../utils/format';

const categories = [
  { key: 'performance', name: 'Performance', weight: '20%', marker: 'P' },
  { key: 'seo', name: 'SEO', weight: '20%', marker: 'S' },
  { key: 'accessibility', name: 'Accessibility', weight: '15%', marker: 'A' },
  { key: 'security', name: 'Security', weight: '15%', marker: 'S' },
  { key: 'ai_readiness', name: 'AI readiness', weight: '15%', marker: 'AI' },
  { key: 'content_quality', name: 'Content quality', weight: '10%', marker: 'C' },
  { key: 'mobile_experience', name: 'Mobile experience', weight: '5%', marker: 'M' },
];

function formatScore(value) {
  return formatScoreValue(value);
}

function scoreTone(value) {
  if (!isNumericValue(value)) return 'bg-slate-300 dark:bg-slate-600';
  const score = Number(value);
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-primary-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-rose-500';
}

function MetricCard({ label, value, detail, marker }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-3 text-2xl font-semibold tabular-nums tracking-tight text-slate-950 dark:text-white">
            {value}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{detail}</p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-sm font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
          {marker}
        </span>
      </div>
    </Card>
  );
}

function CategoryScore({ category, value }) {
  const valid = isNumericValue(value);
  const safeValue = clampScore(value);

  return (
    <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {category.marker}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="min-w-0 text-sm font-medium text-slate-800 dark:text-slate-200">
              {category.name}
            </p>
            <p className="shrink-0 text-sm font-semibold tabular-nums text-slate-950 dark:text-white">
              {formatScore(value)}
              {valid ? <span className="font-normal text-slate-500">/100</span> : null}
            </p>
          </div>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
            role="progressbar"
            aria-label={`${category.name} score`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={valid ? safeValue : undefined}
            aria-valuetext={valid ? `${Number(value).toFixed(1)} out of 100` : 'Not available'}
          >
            {valid && (
              <div
                className={`h-full rounded-full transition-all duration-500 ${scoreTone(value)}`}
                style={{ width: `${safeValue}%` }}
              />
            )}
          </div>
          <p className="mt-2 text-xs text-slate-400">Model weight: {category.weight}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyDashboard({ onRetry }) {
  return (
    <Card className="flex flex-col items-start gap-5 border-dashed p-8 sm:p-10">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-xl font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
        W
      </span>
      <div className="max-w-xl">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
          Your workspace is ready
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Run your first website assessment to see readiness scores, measured categories,
          and prioritized improvement opportunities here.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link to="/analyze">
          <Button>Analyze a website</Button>
        </Link>
        <Button variant="outline" onClick={onRetry}>Refresh dashboard</Button>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [website, setWebsite] = useState(null);

  const loadDashboard = useCallback(async (activeRef) => {
    setLoading(true);
    setError('');

    try {
      const response = await getLatestDashboard();
      if (activeRef.active) {
        const data = response.data;
        setDashboard(data);
        if (data.website_id) {
          try {
            const w = await getWebsite(data.website_id);
            if (activeRef.active) setWebsite(w.data);
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (err) {
      if (!activeRef.active) return;

      const status = err.response?.status;
      if (status === 404 || status === 409) {
        setDashboard(null);
        setError('empty');
      } else if (!err.response) {
        setError('Cannot reach the WebIntel API. Check that the backend is running.');
      } else {
        setError(err.response?.data?.detail || 'The dashboard could not be loaded.');
      }
    } finally {
      if (activeRef.active) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const activeRef = { active: true };
    loadDashboard(activeRef);
    return () => { activeRef.active = false; };
  }, [loadDashboard, retryKey]);

  const categoryScores = dashboard?.category_scores || {};
  const validCategories = categories.filter((category) => isNumericValue(categoryScores[category.key]));
  const score = dashboard?.overall_score;
  const validScore = isNumericValue(score);
  const coverage =
    typeof dashboard?.confidence === 'number' && Number.isFinite(dashboard.confidence)
      ? Math.round(dashboard.confidence * 100)
      : null;

  return (
    <PageWrapper
      title="Overview"
      subtitle="Your website intelligence workspace"
    >
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-400">
            Workspace overview
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            Website readiness
          </h2>
          {(website?.name || website?.url || dashboard?.website_name || dashboard?.website_url) && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <span className="font-medium text-slate-900 dark:text-white">
                {website?.name || dashboard?.website_name || website?.domain || dashboard?.website_domain || 'Website'}
              </span>
              {(website?.url || dashboard?.website_url) && (
                <span className="text-slate-500 dark:text-slate-400 break-all">
                  • {website?.url || dashboard?.website_url}
                </span>
              )}
            </div>
          )}
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Review your latest saved assessment and decide what to improve next.
          </p>
        </div>
        <Link to="/analyze" className="shrink-0">
          <Button size="lg">+ New assessment</Button>
        </Link>
      </div>

      {loading && (
        <div className="grid gap-5 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <Card key={item}>
              <div className="skeleton h-4 w-28" />
              <div className="skeleton mt-5 h-9 w-36" />
              <div className="skeleton mt-4 h-3 w-full" />
            </Card>
          ))}
          <Card className="lg:col-span-3">
            <div className="skeleton h-5 w-48" />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="skeleton h-20" />
              ))}
            </div>
          </Card>
        </div>
      )}

      {!loading && error === 'empty' && (
        <EmptyDashboard onRetry={() => setRetryKey((key) => key + 1)} />
      )}

      {!loading && error && error !== 'empty' && (
        <Card>
          <CardHeader title="Dashboard unavailable" />
          <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
          <div className="mt-4">
            <Button onClick={() => setRetryKey((key) => key + 1)}>Try again</Button>
          </div>
        </Card>
      )}

      {!loading && !error && dashboard && (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <Card className="relative overflow-hidden sm:col-span-2 xl:col-span-1">
              <div className="absolute inset-x-0 top-0 h-1 bg-primary-600" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Digital readiness score
              </p>
              <div className="mt-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-5xl font-semibold tracking-tight text-slate-950 dark:text-white">
                    {formatScore(score)}
                    <span className="ml-1 text-base font-medium text-slate-400">/100</span>
                  </p>
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                    Latest completed assessment
                  </p>
                </div>
                <div className="rounded-2xl bg-primary-50 px-4 py-3 text-center dark:bg-primary-900/30">
                  <p className="text-xs font-medium uppercase tracking-wide text-primary-600 dark:text-primary-300">Grade</p>
                  <p className="mt-1 text-2xl font-bold text-primary-700 dark:text-primary-200">
                    {dashboard.grade || '—'}
                  </p>
                </div>
              </div>
              {validScore && (
                <div
                  className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
                  role="progressbar"
                  aria-label="Digital readiness score"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={clampScore(score)}
                  aria-valuetext={`${Number(score).toFixed(1)} out of 100`}
                >
                  <div
                    className={`h-full rounded-full ${scoreTone(score)}`}
                    style={{ width: `${clampScore(score)}%` }}
                  />
                </div>
              )}
              <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Heuristic assessment, not a search ranking guarantee.
              </p>
            </Card>

            <MetricCard
              label="Measurement coverage"
              value={coverage === null ? '—' : `${coverage}%`}
              detail="Share of the scoring model that could be evaluated"
              marker="MC"
            />

            <MetricCard
              label="Measured categories"
              value={`${validCategories.length} / ${categories.length}`}
              detail="Categories with a numeric score in this assessment"
              marker="CAT"
            />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
            <Card>
              <CardHeader
                title="Category performance"
                subtitle="Measured scores from your latest saved assessment"
              />
              {validCategories.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {categories.map((category) => (
                    <CategoryScore
                      key={category.key}
                      category={category}
                      value={categoryScores[category.key]}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No numeric category scores are available for this assessment.
                </p>
              )}
              <p className="mt-5 text-xs leading-5 text-slate-400">
                A missing score means that category was not measured; it does not mean zero.
                Category weights describe the scoring model, not the percentage of checks passed.
              </p>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader
                  title="Continue your analysis"
                  subtitle="Open the saved assessment"
                />
                <div className="space-y-3">
                  <Link
                    to={`/results/${dashboard.analysis_id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-primary-300 hover:bg-primary-50/50 dark:border-slate-700 dark:hover:border-primary-700 dark:hover:bg-primary-900/10"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">Full results</span>
                      <span className="mt-1 block text-xs text-slate-500">Inspect crawl and scoring details</span>
                    </span>
                    <span aria-hidden="true" className="text-lg text-primary-600">→</span>
                  </Link>
                  <Link
                    to={`/recommendations/${dashboard.analysis_id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-primary-300 hover:bg-primary-50/50 dark:border-slate-700 dark:hover:border-primary-700 dark:hover:bg-primary-900/10"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">Recommendations</span>
                      <span className="mt-1 block text-xs text-slate-500">Review prioritized improvements</span>
                    </span>
                    <span aria-hidden="true" className="text-lg text-primary-600">→</span>
                  </Link>
                  <Link
                    to={`/reports/${dashboard.analysis_id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-primary-300 hover:bg-primary-50/50 dark:border-slate-700 dark:hover:border-primary-700 dark:hover:bg-primary-900/10"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">Assessment report</span>
                      <span className="mt-1 block text-xs text-slate-500">Generate a downloadable report</span>
                    </span>
                    <span aria-hidden="true" className="text-lg text-primary-600">→</span>
                  </Link>
                </div>
              </Card>

              <Card>
                <CardHeader title="Assessment notes" subtitle="How to interpret this overview" />
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {dashboard.explanation ||
                    'This assessment summarizes the signals collected by WebIntel during the latest completed crawl.'}
                </p>
                <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Coverage is not statistical confidence. Scores are heuristic indicators based on
                  available measurements and should be interpreted alongside the detailed results.
                </p>
                <p className="mt-4 break-all border-t border-slate-100 pt-4 text-xs text-slate-400 dark:border-slate-800">
                  Assessment ID: {dashboard.analysis_id}
                </p>
              </Card>
            </div>
          </div>
        </>
      )}
    </PageWrapper>
  );
}

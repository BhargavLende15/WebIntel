import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card, { CardHeader } from '../components/ui/Card';
import { PageWrapper } from '../layouts/MainLayout';
import { getDashboard, getSavedRecommendations } from '../services/api';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const CATEGORY_LABELS = {
  performance: 'Performance',
  seo: 'SEO',
  accessibility: 'Accessibility',
  security: 'Security',
  ai_readiness: 'AI Readiness',
  content_quality: 'Content Quality',
  mobile_experience: 'Mobile Experience',
};

const PRIORITIES = [
  { key: 'critical', label: 'Critical' },
  { key: 'high', label: 'High' },
  { key: 'medium', label: 'Medium' },
  { key: 'low', label: 'Low' },
];

function ScoreBar({ label, value }) {
  const score = Number(value);
  const valid = Number.isFinite(score) && score >= 0 && score <= 100;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </span>
        <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
          {valid ? `${score.toFixed(1)}/100` : 'Unavailable'}
        </span>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
        role="progressbar"
        aria-label={`${label} score`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={valid ? score : 0}
      >
        <div
          className="h-full rounded-full bg-primary-600 transition-all duration-500"
          style={{ width: valid ? `${score}%` : '0%' }}
        />
      </div>
    </div>
  );
}

function PriorityBreakdown({ recommendations }) {
  const counts = PRIORITIES.map((priority) => ({
    ...priority,
    count: recommendations.filter(
      (item) => String(item.priority || '').toLowerCase() === priority.key,
    ).length,
  }));
  const total = recommendations.length;

  if (total === 0) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-xl bg-slate-50 px-5 text-center dark:bg-slate-800/50">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No recommendations are available for this analysis yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {counts.map((item) => {
        const percentage = (item.count / total) * 100;

        return (
          <div key={item.key}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-sm text-slate-600 dark:text-slate-300">
                {item.label}
              </span>
              <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                {item.count}
                <span className="ml-1 font-normal text-slate-500">
                  ({percentage.toFixed(0)}%)
                </span>
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-primary-600"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Distribution is calculated from the recommendations returned by WebIntel.
        Items with other or missing priority labels are excluded from these four groups.
      </p>
    </div>
  );
}


const CHART_COLORS = ['#2563eb', '#0d9488', '#d97706', '#7c3aed'];

function ChartEmptyState({ message }) {
  return (
    <div className="flex min-h-56 items-center justify-center rounded-xl bg-slate-50 px-5 text-center dark:bg-slate-800/50">
      <p className="max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
        {message}
      </p>
    </div>
  );
}

function AssessmentTrendChart({ data }) {
  const points = Array.isArray(data)
    ? data.filter(
        (item) =>
          item &&
          typeof item.date === 'string' &&
          Number.isFinite(Number(item.score)),
      )
    : [];

  return (
    <Card>
      <CardHeader
        title="Assessment trend"
        subtitle="Historical overall readiness for this website"
      />
      {points.length > 0 ? (
        <div className="h-72 w-full" role="img" aria-label="Line chart of historical assessment scores">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 12, right: 12, left: -14, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return Number.isNaN(date.getTime())
                    ? value
                    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                }}
                minTickGap={24}
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip
                labelFormatter={(value) => {
                  const date = new Date(value);
                  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
                }}
                formatter={(value) => [`${Number(value).toFixed(1)}/100`, 'Readiness']}
              />
              <Line
                type="monotone"
                dataKey="score"
                name="Readiness"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <ChartEmptyState message="No historical assessments are available for this website yet. Run another assessment to start building a trend." />
      )}
    </Card>
  );
}

function CategoryScoreChart({ data }) {
  const points = Array.isArray(data)
    ? data.filter(
        (item) =>
          item &&
          typeof item.category === 'string' &&
          Number.isFinite(Number(item.score)) &&
          Number(item.score) >= 0 &&
          Number(item.score) <= 100,
      )
    : [];

  return (
    <Card>
      <CardHeader
        title="Category performance"
        subtitle="Saved category scores, on a scale of 0?100"
      />
      {points.length > 0 ? (
        <div className="h-72 w-full" role="img" aria-label="Bar chart comparing website category scores">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={points} margin={{ top: 12, right: 12, left: -14, bottom: 36 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="category"
                interval={0}
                angle={-25}
                textAnchor="end"
                height={70}
                tick={{ fontSize: 10 }}
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}/100`, 'Score']} />
              <Bar dataKey="score" name="Score" fill="#2563eb" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <ChartEmptyState message="Category chart data is not available for this assessment." />
      )}
    </Card>
  );
}

function RecommendationPriorityChart({ data }) {
  const points = Array.isArray(data)
    ? data.filter(
        (item) =>
          item &&
          typeof item.name === 'string' &&
          Number.isFinite(Number(item.value)) &&
          Number(item.value) > 0,
      )
    : [];

  return (
    <div className="mb-6">
      {points.length > 0 ? (
        <div className="h-56 w-full" role="img" aria-label="Pie chart of saved recommendation priorities">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={points}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="46%"
                outerRadius={76}
                paddingAngle={2}
              >
                {points.map((item, index) => (
                  <Cell
                    key={`${item.name}-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, 'Recommendations']} />
              <Legend verticalAlign="bottom" height={32} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <ChartEmptyState message="No saved recommendation-priority counts are available for this assessment." />
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const { id } = useParams();
  const [dashboard, setDashboard] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [dashboardError, setDashboardError] = useState('');
  const [recommendationError, setRecommendationError] = useState('');
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setDashboardLoading(true);
      setDashboardError('');

      try {
        const { data } = await getDashboard(id);
        if (active) setDashboard(data);
      } catch (err) {
        if (!active) return;
        const detail = err.response?.data?.detail;
        setDashboard(null);
        setDashboardError(
          typeof detail === 'string'
            ? detail
            : 'Unable to load analytics for this assessment.',
        );
      } finally {
        if (active) setDashboardLoading(false);
      }
    }

    async function loadRecommendations() {
      setRecommendationsLoading(true);
      setRecommendationError('');

      try {
        const { data } = await getSavedRecommendations(id);
        if (active) setRecommendations(data.recommendations || []);
      } catch (err) {
        if (!active) return;
        const detail = err.response?.data?.detail;
        setRecommendations([]);
        setRecommendationError(
          typeof detail === 'string'
            ? detail
            : 'Unable to load recommendation priorities.',
        );
      } finally {
        if (active) setRecommendationsLoading(false);
      }
    }

    loadDashboard();
    loadRecommendations();

    return () => {
      active = false;
    };
  }, [id, retryKey]);

  const categories = Object.entries(dashboard?.category_scores || {})
    .filter(([key]) => CATEGORY_LABELS[key])
    .map(([key, value]) => ({
      key,
      label: CATEGORY_LABELS[key],
      value,
    }));

  const validCategories = categories.filter(
    (item) =>
      typeof item.value === 'number' &&
      Number.isFinite(item.value) &&
      item.value >= 0 &&
      item.value <= 100,
  );

  const score = Number(dashboard?.overall_score);
  const hasScore = Number.isFinite(score) && score >= 0 && score <= 100;
  const confidence = Number(dashboard?.confidence);
  const hasConfidence =
    Number.isFinite(confidence) && confidence >= 0 && confidence <= 1;

  return (
    <PageWrapper
      title="Analytics"
      subtitle="Evidence-based insights from this website assessment"
    >
      <div className="mb-6 flex flex-wrap gap-3">
        <Link to={`/results/${id}`}>
          <Button variant="outline">Back to results</Button>
        </Link>
        <Link to={`/recommendations/${id}`}>
          <Button>View recommendations</Button>
        </Link>
      </div>

      {dashboardLoading && (
        <Card className="mb-6">
          <CardHeader title="Loading assessment analytics" />
          <div className="space-y-3">
            <div className="skeleton h-5 w-1/3" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-2/3" />
          </div>
        </Card>
      )}

      {!dashboardLoading && dashboardError && (
        <Card className="mb-6">
          <CardHeader title="Score analytics unavailable" />
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {dashboardError}
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Confirm that the assessment is completed and has a saved readiness score.
          </p>
          <div className="mt-4">
            <Button onClick={() => setRetryKey((key) => key + 1)}>
              Try again
            </Button>
          </div>
        </Card>
      )}

      {!dashboardLoading && dashboard && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Card>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Overall readiness
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">
                  {hasScore ? score.toFixed(1) : '—'}
                </span>
                {hasScore && (
                  <span className="text-sm text-slate-500">/ 100</span>
                )}
              </div>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Grade {dashboard.grade || 'Unavailable'}
              </p>
            </Card>

            <Card>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Measured categories
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {validCategories.length}
                <span className="ml-1 text-base font-normal text-slate-500">
                  / {Object.keys(CATEGORY_LABELS).length}
                </span>
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Categories with valid saved scores
              </p>
            </Card>

            <Card>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Measurement coverage
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {hasConfidence ? `${Math.round(confidence * 100)}%` : '—'}
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Reported by the scoring engine
              </p>
            </Card>
          </div>

          <div className="mb-6 grid gap-6 xl:grid-cols-2">
            <AssessmentTrendChart data={dashboard.charts?.line} />
            <CategoryScoreChart data={dashboard.charts?.bar} />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader
                title="Category score breakdown"
                subtitle="Saved scores on a scale of 0–100"
              />
              {validCategories.length > 0 ? (
                <div className="space-y-5">
                  {categories.map((item) => (
                    <ScoreBar
                      key={item.key}
                      label={item.label}
                      value={item.value}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No valid category scores were returned for this assessment.
                </p>
              )}
            </Card>

            <Card>
              <CardHeader
                title="Recommendation priorities"
                subtitle={
                  recommendationsLoading
                    ? 'Loading saved recommendation data…'
                    : `${recommendations.length} recommendation(s) returned`
                }
              />
              {recommendationError ? (
                <div>
                  <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                    {recommendationError}
                  </p>
                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() => setRetryKey((key) => key + 1)}
                  >
                    Retry analytics
                  </Button>
                </div>
              ) : recommendationsLoading ? (
                <div className="space-y-4">
                  <div className="skeleton h-4 w-full" />
                  <div className="skeleton h-4 w-4/5" />
                  <div className="skeleton h-4 w-3/5" />
                </div>
              ) : (
                <>
                  <RecommendationPriorityChart data={dashboard.charts?.pie} />
                  <PriorityBreakdown recommendations={recommendations} />
                </>
              )}
            </Card>

            <Card>
              <CardHeader
                title="Assessment interpretation"
                subtitle="What these measurements mean"
              />
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                {dashboard.explanation ||
                  'The scoring engine did not return an additional explanation for this assessment.'}
              </p>
              <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">
                WebIntel scores are heuristic measurements based on available
                checks and crawl coverage. They are not search-engine rankings
                or guaranteed business outcomes.
              </p>
            </Card>

            <Card>
              <CardHeader
                title="Competitor comparison"
                subtitle="Not available in the current implementation"
              />
              <div className="rounded-xl bg-slate-50 p-5 dark:bg-slate-800/50">
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                  This assessment contains data for one website. A meaningful
                  comparison requires separate competitor assessments and a
                  defined comparison method. No competitor scores are fabricated.
                </p>
              </div>
            </Card>
          </div>
        </>
      )}
    </PageWrapper>
  );
}

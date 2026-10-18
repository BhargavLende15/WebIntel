import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card, { CardHeader } from '../components/ui/Card';
import { PageWrapper } from '../layouts/MainLayout';
import { SkeletonBlock } from '../components/ui/Skeleton';
import { getDashboard, getSavedRecommendations } from '../services/api';
import { NOT_AVAILABLE, clampScore, humanizeKey, isNumericValue } from '../utils/format';
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
  // Number(null) and Number('') both evaluate to 0, which would render an
  // unmeasured category as "0.0/100". Guard on the raw value first.
  const valid = isNumericValue(value) && clampScore(value) >= 0 && Number(value) <= 100;
  const score = valid ? clampScore(value) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="min-w-0 text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </span>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
          {valid ? `${score.toFixed(1)}/100` : NOT_AVAILABLE}
        </span>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
        role="progressbar"
        aria-label={`${label} score`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={valid ? score : undefined}
        aria-valuetext={valid ? `${score.toFixed(1)} out of 100` : NOT_AVAILABLE}
      >
        {valid && (
          <div
            className="h-full rounded-full bg-primary-600 transition-all duration-500"
            style={{ width: `${score}%` }}
          />
        )}
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
        Distribution is calculated from the recommendations returned by WebIntel. Items with
        other or missing priority labels are excluded from these four groups.
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

function ChartFrame({ height = 'h-72', label, children }) {
  return (
    <div
      className={`${height} w-full min-w-0 rounded-xl bg-slate-50/60 p-2 dark:bg-slate-800/30`}
      role="img"
      aria-label={label}
    >
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

const AXIS_TICK = { fontSize: 11, fill: 'currentColor' };

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
    <Card className="flex h-full flex-col">
      <CardHeader
        title="Assessment trend"
        subtitle="Historical overall readiness for this website"
      />
      {points.length > 0 ? (
        <ChartFrame label="Line chart of historical assessment scores">
          <LineChart data={points} margin={{ top: 12, right: 16, left: -8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.25} />
            <XAxis
              dataKey="date"
              tick={AXIS_TICK}
              tickFormatter={(value) => {
                const date = new Date(value);
                return Number.isNaN(date.getTime())
                  ? value
                  : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              }}
              minTickGap={24}
              tickLine={false}
            />
            <YAxis domain={[0, 100]} tick={AXIS_TICK} width={40} tickLine={false} axisLine={false} />
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
              stroke={CHART_COLORS[0]}
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartFrame>
      ) : (
        <ChartEmptyState message="No historical assessments are available for this website yet. Run another assessment to start building a trend." />
      )}
    </Card>
  );
}

function CategoryScoreChart({ data }) {
  const points = Array.isArray(data)
    ? data
        .filter(
          (item) =>
            item &&
            typeof item.category === 'string' &&
            Number.isFinite(Number(item.score)) &&
            Number(item.score) >= 0 &&
            Number(item.score) <= 100,
        )
        // The API returns raw keys such as "ai_readiness". Show the same
        // human-readable labels used everywhere else on the page.
        .map((item) => ({
          ...item,
          label: CATEGORY_LABELS[item.category] || humanizeKey(item.category),
          score: Number(item.score),
        }))
    : [];

  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        title="Category performance"
        subtitle="Saved category scores, on a scale of 0 to 100"
      />
      {points.length > 0 ? (
        <ChartFrame label="Bar chart comparing website category scores">
          <BarChart data={points} margin={{ top: 12, right: 16, left: -8, bottom: 52 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.25} />
            <XAxis
              dataKey="label"
              interval={0}
              angle={-20}
              textAnchor="end"
              height={64}
              tick={{ fontSize: 10, fill: 'currentColor' }}
              tickLine={false}
            />
            <YAxis domain={[0, 100]} tick={AXIS_TICK} width={40} tickLine={false} axisLine={false} />
            <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}/100`, 'Score']} />
            <Bar
              dataKey="score"
              name="Score"
              fill={CHART_COLORS[0]}
              radius={[5, 5, 0, 0]}
              maxBarSize={48}
              isAnimationActive={false}
            />
          </BarChart>
        </ChartFrame>
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

  if (points.length === 0) {
    return (
      <ChartEmptyState message="No saved recommendation-priority counts are available for this assessment." />
    );
  }

  return (
    <div className="mb-6">
      <ChartFrame height="h-64" label="Pie chart of saved recommendation priorities">
        <PieChart>
          <Pie
            data={points}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="46%"
            outerRadius={74}
            paddingAngle={2}
            stroke="none"
            isAnimationActive={false}
          >
            {points.map((item, index) => (
              <Cell
                key={`${item.name}-${index}`}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [value, 'Recommendations']} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, paddingTop: 4 }}
          />
        </PieChart>
      </ChartFrame>
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
    (item) => isNumericValue(item.value) && clampScore(item.value) >= 0 && Number(item.value) <= 100,
  );

  // Guard the raw value first: Number(null) and Number('') are both 0.
  const hasScore =
    isNumericValue(dashboard?.overall_score) &&
    clampScore(dashboard.overall_score) >= 0 &&
    Number(dashboard.overall_score) <= 100;
  const score = hasScore ? clampScore(dashboard.overall_score) : 0;

  const hasConfidence =
    isNumericValue(dashboard?.confidence) &&
    Number(dashboard.confidence) >= 0 &&
    Number(dashboard.confidence) <= 1;
  const confidence = hasConfidence ? Number(dashboard.confidence) : 0;

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
          <div role="status" aria-live="polite">
            <SkeletonBlock lines={3} />
          </div>
        </Card>
      )}

      {!dashboardLoading && dashboardError && (
        <Card className="mb-6 border-rose-200 dark:border-rose-800">
          <CardHeader title="Score analytics unavailable" />
          <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
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
              <div className="mt-2 flex flex-wrap items-baseline gap-2">
                <span className="text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {hasScore ? score.toFixed(1) : NOT_AVAILABLE}
                </span>
                {hasScore && <span className="text-sm text-slate-500">/ 100</span>}
              </div>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Grade {dashboard.grade || NOT_AVAILABLE}
              </p>
            </Card>

            <Card>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Measured categories
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
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
              <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
                {hasConfidence ? `${Math.round(confidence * 100)}%` : NOT_AVAILABLE}
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
            <Card className="flex h-full flex-col">
              <CardHeader
                title="Category score breakdown"
                subtitle="Saved scores on a scale of 0 to 100"
              />
              {validCategories.length > 0 ? (
                <div className="flex flex-1 flex-col justify-between gap-5">
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

            <Card className="flex h-full flex-col">
              <CardHeader
                title="Recommendation priorities"
                subtitle={
                  recommendationsLoading
                    ? 'Loading saved recommendation data'
                    : `${recommendations.length} recommendation${
                        recommendations.length === 1 ? '' : 's'
                      } returned`
                }
              />
              {recommendationError ? (
                <div>
                  <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
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
                <div role="status" aria-live="polite">
                  <SkeletonBlock lines={4} />
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

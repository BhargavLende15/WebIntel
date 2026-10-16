import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card, { CardHeader } from '../components/ui/Card';
import { PageWrapper } from '../layouts/MainLayout';
import { getHistory } from '../services/api';

function formatDate(value) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleString();
}

function formatScore(value) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toFixed(1)
    : '—';
}

function ScoreTrend({ entries }) {
  const points = entries
    .filter(
      (entry) =>
        typeof entry.overall_score === 'number' &&
        Number.isFinite(entry.overall_score),
    )
    .slice()
    .reverse();

  if (points.length < 2) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-xl bg-slate-50 px-6 text-center dark:bg-slate-800/50">
        <p className="max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
          At least two assessments with saved scores are needed to show a trend.
          Run another assessment of this website to compare results.
        </p>
      </div>
    );
  }

  const width = 720;
  const height = 220;
  const padX = 28;
  const padY = 24;
  const plotWidth = width - padX * 2;
  const plotHeight = height - padY * 2;

  const coordinates = points.map((entry, index) => ({
    x: padX + (index / (points.length - 1)) * plotWidth,
    y: padY + (1 - Math.max(0, Math.min(100, entry.overall_score)) / 100) * plotHeight,
    score: entry.overall_score,
    date: entry.created_at,
  }));

  const polyline = coordinates.map(({ x, y }) => `${x},${y}`).join(' ');

  return (
    <div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`Assessment score trend across ${points.length} assessments`}
          className="h-auto min-w-[480px] w-full"
        >
          {[0, 25, 50, 75, 100].map((value) => {
            const y = padY + (1 - value / 100) * plotHeight;
            return (
              <g key={value}>
                <line
                  x1={padX}
                  y1={y}
                  x2={width - padX}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.12"
                  strokeDasharray="4 5"
                />
                <text
                  x={padX - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="currentColor"
                  opacity="0.65"
                >
                  {value}
                </text>
              </g>
            );
          })}

          <polyline
            points={polyline}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            className="text-primary-600"
          />

          {coordinates.map((point, index) => (
            <g key={`${point.date}-${index}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r="4"
                fill="currentColor"
                className="text-primary-600"
              />
              <title>
                {`${formatDate(point.date)}: ${formatScore(point.score)}/100`}
              </title>
            </g>
          ))}
        </svg>
      </div>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        Scores are displayed in chronological order. Only saved assessment scores are plotted.
      </p>
    </div>
  );
}

export default function HistoryPage() {
  const { websiteId } = useParams();
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await getHistory(websiteId);
      setHistory(data);
    } catch (err) {
      setHistory(null);
      const detail = err.response?.data?.detail;
      setError(
        typeof detail === 'string'
          ? detail
          : 'Unable to load assessment history. Check your connection and try again.',
      );
    } finally {
      setLoading(false);
    }
  }, [websiteId]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const { data } = await getHistory(websiteId);
        if (active) setHistory(data);
      } catch (err) {
        if (!active) return;
        setHistory(null);
        const detail = err.response?.data?.detail;
        setError(
          typeof detail === 'string'
            ? detail
            : 'Unable to load assessment history. Check your connection and try again.',
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [websiteId, retryKey]);

  return (
    <PageWrapper
      title="Assessment History"
      subtitle={history?.website_url || 'Review saved website assessments'}
    >
      <div className="mb-6 flex flex-wrap gap-3">
        <Link to="/analyze">
          <Button>New assessment</Button>
        </Link>
        <Button variant="outline" onClick={loadHistory} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh history'}
        </Button>
      </div>

      {loading && (
        <Card>
          <CardHeader title="Loading assessment history" />
          <div className="space-y-3">
            <div className="skeleton h-5 w-1/3" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-2/3" />
          </div>
        </Card>
      )}

      {!loading && error && (
        <Card>
          <CardHeader title="History unavailable" />
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
          <div className="mt-4">
            <Button onClick={() => setRetryKey((value) => value + 1)}>
              Try again
            </Button>
          </div>
        </Card>
      )}

      {!loading && !error && history && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <Card>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Total assessments
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {history.total_assessments}
              </p>
            </Card>
            <Card>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Assessments with saved scores
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {history.entries.filter(
                  (entry) =>
                    typeof entry.overall_score === 'number' &&
                    Number.isFinite(entry.overall_score),
                ).length}
              </p>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader
              title="Score trend"
              subtitle="Historical readiness scores for this website"
            />
            <ScoreTrend entries={history.entries || []} />
          </Card>

          <Card>
            <CardHeader
              title="Past assessments"
              subtitle={history.website_url}
            />

            {!history.entries?.length ? (
              <div className="py-10 text-center">
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  No assessments yet
                </p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Start an assessment to begin building this website’s history.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      <th className="px-3 py-3 font-semibold">Assessment date</th>
                      <th className="px-3 py-3 font-semibold">Score</th>
                      <th className="px-3 py-3 font-semibold">Grade</th>
                      <th className="px-3 py-3 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {history.entries.map((entry) => (
                      <tr key={entry.analysis_id}>
                        <td className="px-3 py-4 text-slate-600 dark:text-slate-300">
                          {formatDate(entry.created_at)}
                        </td>
                        <td className="px-3 py-4 font-semibold text-slate-900 dark:text-white">
                          {formatScore(entry.overall_score)}
                          {entry.overall_score != null && (
                            <span className="font-normal text-slate-500"> / 100</span>
                          )}
                        </td>
                        <td className="px-3 py-4">
                          {entry.grade ? (
                            <span className="rounded-lg bg-primary-50 px-2.5 py-1 font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                              {entry.grade}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-4 text-right">
                          <Link
                            to={`/results/${entry.analysis_id}`}
                            className="font-medium text-primary-600 hover:underline dark:text-primary-400"
                          >
                            View results
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </PageWrapper>
  );
}

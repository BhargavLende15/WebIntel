import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card, { CardHeader } from '../components/ui/Card';
import { PageWrapper } from '../layouts/MainLayout';
import { getHistory } from '../services/api';
import {
  ELLIPSIS,
  NOT_AVAILABLE,
  formatDateTime,
  formatScore,
  isNumericValue,
} from '../utils/format';

function formatDate(value) {
  return formatDateTime(value, 'Date unavailable');
}

function formatShortDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getSavedScoreCount(entries) {
  if (!Array.isArray(entries)) return 0;
  return entries.filter((entry) => isNumericValue(entry?.overall_score)).length;
}

const TREND_HEIGHT = 220;

/**
 * Measures the container so the chart is drawn 1:1 with CSS pixels.
 *
 * A fixed viewBox with `w-full` would scale the axis labels down to roughly
 * 5px on a phone, and a `min-w` would force a horizontal scroller. Measuring
 * keeps every label at its intended size at any viewport width.
 */
function useContainerWidth() {
  const [width, setWidth] = useState(0);
  const [element, setElement] = useState(null);

  useEffect(() => {
    if (!element) return undefined;

    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect?.width ?? 0;
      setWidth(Math.round(next));
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return [setElement, width];
}

function ScoreTrend({ entries }) {
  const points = entries
    .filter((entry) => isNumericValue(entry?.overall_score))
    .slice()
    .reverse();

  const [ref, measuredWidth] = useContainerWidth();

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

  const width = measuredWidth || 640;
  const height = TREND_HEIGHT;
  // Give the labels room without letting them eat narrow viewports.
  const padX = width < 420 ? 34 : 40;
  const padY = 24;
  const plotWidth = Math.max(1, width - padX * 2);
  const plotHeight = height - padY * 2;
  const fontSize = width < 420 ? 10 : 11;

  const coordinates = points.map((entry, index) => ({
    x: padX + (index / (points.length - 1)) * plotWidth,
    y: padY + (1 - Math.max(0, Math.min(100, entry.overall_score)) / 100) * plotHeight,
    score: entry.overall_score,
    date: entry.created_at,
  }));

  const polyline = coordinates.map(({ x, y }) => `${x},${y}`).join(' ');

  // Label only a few points when space is tight, so they never collide.
  const labelEvery = width < 420 ? Math.max(1, Math.ceil(points.length / 4)) : 1;
  const firstDate = formatDate(points[0].created_at);
  const lastDate = formatDate(points[points.length - 1].created_at);

  return (
    <div>
      <div ref={ref} className="w-full min-w-0 text-slate-500 dark:text-slate-400">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          role="img"
          aria-label={`Assessment score trend across ${points.length} assessments, from ${firstDate} to ${lastDate}`}
          className="block h-auto w-full"
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
                  strokeOpacity="0.16"
                  strokeDasharray="4 5"
                />
                <text
                  x={padX - 8}
                  y={y + fontSize / 3}
                  textAnchor="end"
                  fontSize={fontSize}
                  fill="currentColor"
                  opacity="0.7"
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
              {(index % labelEvery === 0 || index === coordinates.length - 1) && (
                <text
                  x={point.x}
                  y={height - 6}
                  textAnchor={index === 0 ? 'start' : index === coordinates.length - 1 ? 'end' : 'middle'}
                  fontSize={fontSize}
                  fill="currentColor"
                  opacity="0.7"
                >
                  {formatShortDate(point.date)}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        Scores are shown in chronological order. Only assessments with a saved score are plotted.
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
          typeof detail === 'string' && detail.trim() !== ''
            ? detail
            : err.response
              ? 'Unable to load assessment history. Try again in a moment.'
              : 'Cannot reach the WebIntel API. Check that the backend is running, then try again.',
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

  const entries = Array.isArray(history?.entries) ? history.entries : [];

  return (
    <PageWrapper
      title="Assessment History"
      subtitle={history?.website_url || 'Review saved website assessments'}
    >
      <div className="mb-6 flex flex-wrap gap-3">
        <Link to="/analyze">
          <Button>New assessment</Button>
        </Link>
        <Button variant="outline" onClick={() => setRetryKey((value) => value + 1)} loading={loading}>
          Refresh history
        </Button>
      </div>

      {loading && (
        <Card>
          <CardHeader title="Loading assessment history" />
          <div className="space-y-3" role="status" aria-live="polite">
            <div className="skeleton h-5 w-1/3" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-2/3" />
          </div>
        </Card>
      )}

      {!loading && error && (
        <Card className="border-rose-200 dark:border-rose-800">
          <CardHeader title="History unavailable" />
          <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
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
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Total assessments
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
                {isNumericValue(history.total_assessments)
                  ? Number(history.total_assessments)
                  : entries.length}
              </p>
            </Card>
            <Card>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Assessments with saved scores
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
                {getSavedScoreCount(entries)}
              </p>
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Score trend"
              subtitle="Historical readiness scores for this website"
            />
            <ScoreTrend entries={entries} />
          </Card>

          <Card>
            <CardHeader
              title="Past assessments"
              subtitle={history.website_url || NOT_AVAILABLE}
            />

            {entries.length === 0 ? (
              <div className="py-10 text-center">
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  No assessments yet
                </p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Start an assessment to begin building this website{ELLIPSIS} history.
                </p>
                <div className="mt-5 flex justify-center">
                  <Link to="/analyze">
                    <Button>Analyze this website</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="-mx-1 overflow-x-auto px-1">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <caption className="sr-only">
                    Saved assessments for {history.website_url || 'this website'}, newest first
                  </caption>
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      <th scope="col" className="px-3 py-3 font-semibold">Assessment date</th>
                      <th scope="col" className="px-3 py-3 font-semibold">Score</th>
                      <th scope="col" className="px-3 py-3 font-semibold">Grade</th>
                      <th scope="col" className="px-3 py-3 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {entries.map((entry) => (
                      <tr key={entry.analysis_id}>
                        <td className="px-3 py-4 text-slate-600 dark:text-slate-300">
                          {formatDate(entry.created_at)}
                        </td>
                        <td className="px-3 py-4 font-semibold tabular-nums text-slate-900 dark:text-white">
                          {formatScore(entry.overall_score, { suffix: true })}
                        </td>
                        <td className="px-3 py-4">
                          {entry.grade ? (
                            <span className="rounded-lg bg-primary-50 px-2.5 py-1 font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                              {entry.grade}
                            </span>
                          ) : (
                            <span className="text-slate-400">{NOT_AVAILABLE}</span>
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
        </div>
      )}
    </PageWrapper>
  );
}

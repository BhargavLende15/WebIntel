import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card, { CardHeader } from '../components/ui/Card';
import { SkeletonCard } from '../components/ui/Skeleton';
import { PageWrapper } from '../layouts/MainLayout';
import { calculateScore, getAnalysis, getRecommendations } from '../services/api';
import {
  BULLET,
  ELLIPSIS,
  EM_DASH,
  NOT_AVAILABLE,
  clampScore,
  formatDateTime,
  formatDisplayValue,
  humanizeKey,
  isNumericValue,
  isValidDate,
} from '../utils/format';
import {
  ANALYSIS_STATUS,
  getAnalysisStatus,
  getCountLabel,
  isInProgressStatus,
  isTerminalStatus,
} from '../utils/status';

const POLL_INTERVAL_MS = 3000;
// Safety net so a backend status that never reaches a terminal state cannot
// keep the page polling forever.
const MAX_POLL_ATTEMPTS = 100;

const CATEGORY_FIELDS = [
  ['SEO', 'seo_data'],
  ['Content', 'content_data'],
  ['Accessibility', 'accessibility_data'],
  ['Security', 'security_data'],
  ['Performance', 'performance_data'],
  ['Mobile', 'mobile_data'],
  ['AI Search Readiness', 'ai_readiness_data'],
];

const SCORE_CATEGORIES = [
  ['Performance', 'performance'],
  ['SEO', 'seo'],
  ['Accessibility', 'accessibility'],
  ['Security', 'security'],
  ['AI Readiness', 'ai_readiness'],
  ['Content Quality', 'content_quality'],
  ['Mobile Experience', 'mobile_experience'],
];

function getApiErrorMessage(error, fallback) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim() !== '') return detail;
  if (!error?.response) {
    return 'Cannot reach the WebIntel API. Check that the backend is running, then try again.';
  }
  return fallback;
}

function ValueRow({ label, value }) {
  const isBool = typeof value === 'boolean';

  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="min-w-0 shrink-0 text-slate-500 dark:text-slate-400">{label}</span>
      <span
        className={[
          'min-w-0 break-words text-right font-medium',
          isBool
            ? value
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-500 dark:text-red-400'
            : 'break-all text-slate-700 dark:text-slate-200',
        ].join(' ')}
      >
        {formatDisplayValue(value)}
      </span>
    </div>
  );
}

function NestedList({ title, items }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  const visible = items.slice(0, 10);
  const hidden = items.length - visible.length;

  return (
    <div className="mt-3 border-t border-slate-200 pt-2 dark:border-slate-700">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {title} ({items.length})
      </p>
      <ul className="space-y-1">
        {visible.map((item, index) => (
          <li
            key={`${title}-${index}`}
            className="break-words text-xs text-slate-600 dark:text-slate-300"
          >
            <span aria-hidden="true" className="mr-1.5 text-slate-400">
              {BULLET}
            </span>
            {formatDisplayValue(item)}
          </li>
        ))}
        {hidden > 0 && (
          <li className="pl-4 text-xs italic text-slate-400">
            {ELLIPSIS}and {hidden} more
          </li>
        )}
      </ul>
    </div>
  );
}

function CategoryCard({ title, data }) {
  const entries = Object.entries(data).filter(
    ([key, value]) => key !== 'pages' && (typeof value !== 'object' || value === null),
  );
  const lists = Object.entries(data).filter(
    ([key, value]) => Array.isArray(value) && value.length > 0 && key !== 'pages',
  );
  const pageCount = isNumericValue(data.pages_analyzed) ? Number(data.pages_analyzed) : null;
  const subtitle =
    getCountLabel(pageCount, 'page') || 'No page count reported for this category';

  return (
    <Card className="flex h-full flex-col">
      <CardHeader title={title} subtitle={subtitle} />
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {entries.map(([key, value]) => (
          <ValueRow key={key} label={humanizeKey(key)} value={value} />
        ))}
      </div>
      {lists.map(([key, value]) => (
        <NestedList key={key} title={humanizeKey(key)} items={value} />
      ))}
      {entries.length === 0 && lists.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No individual measurements were reported for this category.
        </p>
      )}
    </Card>
  );
}

function StatusBadge({ status }) {
  const meta = getAnalysisStatus(status);
  const inProgress = isInProgressStatus(status);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${meta.badge}`}
    >
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${meta.dot} ${inProgress ? 'animate-pulse' : ''}`}
        aria-hidden="true"
      />
      {meta.label}
    </span>
  );
}

function MetaCard({ label, value, hint, mono = false }) {
  return (
    <Card className="flex h-full flex-col">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p
        className={[
          'mt-2 text-sm text-slate-700 dark:text-slate-200',
          mono ? 'font-mono break-all' : 'break-words',
        ].join(' ')}
      >
        {value}
      </p>
      {hint && (
        <p className="mt-auto pt-2 text-xs text-slate-400 dark:text-slate-500">{hint}</p>
      )}
    </Card>
  );
}

function CategoryScoreTile({ label, value }) {
  const valid = isNumericValue(value);
  const safeValue = clampScore(value);

  return (
    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 text-sm text-slate-600 dark:text-slate-300">{label}</span>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
          {valid ? `${Number(value).toFixed(1)}/100` : NOT_AVAILABLE}
        </span>
      </div>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
        role="progressbar"
        aria-label={`${label} score`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={valid ? safeValue : undefined}
        aria-valuetext={valid ? `${Number(value).toFixed(1)} out of 100` : NOT_AVAILABLE}
      >
        {valid && (
          <div
            className="h-full rounded-full bg-primary-500"
            style={{ width: `${safeValue}%` }}
          />
        )}
      </div>
    </div>
  );
}

function ScorePanel({ score, loading, error, onRetry }) {
  if (loading) {
    return (
      <Card>
        <CardHeader title="Web Readiness Score" subtitle="Loading the saved assessment score" />
        <div className="skeleton h-8 w-24" aria-hidden="true" />
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400" role="status">
          Calculating your readiness score{ELLIPSIS}
        </p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-rose-200 dark:border-rose-800">
        <CardHeader
          title="Readiness score unavailable"
          subtitle="The assessment finished, but its score could not be loaded"
        />
        <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
          {error}
        </p>
        <div className="mt-4">
          <Button variant="outline" onClick={onRetry}>
            Retry score
          </Button>
        </div>
      </Card>
    );
  }

  if (!score) {
    return (
      <Card>
        <CardHeader title="Readiness score unavailable" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          This assessment completed but the API returned no saved score. No score has been
          estimated in its place.
        </p>
      </Card>
    );
  }

  const overall = isNumericValue(score.overall_score) ? Number(score.overall_score) : null;
  const coverage =
    typeof score.confidence === 'number' && Number.isFinite(score.confidence)
      ? Math.round(score.confidence * 100)
      : null;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <CardHeader
            title="Web Readiness Score"
            subtitle="Assessment based on the checks WebIntel completed"
          />
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-4xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-5xl dark:text-white">
              {overall === null ? NOT_AVAILABLE : overall.toFixed(1)}
            </span>
            {overall !== null && (
              <span className="text-sm text-slate-500 dark:text-slate-400">out of 100</span>
            )}
          </div>
        </div>
        {score.grade && (
          <span className="shrink-0 rounded-xl bg-primary-50 px-4 py-2 text-lg font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            Grade {score.grade}
          </span>
        )}
      </div>

      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
        {coverage === null
          ? 'Measurement coverage was not reported for this assessment.'
          : `Measurement coverage: ${coverage}%`}
      </p>

      {score.explanation && (
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {score.explanation}
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SCORE_CATEGORIES.map(([label, key]) => (
          <CategoryScoreTile
            key={key}
            label={label}
            value={score.category_scores?.[key]}
          />
        ))}
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">
        This is WebIntel's heuristic assessment, not a Google ranking score or a guarantee of
        search visibility. Results depend on crawl coverage and the checks available.
      </p>
    </Card>
  );
}

function FailedPanel({ message }) {
  return (
    <Card className="border-rose-200 dark:border-rose-800">
      <CardHeader
        title="Analysis failed"
        subtitle="The crawler could not complete this analysis"
      />
      <div className="rounded-lg bg-rose-50 p-3 text-sm leading-6 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
        {message || 'No error details were reported for this failed analysis.'}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link to="/analyze">
          <Button>Try another URL</Button>
        </Link>
        <Link to="/dashboard">
          <Button variant="outline">Back to dashboard</Button>
        </Link>
      </div>
    </Card>
  );
}

function InProgressPanel({ statusMeta, hasStarted }) {
  return (
    <Card>
      <CardHeader
        title={hasStarted ? 'Analysis in progress' : 'Analysis queued'}
        subtitle="This page updates automatically while the crawler works"
      />
      <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
        <span
          className="mt-0.5 h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600"
          aria-hidden="true"
        />
        <span>
          <span className="font-medium text-slate-900 dark:text-white">{statusMeta.label}</span>
          {' '}
          {EM_DASH}
          {' '}
          {hasStarted
            ? 'discovering pages, fetching HTML and running checks.'
            : 'waiting for the analysis worker to start.'}
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
        Findings appear here as soon as each check completes. You can safely leave this page and
        return from your dashboard or history.
      </p>
    </Card>
  );
}

function ResultsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [score, setScore] = useState(null);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreError, setScoreError] = useState('');
  const [scoreAttempt, setScoreAttempt] = useState(0);
  const timerRef = useRef(null);

  // Poll the analysis until it reaches a terminal state.
  useEffect(() => {
    let active = true;
    let attempts = 0;

    setLoading(true);
    setError('');

    const poll = () => {
      getAnalysis(id)
        .then(({ data }) => {
          if (!active) return;

          attempts += 1;
          setAnalysis(data ?? null);
          setLoading(false);
          setError('');

          if (isTerminalStatus(data?.status)) return;

          if (attempts >= MAX_POLL_ATTEMPTS) {
            setError(
              `This analysis is still running after several minutes. It may be stalled ${EM_DASH} open it again shortly or start a new assessment.`,
            );
            return;
          }

          timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
        })
        .catch((err) => {
          if (!active) return;
          setLoading(false);
          setError(getApiErrorMessage(err, 'Failed to load this analysis.'));
        });
    };

    poll();

    return () => {
      active = false;
      clearTimeout(timerRef.current);
    };
  }, [id, attempt]);

  const status = analysis?.status;
  const scoreReady = status === ANALYSIS_STATUS.COMPLETED;

  // Load (or regenerate) the saved score once the analysis has completed.
  useEffect(() => {
    if (!scoreReady) {
      setScore(null);
      setScoreError('');
      setScoreLoading(false);
      return undefined;
    }

    let active = true;

    setScoreLoading(true);
    setScoreError('');

    calculateScore(id)
      .then(async ({ data }) => {
        if (!active) return;
        setScore(data ?? null);
        await getRecommendations(id);
        if (active) {
          window.dispatchEvent(new Event('webintel:dashboard-refresh'));
        }
      })
      .catch((err) => {
        if (!active) return;
        setScoreError(
          getApiErrorMessage(
            err,
            'Unable to load the readiness score. Please refresh and try again.',
          ),
        );
      })
      .finally(() => {
        if (active) setScoreLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, scoreReady, scoreAttempt]);

  const retryAnalysis = useCallback(() => setAttempt((value) => value + 1), []);
  const retryScore = useCallback(() => setScoreAttempt((value) => value + 1), []);

  if (loading) {
    return (
      <PageWrapper title="Analysis Results" subtitle={`Loading analysis ${ELLIPSIS}`}>
        <div role="status" aria-live="polite">
          <ResultsSkeleton />
        </div>
      </PageWrapper>
    );
  }

  if (error && !analysis) {
    return (
      <PageWrapper title="Analysis Results" subtitle="Unable to load">
        <Card className="border-rose-200 dark:border-rose-800">
          <CardHeader title="Analysis unavailable" />
          <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
            {error}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={retryAnalysis}>Try again</Button>
            <Link to="/dashboard">
              <Button variant="outline">Back to dashboard</Button>
            </Link>
          </div>
        </Card>
      </PageWrapper>
    );
  }

  if (!analysis) {
    return (
      <PageWrapper title="Analysis Results" subtitle="Not found">
        <Card>
          <CardHeader title="Analysis not found" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            This analysis does not exist or belongs to another account.
          </p>
        </Card>
      </PageWrapper>
    );
  }

  const statusMeta = getAnalysisStatus(status);
  const inProgress = isInProgressStatus(status);
  const categories = CATEGORY_FIELDS.map(([title, field]) => [title, analysis[field]]).filter(
    ([, data]) => data && typeof data === 'object' && Object.keys(data).length > 0,
  );

  const createdLabel = formatDateTime(analysis.created_at, NOT_AVAILABLE);
  const hasCompletedAt = isValidDate(analysis.completed_at);
  const completedLabel = inProgress
    ? 'In progress'
    : formatDateTime(analysis.completed_at, NOT_AVAILABLE);

  const failureMessage =
    typeof analysis.error_message === 'string' && analysis.error_message.trim() !== ''
      ? analysis.error_message
      : null;

  return (
    <PageWrapper title="Analysis Results" subtitle={`Analysis ${id}`}>
      <div className="space-y-6">
        {error && (
          <Card className="border-amber-200 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-950/20">
            <div
              className="flex flex-wrap items-center justify-between gap-3"
              role="status"
              aria-live="polite"
            >
              <p className="min-w-0 text-sm text-amber-800 dark:text-amber-200">{error}</p>
              <Button size="sm" variant="outline" onClick={retryAnalysis}>
                Keep refreshing
              </Button>
            </div>
          </Card>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={status} />
          {!statusMeta.isKnown && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              The API reported an unrecognised status for this analysis.
            </span>
          )}
        </div>

        {inProgress && <InProgressPanel statusMeta={statusMeta} hasStarted={status === ANALYSIS_STATUS.RUNNING} />}

        {scoreReady && (
          <ScorePanel
            score={score}
            loading={scoreLoading}
            error={scoreError}
            onRetry={retryScore}
          />
        )}

        {status === ANALYSIS_STATUS.FAILED && <FailedPanel message={failureMessage} />}

        <section
          aria-label="Assessment summary"
          className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
        >
          <MetaCard label="Status" value={statusMeta.label} />
          <MetaCard label="Created" value={createdLabel} />
          <MetaCard
            label="Completed"
            value={completedLabel}
            hint={inProgress && !hasCompletedAt ? 'Available once the analysis finishes' : undefined}
          />
          <MetaCard label="Website ID" value={formatDisplayValue(analysis.website_id)} mono />
        </section>

        {categories.length > 0 && (
          <section aria-label="Category findings" className="space-y-5">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              Category findings
            </h2>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {categories.map(([title, data]) => (
                <CategoryCard key={title} title={title} data={data} />
              ))}
            </div>
          </section>
        )}
      </div>
    </PageWrapper>
  );
}

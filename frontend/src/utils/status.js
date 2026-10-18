/**
 * Centralized mapping between the backend analysis status enum and its
 * user-facing label and appearance.
 *
 * The backend contract (app/analysis/engine.py, app/api/v1/analyze.py,
 * app/schemas/analysis.py) only ever stores one of these four values:
 *
 *   queued    -> created, crawl not started
 *   running   -> crawler/analysis engine in progress
 *   completed -> finished, scores available
 *   failed    -> terminated with error_message
 *
 * `getAnalysisStatus` also accepts an unexpected or missing value so the UI
 * degrades to a readable "Unknown status" instead of printing the raw enum,
 * `undefined` or `null` at the user.
 */
export const ANALYSIS_STATUS = Object.freeze({
  QUEUED: 'queued',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
});

const STATUS_META = Object.freeze({
  [ANALYSIS_STATUS.QUEUED]: {
    label: 'Pending',
    badge:
      'border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
    dot: 'bg-amber-500',
    terminal: false,
  },
  [ANALYSIS_STATUS.RUNNING]: {
    label: 'Running',
    badge:
      'border border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300',
    dot: 'bg-blue-500',
    terminal: false,
  },
  [ANALYSIS_STATUS.COMPLETED]: {
    label: 'Completed',
    badge:
      'border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    terminal: true,
  },
  [ANALYSIS_STATUS.FAILED]: {
    label: 'Failed',
    badge:
      'border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300',
    dot: 'bg-rose-500',
    terminal: true,
  },
});

const UNKNOWN_META = Object.freeze({
  label: 'Unknown status',
  badge:
    'border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300',
  dot: 'bg-slate-500',
  // Treat an unrecognised status as terminal so polling cannot loop forever.
  terminal: true,
});

/**
 * Normalizes a raw backend status into its known key, or null when the value
 * is not a recognised state.
 */
export function normalizeAnalysisStatus(status) {
  if (typeof status !== 'string') return null;
  return Object.prototype.hasOwnProperty.call(STATUS_META, status) ? status : null;
}

/**
 * Returns { key, label, badge, dot, terminal, isKnown } for a backend status.
 */
export function getAnalysisStatus(status) {
  const key = normalizeAnalysisStatus(status);
  const meta = key ? STATUS_META[key] : UNKNOWN_META;
  return { ...meta, key, isKnown: Boolean(key) };
}

/** Human-readable label for a backend status. */
export function getAnalysisStatusLabel(status) {
  return getAnalysisStatus(status).label;
}

/** True for statuses that will never change again. */
export function isTerminalStatus(status) {
  return getAnalysisStatus(status).terminal;
}

/** True while the backend is still working on the analysis. */
export function isInProgressStatus(status) {
  return !isTerminalStatus(status);
}

/** Pluralises a count without ever rendering a raw number on its own. */
export function getCountLabel(count, singular, plural = `${singular}s`) {
  if (typeof count !== 'number' || !Number.isFinite(count) || count < 0) return null;
  return `${count} ${count === 1 ? singular : plural}`;
}

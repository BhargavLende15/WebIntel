import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card, { CardHeader } from '../components/ui/Card';
import { SkeletonCard } from '../components/ui/Skeleton';
import { PageWrapper } from '../layouts/MainLayout';
import { getAnalysis } from '../services/api';

const POLL_INTERVAL_MS = 3000;
const TERMINAL_STATUSES = ['completed', 'failed'];

const CATEGORIES = [
  ['SEO', 'seo_data'],
  ['Content', 'content_data'],
  ['Accessibility', 'accessibility_data'],
  ['Security', 'security_data'],
  ['Performance', 'performance_data'],
  ['Mobile', 'mobile_data'],
  ['AI Search Readiness', 'ai_readiness_data'],
];

const STATUS_STYLES = {
  queued: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  running: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function humanizeKey(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatValue(value) {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

function ValueRow({ label, value }) {
  const isBool = typeof value === 'boolean';
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span
        className={
          isBool
            ? value
              ? 'font-medium text-green-600 dark:text-green-400'
              : 'font-medium text-red-500 dark:text-red-400'
            : 'text-right font-medium text-slate-700 dark:text-slate-200 break-all'
        }
      >
        {formatValue(value)}
      </span>
    </div>
  );
}

function NestedList({ title, items }) {
  if (!items.length) return null;
  return (
    <div className="mt-3 border-t border-slate-200 pt-2 dark:border-slate-700">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {title} ({items.length})
      </p>
      <ul className="space-y-1">
        {items.slice(0, 10).map((item, i) => (
          <li key={i} className="break-all text-xs text-slate-600 dark:text-slate-300">
            • {typeof item === 'object' ? JSON.stringify(item) : item}
          </li>
        ))}
        {items.length > 10 && (
          <li className="text-xs italic text-slate-400">…and {items.length - 10} more</li>
        )}
      </ul>
    </div>
  );
}

function CategoryCard({ title, data }) {
  const entries = Object.entries(data).filter(
    ([key, value]) => key !== 'pages' && (typeof value !== 'object' || value === null),
  );
  const listKeys = Object.entries(data).filter(
    ([key, value]) => Array.isArray(value) && value.length > 0 && key !== 'pages',
  );

  return (
    <Card>
      <CardHeader title={title} subtitle={`${data.pages_analyzed ?? 0} page(s) analyzed`} />
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {entries.map(([key, value]) => (
          <ValueRow key={key} label={humanizeKey(key)} value={value} />
        ))}
      </div>
      {listKeys.map(([key, value]) => (
        <NestedList key={key} title={humanizeKey(key)} items={value} />
      ))}
    </Card>
  );
}

export default function ResultsPage() {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    let active = true;

    const poll = () => {
      getAnalysis(id)
        .then(({ data }) => {
          if (!active) return;
          setAnalysis(data);
          setLoading(false);
          setError(null);
          if (!TERMINAL_STATUSES.includes(data.status)) {
            timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
          }
        })
        .catch((err) => {
          if (!active) return;
          setLoading(false);
          setError(err.response?.data?.detail || 'Failed to load analysis');
        });
    };

    poll();
    return () => {
      active = false;
      clearTimeout(timerRef.current);
    };
  }, [id]);

  if (loading) {
    return (
      <PageWrapper title="Analysis Results" subtitle="Loading...">
        <div className="grid gap-6 md:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper title="Analysis Results" subtitle="Error">
        <Card>
          <p className="text-red-500">{error}</p>
          <Link to="/analyze" className="mt-4 inline-block">
            <Button>Try Again</Button>
          </Link>
        </Card>
      </PageWrapper>
    );
  }

  const status = analysis.status;
  const inProgress = !TERMINAL_STATUSES.includes(status);
  const categories = CATEGORIES.map(([title, field]) => [title, analysis[field]]).filter(
    ([, data]) => data && Object.keys(data).length > 0,
  );

  return (
    <PageWrapper title="Analysis Results" subtitle={`Analysis ID: ${id}`}>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
            STATUS_STYLES[status] || 'bg-slate-100 text-slate-600'
          }`}
        >
          {inProgress && (
            <span className="h-2 w-2 animate-pulse rounded-full bg-current" aria-hidden="true" />
          )}
          {inProgress ? `Analyzing — ${status}` : status}
        </span>
      </div>

      {status === 'failed' && (
        <Card className="mb-6 border-red-200 dark:border-red-800">
          <CardHeader title="Analysis Failed" subtitle="The crawler could not complete this analysis" />
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-red-50 p-3 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {analysis.error_message || 'Unknown error'}
          </pre>
          <Link to="/analyze" className="mt-4 inline-block">
            <Button>Try Another URL</Button>
          </Link>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[
          { title: 'Website ID', value: analysis.website_id },
          { title: 'Created', value: new Date(analysis.created_at).toLocaleString() },
          {
            title: 'Completed',
            value: analysis.completed_at ? new Date(analysis.completed_at).toLocaleString() : null,
          },
        ].map((item) => (
          <Card key={item.title}>
            <CardHeader title={item.title} />
            <p className="text-sm text-slate-600 dark:text-slate-400">{formatValue(item.value)}</p>
          </Card>
        ))}
      </div>

      {categories.length > 0 && (
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map(([title, data]) => (
            <CategoryCard key={title} title={title} data={data} />
          ))}
        </div>
      )}

      {inProgress && categories.length === 0 && (
        <Card className="mt-6">
          <CardHeader title="Crawling Website" subtitle="This usually takes under a minute" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Discovering pages, fetching HTML and running checks. Results will appear here automatically.
          </p>
        </Card>
      )}
    </PageWrapper>
  );
}

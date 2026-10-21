import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card, { CardHeader } from '../components/ui/Card';
import { SkeletonBlock } from '../components/ui/Skeleton';
import { PageWrapper } from '../layouts/MainLayout';
import { getSavedRecommendations, getAnalysis, getWebsite } from '../services/api';
import { NOT_AVAILABLE, formatDisplayValue, humanizeKey } from '../utils/format';

const PRIORITIES = ['critical', 'high', 'medium', 'low'];

const PRIORITY_STYLES = {
  critical:
    'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300',
  high: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300',
  medium: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300',
  low: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

function DetailBlock({ title, children, pre = false }) {
  if (!children) return null;

  return (
    <section className="mt-5 first:mt-0">
      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h4>
      <div
        className={[
          'mt-1.5 text-sm leading-6 break-words text-slate-600 dark:text-slate-400',
          pre && 'whitespace-pre-line',
        ].join(' ')}
      >
        {children}
      </div>
    </section>
  );
}

function RecommendationCard({ item }) {
  const priority = String(item.priority ?? '').toLowerCase();
  const title = item.issue ? humanizeKey(item.issue) : 'Website improvement';
  const improvement =
    item.estimated_improvement == null || item.estimated_improvement === ''
      ? null
      : `+${item.estimated_improvement}`;

  return (
    <Card className="flex h-full flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
          <p className="mt-2 text-sm leading-6 break-words text-slate-600 dark:text-slate-300">
            {formatDisplayValue(item.description, { fallback: NOT_AVAILABLE })}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
            PRIORITY_STYLES[priority] || PRIORITY_STYLES.low
          }`}
        >
          {PRIORITIES.includes(priority) ? priority : 'Unassigned'}
        </span>
      </div>

      <div className="mt-5 flex-1">
        <DetailBlock title="Why it matters">{formatDisplayValue(item.why_it_matters, { fallback: '' })}</DetailBlock>
        <DetailBlock title="Business impact">
          {formatDisplayValue(item.business_impact, { fallback: '' })}
        </DetailBlock>
        <DetailBlock title="Suggested implementation" pre>
          {formatDisplayValue(item.suggested_implementation, { fallback: '' })}
        </DetailBlock>
      </div>

      {(item.difficulty || improvement) && (
        <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          {item.difficulty && (
            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Difficulty: {formatDisplayValue(item.difficulty)}
            </span>
          )}
          {improvement && (
            <span className="rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
              Estimated improvement: {improvement}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}

export default function RecommendationsPage() {
  const { id } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [website, setWebsite] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadRecommendations() {
      setLoading(true);
      setError('');

      try {
        const { data } = await getSavedRecommendations(id);
        if (active) {
          setItems(Array.isArray(data?.recommendations) ? data.recommendations : []);
        }
        // try to get website info
        try {
          const a = await getAnalysis(id);
          if (active && a.data?.website_id) {
            try {
              const w = await getWebsite(a.data.website_id);
              if (active) setWebsite(w.data);
            } catch (e) {}
          }
        } catch (e) {}
      } catch (err) {
        if (!active) return;
        const detail = err.response?.data?.detail;
        setError(
          typeof detail === 'string' && detail.trim() !== ''
            ? detail
            : err.response
              ? 'Recommendations are not available for this analysis yet.'
              : 'Cannot reach the WebIntel API. Check that the backend is running, then try again.',
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRecommendations();
    return () => {
      active = false;
    };
  }, [id, retryKey]);

  return (
    <PageWrapper title="Recommendations" subtitle={`Prioritized improvements for analysis ${id}`}>
      {(website?.name || website?.url) && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <span className="font-medium text-slate-900 dark:text-white">
            {website?.name || website?.domain || 'Website'}
          </span>
          {website?.url && (
            <span className="text-slate-500 dark:text-slate-400 break-all">
              • {website?.url}
            </span>
          )}
        </div>
      )}
      <div className="mb-6 flex flex-wrap gap-3">
        <Link to={`/results/${id}`}>
          <Button variant="outline">Back to results</Button>
        </Link>
      </div>

      {loading && (
        <Card>
          <CardHeader
            title="Loading recommendations"
            subtitle="Generating findings from the completed analysis"
          />
          <div role="status" aria-live="polite">
            <SkeletonBlock lines={4} />
          </div>
        </Card>
      )}

      {!loading && error && (
        <Card className="border-rose-200 dark:border-rose-800">
          <CardHeader title="Recommendations unavailable" />
          <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
            {error}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={() => setRetryKey((key) => key + 1)}>Try again</Button>
            <Link to={`/results/${id}`}>
              <Button variant="outline">Back to results</Button>
            </Link>
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Recommendations can only be generated after an analysis completes.
          </p>
        </Card>
      )}

      {!loading && !error && items.length === 0 && (
        <Card>
          <CardHeader title="No recommendations found" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            WebIntel's recommendation engine did not identify any actionable issues for this
            analysis. Nothing has been invented to fill this section.
          </p>
          <div className="mt-4">
            <Link to={`/results/${id}`}>
              <Button variant="outline">Back to results</Button>
            </Link>
          </div>
        </Card>
      )}

      {!loading && !error && items.length > 0 && (
        <>
          <Card className="mb-6">
            <CardHeader
              title={`${items.length} actionable finding${items.length === 1 ? '' : 's'}`}
              subtitle="Generated by WebIntel's deterministic recommendation engine."
            />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Estimated improvements are heuristic estimates, not guaranteed outcomes.
            </p>
          </Card>
          <div className="grid gap-5 xl:grid-cols-2">
            {items.map((item, index) => (
              <RecommendationCard key={`${item?.issue ?? 'finding'}-${index}`} item={item} />
            ))}
          </div>
        </>
      )}
    </PageWrapper>
  );
}

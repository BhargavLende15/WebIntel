import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card, { CardHeader } from '../components/ui/Card';
import { PageWrapper } from '../layouts/MainLayout';
import { getSavedRecommendations } from '../services/api';

const PRIORITY_STYLES = {
  critical: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300',
  high: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300',
  medium: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300',
  low: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

function RecommendationCard({ item }) {
  const priority = String(item.priority || '').toLowerCase();

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold capitalize text-slate-900 dark:text-white">
            {String(item.issue || 'Website improvement').replace(/_/g, ' ')}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {item.description}
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
          PRIORITY_STYLES[priority] || 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
        }`}>
          {priority || 'unassigned'}
        </span>
      </div>

      {item.why_it_matters && (
        <section className="mt-5">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Why it matters</h4>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.why_it_matters}</p>
        </section>
      )}

      {item.business_impact && (
        <section className="mt-4">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Business impact</h4>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.business_impact}</p>
        </section>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {item.difficulty && (
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Difficulty: {item.difficulty}
          </span>
        )}
        {item.estimated_improvement != null && (
          <span className="rounded-lg bg-primary-50 px-3 py-1.5 text-xs text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            Estimated improvement: {item.estimated_improvement}
          </span>
        )}
      </div>

      {item.suggested_implementation && (
        <section className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-700">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Suggested implementation</h4>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-300">
            {item.suggested_implementation}
          </p>
        </section>
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

  useEffect(() => {
    let active = true;

    async function loadRecommendations() {
      setLoading(true);
      setError('');

      try {
        const { data } = await getSavedRecommendations(id);
        if (active) setItems(data.recommendations || []);
      } catch (err) {
        if (!active) return;
        const detail = err.response?.data?.detail;
        setError(typeof detail === 'string' ? detail : 'Unable to load recommendations. Confirm that the analysis is complete and the backend is running.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRecommendations();
    return () => { active = false; };
  }, [id, retryKey]);

  return (
    <PageWrapper title="Recommendations" subtitle={`Prioritized improvements for analysis ${id}`}>
      <div className="mb-6">
        <Link to={`/results/${id}`}>
          <Button variant="outline">Back to Results</Button>
        </Link>
      </div>

      {loading && (
        <Card>
          <CardHeader title="Loading recommendations" subtitle="Generating findings from the completed analysis..." />
          <div className="mt-4 space-y-3" aria-label="Loading recommendations">
            <div className="skeleton h-5 w-1/3" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-2/3" />
          </div>
        </Card>
      )}

      {!loading && error && (
        <Card>
          <CardHeader title="Recommendations unavailable" />
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <div className="mt-4">
            <Button onClick={() => setRetryKey((key) => key + 1)}>Try Again</Button>
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Recommendations can only be generated after the analysis completes.
          </p>
        </Card>
      )}

      {!loading && !error && items.length === 0 && (
        <Card>
          <CardHeader title="No recommendations found" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            The engine did not identify any actionable issues for this analysis.
          </p>
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
            {items.map((item) => (
              <RecommendationCard key={item.issue} item={item} />
            ))}
          </div>
        </>
      )}
    </PageWrapper>
  );
}

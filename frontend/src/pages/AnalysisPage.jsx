import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card, { CardHeader } from '../components/ui/Card';
import { PageWrapper } from '../layouts/MainLayout';
import { analyzeWebsite } from '../services/api';
import { EM_DASH } from '../utils/format';

const CHECKS = [
  'Performance & Core Web Vitals',
  'SEO & Structured Data',
  'Accessibility',
  'Security Headers',
  'AI Search Readiness',
  'Content Quality',
  'Mobile Responsiveness',
  'Business Intelligence',
];

function getSubmitError(error) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim() !== '') return detail;
  if (error?.response) return 'The analysis could not be queued. Check the URL and try again.';
  return 'Cannot reach the WebIntel API. Check that the backend is running, then try again.';
}

export default function AnalysisPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const normalizedUrl = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;
      const { data } = await analyzeWebsite(normalizedUrl);

      if (!data?.analysis_id) {
        setError('The API accepted the request but did not return an analysis to track.');
        return;
      }

      navigate(`/results/${data.analysis_id}`);
    } catch (err) {
      setError(getSubmitError(err));
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white';

  return (
    <PageWrapper
      title="Website Analysis"
      subtitle="Enter a URL to assess digital readiness"
    >
      <Card className="mx-auto max-w-2xl">
        <CardHeader
          title="Analyze Website"
          subtitle={`WebIntel only analyzes ${EM_DASH} it never modifies your website`}
        />
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="websiteUrl"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Website URL
            </label>
            <input
              id="websiteUrl"
              name="url"
              type="url"
              inputMode="url"
              autoComplete="url"
              spellCheck="false"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com"
              required
              aria-describedby="websiteUrlHint"
              className={inputClass}
            />
            <p id="websiteUrlHint" className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              Enter a full address, for example https://example.com. WebIntel adds
              https:// if you leave it out.
            </p>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
            >
              {error}
            </p>
          )}

          <Button type="submit" size="lg" block loading={loading} disabled={!url.trim()}>
            {loading ? 'Queueing analysis' : 'Start analysis'}
          </Button>
        </form>

        <div className="mt-6 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
          <h4 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
            What WebIntel analyzes
          </h4>
          <ul className="grid grid-cols-1 gap-x-4 gap-y-2 text-xs text-slate-600 sm:grid-cols-2 dark:text-slate-400">
            {CHECKS.map((check) => (
              <li key={check} className="flex items-start gap-2">
                <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" />
                <span>{check}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            Analyses are read-only and may take under a minute. You can leave the results page
            and come back to it from your dashboard.
          </p>
        </div>
      </Card>
    </PageWrapper>
  );
}

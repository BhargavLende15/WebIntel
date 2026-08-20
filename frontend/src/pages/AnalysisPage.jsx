import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card, { CardHeader } from '../components/ui/Card';
import { PageWrapper } from '../layouts/MainLayout';
import { analyzeWebsite } from '../services/api';

export default function AnalysisPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
      const { data } = await analyzeWebsite(normalizedUrl);
      navigate(`/results/${data.analysis_id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to queue analysis. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper
      title="Website Analysis"
      subtitle="Enter a URL to assess digital readiness"
    >
      <Card className="mx-auto max-w-2xl">
        <CardHeader
          title="Analyze Website"
          subtitle="WebIntel analyzes only — it never modifies your website"
        />
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Website URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-800"
            />
          </div>
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}
          <Button type="submit" disabled={loading || !url} className="w-full">
            {loading ? 'Queuing Analysis...' : 'Start Analysis'}
          </Button>
        </form>

        <div className="mt-6 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
          <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            What we analyze
          </h4>
          <ul className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
            <li>• Performance & Core Web Vitals</li>
            <li>• SEO & Structured Data</li>
            <li>• Accessibility</li>
            <li>• Security Headers</li>
            <li>• AI Search Readiness</li>
            <li>• Content Quality</li>
            <li>• Mobile Responsiveness</li>
            <li>• Business Intelligence</li>
          </ul>
        </div>
      </Card>
    </PageWrapper>
  );
}

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card, { CardHeader } from '../components/ui/Card';
import { PageWrapper } from '../layouts/MainLayout';
import { generateReport } from '../services/api';
import { EM_DASH } from '../utils/format';

/**
 * Turns a failed report request into a message that is safe and useful to
 * show. The raw response body and the axios message are deliberately not
 * displayed: the server can return an HTML error page or a Python traceback,
 * and neither belongs on screen.
 */
function getReportError(error) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === 'string' && detail.trim() !== '') return detail;

  const status = error?.response?.status;

  if (status === 404) return 'This assessment could not be found.';
  if (status === 403 || status === 401) return 'Your session expired. Sign in and try again.';
  if (status === 422) return 'This assessment is not complete yet, so no report can be generated.';
  if (status === 503) return 'Report generation is unavailable right now. Try again shortly.';
  if (!error?.response) {
    return 'Cannot reach the WebIntel API. Check that the backend is running, then try again.';
  }

  return 'The report could not be generated. Please try again.';
}

export default function ReportsPage() {
  const { id } = useParams();
  const [includeRecommendations, setIncludeRecommendations] = useState(true);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function downloadPdf() {
    setLoading(true);
    setError('');
    setStatus('');

    try {
      const response = await generateReport({
        analysis_id: id,
        format: 'pdf',
        include_charts: true,
        include_recommendations: includeRecommendations,
      });

      const contentType = response.headers?.['content-type'] || '';
      if (!contentType.includes('application/pdf')) {
        throw new Error('not-a-pdf');
      }

      const blobUrl = window.URL.createObjectURL(
        response.data instanceof Blob
          ? response.data
          : new Blob([response.data], { type: 'application/pdf' }),
      );

      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = `webintel-report-${id}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(blobUrl);

      setStatus('Your PDF report has been generated and downloaded.');
    } catch (err) {
      setError(getReportError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageWrapper title="Reports" subtitle={`Executive reporting ${EM_DASH} analysis ${id}`}>
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader
            title="Generate report"
            subtitle="Download a report based on this saved assessment"
          />
          <div className="space-y-4">
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              The report includes the readiness score, category breakdown, measurement
              coverage, score explanation, and saved recommendations. Unavailable measurements
              are never fabricated.
            </p>

            <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={includeRecommendations}
                onChange={(event) => setIncludeRecommendations(event.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-primary-600 focus:ring-2 focus:ring-primary-500/40"
              />
              <span>Include saved recommendations</span>
            </label>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
              >
                {error}
              </p>
            )}

            {status && (
              <p
                role="status"
                className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
              >
                {status}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <Button onClick={downloadPdf} loading={loading} disabled={!id}>
                {loading ? 'Generating PDF' : 'Download PDF'}
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="What the report contains" />
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            {[
              'Overall Web Readiness Score and grade',
              'Category breakdown across the seven measured categories',
              'Measurement coverage for the assessment',
              'Score explanation returned by the scoring engine',
              includeRecommendations ? 'Prioritized recommendations' : null,
            ]
              .filter(Boolean)
              .map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400"
                  />
                  <span>{item}</span>
                </li>
              ))}
          </ul>
        </Card>
      </div>
    </PageWrapper>
  );
}

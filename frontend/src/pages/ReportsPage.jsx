import { useState } from 'react';
import { useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card, { CardHeader } from '../components/ui/Card';
import { PageWrapper } from '../layouts/MainLayout';
import { generateReport } from '../services/api';

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
        const message = typeof response.data === 'string'
          ? response.data
          : 'The server did not return a PDF file.';
        throw new Error(message);
      }

      const blobUrl = window.URL.createObjectURL(
        response.data instanceof Blob
          ? response.data
          : new Blob([response.data], { type: 'application/pdf' })
      );
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = `webintel-report-${id}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(blobUrl);
      setStatus('Your PDF report has been generated.');
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        'Unable to generate the report. Try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageWrapper
      title="Reports"
      subtitle={`Executive reporting · Analysis ${id}`}
    >
      <Card>
        <CardHeader
          title="Generate Report"
          subtitle="Download a report based on this saved assessment"
        />
        <div className="space-y-4">
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            The report includes the readiness score, category breakdown,
            measurement coverage, score explanation, and saved recommendations.
            Unavailable measurements are not fabricated.
          </p>

          <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={includeRecommendations}
              onChange={(event) => setIncludeRecommendations(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Include saved recommendations
          </label>

          {error && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          {status && (
            <p role="status" className="text-sm text-green-600 dark:text-green-400">
              {status}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button onClick={downloadPdf} disabled={loading || !id}>
              {loading ? 'Generating PDF…' : 'Download PDF'}
            </Button>
          </div>
        </div>
      </Card>
    </PageWrapper>
  );
}

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card, { CardHeader } from '../components/ui/Card';
import { SkeletonCard } from '../components/ui/Skeleton';
import { PageWrapper } from '../layouts/MainLayout';
import { getAnalysis } from '../services/api';

export default function ResultsPage() {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAnalysis(id)
      .then(({ data }) => setAnalysis(data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load analysis'))
      .finally(() => setLoading(false));
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

  return (
    <PageWrapper title="Analysis Results" subtitle={`Analysis ID: ${id}`}>
      <div className="mb-6 flex flex-wrap gap-3">
        <Link to={`/recommendations/${id}`}>
          <Button variant="secondary">Recommendations</Button>
        </Link>
        <Link to={`/analytics/${id}`}>
          <Button variant="secondary">Analytics</Button>
        </Link>
        <Link to={`/assistant/${id}`}>
          <Button variant="secondary">AI Assistant</Button>
        </Link>
        <Link to={`/reports/${id}`}>
          <Button variant="outline">Generate Report</Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[
          { title: 'Status', value: analysis.status },
          { title: 'Website ID', value: analysis.website_id },
          { title: 'Created', value: new Date(analysis.created_at).toLocaleString() },
        ].map((item) => (
          <Card key={item.title}>
            <CardHeader title={item.title} />
            <p className="text-sm text-slate-600 dark:text-slate-400">{item.value}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Detailed Metrics"
          subtitle="Full analysis data available in Phase 2"
        />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Performance, SEO, accessibility, security, mobile, content, and AI readiness metrics
          will appear here once the Website Analysis Engine is integrated.
        </p>
      </Card>
    </PageWrapper>
  );
}

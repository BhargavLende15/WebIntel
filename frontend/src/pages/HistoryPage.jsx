import { useParams } from 'react-router-dom';
import ChartPlaceholder from '../charts/ChartPlaceholder';
import Card, { CardHeader } from '../components/ui/Card';
import { PageWrapper } from '../layouts/MainLayout';

export default function HistoryPage() {
  const { websiteId } = useParams();

  return (
    <PageWrapper title="History" subtitle={`Assessment history • Website ${websiteId}`}>
      <Card className="mb-6">
        <CardHeader title="Historical Trends" subtitle="Track improvement over time" />
        <ChartPlaceholder title="Trend Chart – Score History" type="line" />
      </Card>
      <Card>
        <CardHeader title="Past Assessments" subtitle="Compare previous reports — Phase 7" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Historical comparisons and reassessment tracking will be available in Phase 7.
        </p>
      </Card>
    </PageWrapper>
  );
}

import { useParams } from 'react-router-dom';
import ChartPlaceholder from '../charts/ChartPlaceholder';
import Card, { CardHeader } from '../components/ui/Card';
import { PageWrapper } from '../layouts/MainLayout';

export default function AnalyticsPage() {
  const { id } = useParams();

  return (
    <PageWrapper title="Analytics" subtitle={`Business intelligence • Analysis ${id}`}>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Score Breakdown" subtitle="Category comparison" />
          <ChartPlaceholder title="Bar Chart – Category Scores" type="bar" />
        </Card>
        <Card>
          <CardHeader title="Business Impact" subtitle="Priority vs impact matrix" />
          <ChartPlaceholder title="Area Chart – Impact Analysis" type="area" />
        </Card>
        <Card>
          <CardHeader title="Priority Distribution" subtitle="Recommendation priorities" />
          <ChartPlaceholder title="Pie Chart – Priority Matrix" type="pie" />
        </Card>
        <Card>
          <CardHeader title="Competitor Comparison" subtitle="Future-ready placeholder" />
          <div className="flex h-64 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <p className="text-sm text-slate-400">Coming in a future release</p>
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
}

import { useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card, { CardHeader } from '../components/ui/Card';
import { PageWrapper } from '../layouts/MainLayout';

export default function ReportsPage() {
  const { id } = useParams();

  return (
    <PageWrapper title="Reports" subtitle={`Executive reporting • Analysis ${id}`}>
      <Card>
        <CardHeader
          title="Generate Report"
          subtitle="Professional PDF and HTML reports — Phase 7"
        />
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Reports will include executive summary, digital readiness score, charts,
            recommendations, business impact analysis, and historical comparison.
          </p>
          <div className="flex gap-3">
            <Button disabled>Download PDF</Button>
            <Button variant="outline" disabled>
              View HTML Report
            </Button>
          </div>
        </div>
      </Card>
    </PageWrapper>
  );
}

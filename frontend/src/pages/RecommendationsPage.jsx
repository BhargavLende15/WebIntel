import { useParams } from 'react-router-dom';
import Card, { CardHeader } from '../components/ui/Card';
import { PageWrapper } from '../layouts/MainLayout';

export default function RecommendationsPage() {
  const { id } = useParams();

  return (
    <PageWrapper
      title="Recommendations"
      subtitle={`AI-powered optimization suggestions • Analysis ${id}`}
    >
      <Card>
        <CardHeader
          title="AI Recommendations"
          subtitle="Powered by Google Gemini — available in Phase 4"
        />
        <div className="rounded-xl border-2 border-dashed border-slate-200 p-12 text-center dark:border-slate-700">
          <span className="mb-4 block text-4xl">🤖</span>
          <p className="text-slate-500 dark:text-slate-400">
            Recommendations with priority, business impact, and implementation guidance will be
            generated here after Gemini integration.
          </p>
        </div>
      </Card>
    </PageWrapper>
  );
}

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card, { CardHeader } from '../components/ui/Card';
import { PageWrapper } from '../layouts/MainLayout';
import { sendChatMessage } from '../services/api';

const suggestions = [
  'Why is my SEO score low?',
  'How do I improve AI readiness?',
  'What should I fix first?',
  'What will increase my score fastest?',
  'Explain Lighthouse metrics.',
];

export default function AssistantPage() {
  const { id } = useParams();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hello! I am the WebIntel AI Decision Support Assistant. Ask me anything about your website analysis.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (text) => {
    const userMessage = text || input;
    if (!userMessage.trim()) return;

    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await sendChatMessage({
        message: userMessage,
        analysis_id: id,
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Unable to reach the AI assistant. Please ensure the backend is running.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper title="AI Assistant" subtitle="Decision support powered by Gemini AI">
      <Card className="flex h-[calc(100vh-12rem)] flex-col">
        <CardHeader title="Chat with WebIntel AI" subtitle="Full Gemini integration in Phase 4" />

        <div className="mb-4 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-300'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-white px-4 py-2 text-sm text-slate-400 dark:bg-slate-900">
                Thinking...
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="mt-4 flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your analysis..."
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800"
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            Send
          </Button>
        </form>
      </Card>
    </PageWrapper>
  );
}

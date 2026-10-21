
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card, { CardHeader } from '../components/ui/Card';
import { PageWrapper } from '../layouts/MainLayout';
import { sendChatMessage, getAnalysis, getWebsite } from '../services/api';

// AI stays disabled until a provider is configured intentionally.
// Enable later by setting VITE_AI_ASSISTANT_ENABLED=true.
const AI_ASSISTANT_ENABLED =
  import.meta.env.VITE_AI_ASSISTANT_ENABLED === 'true';

const suggestions = [
  'Why is my SEO score low?',
  'How do I improve AI readiness?',
  'What should I fix first?',
  'What will increase my score fastest?',
  'Explain Lighthouse metrics.',
];

function getErrorMessage(error) {
  const status = error?.response?.status;
  const detail = error?.response?.data?.detail;

  if (status === 503) {
    return 'The AI assistant is not configured. Your other WebIntel features remain available.';
  }

  if (status === 502) {
    return 'The AI provider could not complete the request. Check the provider configuration and try again.';
  }

  if (status === 504) {
    return 'The AI request timed out. Please try again.';
  }

  if (status === 401) {
    return 'Your session may have expired. Sign in again and retry.';
  }

  if (status === 403) {
    return 'You are not authorized to access this resource.';
  }

  if (!error?.response) {
    return 'Could not reach the backend. Check that the backend server is running and try again.';
  }

  return typeof detail === 'string'
    ? detail
    : 'Something went wrong while generating the response. Please try again.';
}

export default function AssistantPage() {
  const { id } = useParams();

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: AI_ASSISTANT_ENABLED
        ? 'Welcome to WebIntel AI. Ask a question about your website assessment, understand your metrics, or explore practical ways to improve your results.'
        : 'Welcome to WebIntel. The AI Assistant is currently unavailable because an AI provider has not been configured. Your website assessments, scores, analytics, reports, history, and recommendations remain available without AI.',
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [website, setWebsite] = useState(null);

  const conversationEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    let active = true;
    async function loadWebsite() {
      if (!id) return;
      try {
        const a = await getAnalysis(id);
        const data = a?.data || a;
        const wid = data?.website_id;
        if (wid && active) {
          try {
            const w = await getWebsite(wid);
            if (active) {
              const wd = w?.data || w;
              setWebsite(wd);
            }
          } catch (e) {
            // ignore
          }
        }
      } catch (e) {
        // ignore - don't break UI
      }
    }
    loadWebsite();
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    conversationEndRef.current?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'end',
    });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    // Do not make chat requests when the AI provider is disabled.
    if (!AI_ASSISTANT_ENABLED) return;

    const userMessage = (text ?? input).trim();

    if (!userMessage || loading) return;

    setMessages((previous) => [
      ...previous,
      { role: 'user', content: userMessage },
    ]);

    setInput('');
    setLoading(true);

    try {
      const payload = { message: userMessage };

      if (id) {
        payload.analysis_id = id;
      }

      if (sessionId) {
        payload.session_id = sessionId;
      }

      const { data } = await sendChatMessage(payload);

      if (data.session_id) {
        setSessionId(data.session_id);
      }

      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content: data.reply || 'The assistant returned an empty response.',
        },
      ]);
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          role: 'error',
          content: getErrorMessage(error),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <PageWrapper
      title="AI Assistant"
      subtitle="Assessment-aware guidance for your website"
    >
      {(website?.name || website?.url) && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <span className="font-medium text-slate-900 dark:text-white">
            {website?.name || website?.domain || 'Website'}
          </span>
          {website?.url && (
            <span className="text-slate-500 dark:text-slate-400">
              • {website?.url}
            </span>
          )}
        </div>
      )}
      <Card className="flex h-[min(720px,calc(100dvh-11rem))] min-h-[440px] flex-col">
        <CardHeader
          title="Chat with WebIntel AI"
          subtitle={
            id
              ? 'Questions and recommendations for the selected assessment'
              : 'Ask about website readiness, metrics, and improvement priorities'
          }
        />

        {!AI_ASSISTANT_ENABLED && (
          <div
            role="status"
            aria-live="polite"
            className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 font-bold text-amber-900 dark:bg-amber-900 dark:text-amber-100"
              >
                !
              </span>

              <div>
                <p className="font-semibold">
                  AI assistant not configured
                </p>
                <p className="mt-1">
                  Chat responses are temporarily unavailable because no AI
                  provider has been configured. You can continue using website
                  analysis, scores, analytics, reports, history, and
                  recommendations normally.
                </p>
                <p className="mt-2 text-xs">
                  No API key is required for these other features.
                </p>
              </div>
            </div>
          </div>
        )}

        {AI_ASSISTANT_ENABLED && (
          <div className="mb-4 flex flex-wrap gap-2" aria-label="Suggested questions">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={loading}
                onClick={() => sendMessage(suggestion)}
                className="min-h-9 rounded-full border border-slate-200 px-3 py-2 text-left text-xs text-slate-600 transition hover:border-primary-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <div
          className="mb-4 flex-1 space-y-4 overflow-y-auto overscroll-contain rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50"
          role="log"
          aria-label="Chat conversation"
          aria-live="polite"
          aria-relevant="additions"
        >
          {messages.map((message, index) => (
            <div
              key={`${index}-${message.role}`}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[90%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm sm:max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : message.role === 'error'
                      ? 'border border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
                      : 'bg-white text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-300'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}

          {loading && (
            <div
              className="flex justify-start"
              aria-label="Assistant is responding"
            >
              <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary-500" />
                  Generating response…
                </span>
              </div>
            </div>
          )}

          <div ref={conversationEndRef} />
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage();
          }}
          className="mt-4 flex gap-2"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={
              AI_ASSISTANT_ENABLED
                ? 'Ask about your website assessment…'
                : 'Chat unavailable — AI provider not configured'
            }
            aria-label="Message to WebIntel AI"
            autoComplete="off"
            maxLength={4000}
            className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:disabled:bg-slate-900"
            disabled={loading || !AI_ASSISTANT_ENABLED}
          />

          <Button
            type="submit"
            disabled={
              loading || !input.trim() || !AI_ASSISTANT_ENABLED
            }
          >
            {loading ? 'Sending…' : 'Send'}
          </Button>
        </form>

        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {AI_ASSISTANT_ENABLED
            ? 'AI responses can be inaccurate. Verify important recommendations against your assessment data.'
            : 'AI chat is disabled until a provider is configured. Other WebIntel features are unaffected.'}
        </p>
      </Card>
    </PageWrapper>
  );
}

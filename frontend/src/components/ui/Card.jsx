import { createContext, useContext, useId } from 'react';
import { cn } from '../../utils';

const CardHeadingIdContext = createContext(undefined);

/**
 * Surface primitive used across every page.
 *
 * Renders a <section> and shares a generated id with any nested <CardHeader>,
 * so each card becomes a properly named landmark for screen readers rather
 * than an anonymous one. No heading text is duplicated.
 */
export default function Card({
  children,
  className = '',
  glass = false,
  ...props
}) {
  const headingId = useId();

  const base = glass
    ? 'glass-card'
    : 'rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900';

  return (
    <CardHeadingIdContext.Provider value={headingId}>
      <section className={cn('min-w-0 p-5 sm:p-6', base, className)} aria-labelledby={headingId} {...props}>
        {children}
      </section>
    </CardHeadingIdContext.Provider>
  );
}

export function CardHeader({ title, subtitle, action, id }) {
  const cardHeadingId = useContext(CardHeadingIdContext);
  const headingId = id || cardHeadingId;

  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h3
          id={headingId}
          className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg dark:text-white"
        >
          {title}
        </h3>
        {subtitle && (
          <p className="mt-1.5 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

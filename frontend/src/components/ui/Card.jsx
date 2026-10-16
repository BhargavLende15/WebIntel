export default function Card({
  children,
  className = '',
  glass = false,
  ...props
}) {
  const base = glass
    ? 'glass-card'
    : 'rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900';

  return (
    <section
      className={`${base} min-w-0 p-5 sm:p-6 ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white sm:text-lg">
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

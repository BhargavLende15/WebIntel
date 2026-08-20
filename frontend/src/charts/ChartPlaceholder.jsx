export default function ChartPlaceholder({ title, type = 'line' }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
      <span className="mb-2 text-3xl opacity-50">
        {type === 'radar' && '🕸️'}
        {type === 'bar' && '📊'}
        {type === 'pie' && '🥧'}
        {type === 'area' && '📈'}
        {type === 'line' && '📉'}
      </span>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <p className="mt-1 text-xs text-slate-400">Available in Phase 5</p>
    </div>
  );
}

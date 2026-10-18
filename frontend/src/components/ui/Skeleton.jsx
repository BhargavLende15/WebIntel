import { cn } from '../../utils';

/**
 * Loading placeholder. Always pass an explicit height so the placeholder
 * reserves space and the layout does not jump when the real content arrives.
 */
export default function Skeleton({ className = 'h-4 w-full' }) {
  return <div className={cn('skeleton', className)} aria-hidden="true" />;
}

/**
 * Matches the default Card surface so a loading grid lines up with the
 * loaded grid that replaces it.
 */
export function SkeletonCard({ className = '' }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900',
        className,
      )}
    >
      <Skeleton className="mb-4 h-5 w-1/3" />
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="mb-2 h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

/**
 * Full-width block used while a page waits for its API response.
 */
export function SkeletonBlock({ lines = 3, className = '' }) {
  const widths = ['w-full', 'w-5/6', 'w-2/3', 'w-4/5', 'w-1/2'];

  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className={cn('h-4', widths[index % widths.length])} />
      ))}
    </div>
  );
}

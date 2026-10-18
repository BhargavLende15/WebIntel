import { cn } from '../../utils';

const VARIANTS = {
  primary:
    'bg-primary-600 text-white shadow-sm shadow-primary-600/20 hover:bg-primary-700 active:bg-primary-800',
  secondary:
    'border border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  outline:
    'border border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800',
  danger:
    'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/60',
};

const SIZES = {
  sm: 'min-h-8 gap-1.5 px-3 py-1.5 text-xs',
  md: 'min-h-10 gap-2 rounded-xl px-4 py-2 text-sm',
  lg: 'min-h-12 gap-2 rounded-xl px-6 py-3 text-sm',
};

/**
 * Shared button. `block` makes the button fill its container, `loading`
 * disables it and exposes `aria-busy` so screen readers announce the state.
 * Neither prop is forwarded to the DOM.
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  block = false,
  loading = false,
  disabled = false,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-colors duration-150',
        'disabled:cursor-not-allowed disabled:opacity-50',
        block && 'w-full',
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        className,
      )}
      {...props}
    >
      {loading && (
        <span
          className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}

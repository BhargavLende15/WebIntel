/** Joins conditional class names, dropping anything falsy. */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Convenience barrel for the shared display helpers.
 * The real implementations live in ./format and ./status so that page-level
 * modules never grow their own copy of the encoding or status logic.
 */
export * from './format';
export * from './status';

const GRADE_COLORS = {
  Excellent: 'text-emerald-500',
  Good: 'text-green-500',
  Average: 'text-yellow-500',
  Poor: 'text-orange-500',
  Critical: 'text-red-500',
  Pending: 'text-slate-400',
};

export function getGradeColor(grade) {
  return GRADE_COLORS[grade] || 'text-slate-500';
}

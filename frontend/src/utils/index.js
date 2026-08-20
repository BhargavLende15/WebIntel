export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function formatScore(score) {
  if (score == null) return '—';
  return Math.round(score);
}

export function getGradeColor(grade) {
  const colors = {
    Excellent: 'text-emerald-500',
    Good: 'text-green-500',
    Average: 'text-yellow-500',
    Poor: 'text-orange-500',
    Critical: 'text-red-500',
    Pending: 'text-slate-400',
  };
  return colors[grade] || 'text-slate-500';
}

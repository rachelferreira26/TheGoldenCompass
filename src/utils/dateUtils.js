export const daysBetween = (start, end) => {
  const s = new Date(start);
  const e = new Date(end);
  const diff = e - s;
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
};

export const averageDays = (periods) => {
  const valid = periods.filter((p) => p.startDate && p.endDate);
  if (valid.length === 0) return null;
  const total = valid.reduce((sum, p) => sum + daysBetween(p.startDate, p.endDate), 0);
  return Math.round(total / valid.length);
};

export const formatDate = (isoString) => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatDuration = (days) => {
  if (days === null || days === undefined) return '—';
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.round(days / 7)}w`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}yr`;
};

export const estimateMonthlyCost = (price, avgDays) => {
  if (!price || !avgDays) return null;
  return ((price / avgDays) * 30).toFixed(2);
};

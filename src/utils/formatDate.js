// Utility to format dates consistently and handle invalid/null values
export function formatDate(date, withTime = false) {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  return withTime
    ? d.toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

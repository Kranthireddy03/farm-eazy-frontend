import { formatDistanceToNow } from 'date-fns';

const TYPE_META = {
  REGISTERED: { icon: '✍️', color: 'bg-blue-500/15 text-blue-600 dark:text-blue-300' },
  ORDER_PLACED: { icon: '📦', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-300' },
  ADDED_PRODUCT: { icon: '➕', color: 'bg-primary/50/15 text-primary dark:text-primary' },
  FARM_ADDED: { icon: '🌾', color: 'bg-lime-500/15 text-lime-600 dark:text-lime-300' },
  CROP_ADDED: { icon: '🌱', color: 'bg-green-500/15 text-green-600 dark:text-green-300' },
  COINS_EARNED: { icon: '🪙', color: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-300' },
  DEFAULT: { icon: '📋', color: 'bg-muted/300/15 text-muted-foreground dark:text-muted-foreground' },
};

function getMeta(type) {
  return TYPE_META[type] || TYPE_META.DEFAULT;
}

export default function ActivityTimeline({ activities = [], emptyMessage = 'No activity yet.', className = '' }) {
  if (!activities.length) {
    return (
      <div className={`rounded-2xl border border-dashed border-border dark:border-border p-8 text-center text-sm text-muted-foreground ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="absolute left-[1.15rem] top-3 bottom-3 w-px bg-slate-200 dark:bg-muted" aria-hidden />
      <ul className="space-y-4">
        {activities.map((activity, index) => {
          const meta = getMeta(activity.activityType || activity.type);
          const ts = activity.createdAt || activity.timestamp;
          const label = activity.description || activity.message || activity.activityType || 'Activity';

          return (
            <li key={activity.id || index} className="relative flex gap-4 pl-1">
              <div className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.color} ring-4 ring-white dark:ring-slate-900`}>
                <span>{meta.icon}</span>
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <p className="text-sm font-medium text-foreground dark:text-slate-100 leading-snug">{label}</p>
                {ts && (
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(ts), { addSuffix: true })}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

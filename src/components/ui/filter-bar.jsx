import { Search, X } from 'lucide-react';
import { Input } from './input';
import { cn } from '../../lib/utils';

export function FilterBar({
  value,
  onChange,
  placeholder = 'Search…',
  filters = [],
  activeFilter,
  onFilterChange,
  className,
  onClear,
}) {
  return (
    <div className={cn('ops-panel p-3 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between', className)}>
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-9 pr-9"
          aria-label="Search"
        />
        {value && (
          <button
            type="button"
            onClick={() => (onClear ? onClear() : onChange(''))}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {filters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              className={cn('ops-chip', activeFilter === f.value && 'ops-chip-active')}
              onClick={() => onFilterChange?.(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

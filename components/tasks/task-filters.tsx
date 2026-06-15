'use client';

import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  SORT_OPTIONS,
  STATUS_FILTER_OPTIONS,
  type SortOption,
  type StatusFilter,
} from '@/lib/task-ui';

interface TaskFiltersProps {
  status: StatusFilter;
  sort: SortOption;
  onStatusChange: (status: StatusFilter) => void;
  onSortChange: (sort: SortOption) => void;
}

export function TaskFilters({
  status,
  sort,
  onStatusChange,
  onSortChange,
}: TaskFiltersProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-col gap-2">
        <Label htmlFor="status-filter">Status</Label>
        <ToggleGroup
          id="status-filter"
          value={[status]}
          onValueChange={(values) => {
            const next = values[0];
            if (next) {
              onStatusChange(next as StatusFilter);
            }
          }}
          variant="outline"
          spacing={0}
          className="w-full flex-wrap sm:w-auto"
        >
          {STATUS_FILTER_OPTIONS.map((option) => (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              aria-label={`Filter by ${option.label}`}
              className="min-w-20"
            >
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="sort-filter">Sort by</Label>
        <ToggleGroup
          id="sort-filter"
          value={[sort]}
          onValueChange={(values) => {
            const next = values[0];
            if (next) {
              onSortChange(next as SortOption);
            }
          }}
          variant="outline"
          spacing={0}
        >
          {SORT_OPTIONS.map((option) => (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              aria-label={`Sort by ${option.label}`}
            >
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  );
}

/**
 * File Filter Feature - Sort Select Component
 */

import type { SortOption } from '../model/types';

interface SortSelectProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as SortOption)}
      className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="date-desc">최신순</option>
      <option value="date-asc">오래된순</option>
      <option value="name-asc">이름 (A-Z)</option>
      <option value="name-desc">이름 (Z-A)</option>
      <option value="size-desc">크기 (큰순)</option>
      <option value="size-asc">크기 (작은순)</option>
    </select>
  );
}

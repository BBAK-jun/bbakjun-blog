/**
 * File Filter Feature - Category Filter Component
 */

interface CategoryFilterProps {
  value: string;
  categories: string[];
  onChange: (value: string) => void;
}

export function CategoryFilter({ value, categories, onChange }: CategoryFilterProps) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="all">모든 카테고리</option>
      {categories.map(cat => (
        <option key={cat} value={cat}>
          {cat}
        </option>
      ))}
    </select>
  );
}

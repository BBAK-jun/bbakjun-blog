/**
 * File Create Feature - Category Selector Component
 */

interface CategorySelectorProps {
  value: string;
  onChange: (value: string) => void;
  categories?: string[];
}

const DEFAULT_CATEGORIES = ["DEV", "REACT", "JS", "STUDY", "TIL", "career"];

export function CategorySelector({
  value,
  onChange,
  categories = DEFAULT_CATEGORIES,
}: CategorySelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        카테고리 *
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        required
      >
        <option value="">카테고리 선택</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
    </div>
  );
}

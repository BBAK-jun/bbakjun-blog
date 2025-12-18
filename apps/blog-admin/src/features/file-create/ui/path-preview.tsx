/**
 * File Create Feature - Path Preview Component
 */

interface PathPreviewProps {
  category: string;
  title: string;
  customSlug?: string;
}

export function PathPreview({ category, title, customSlug }: PathPreviewProps) {
  const generatePath = () => {
    if (!category) return "";

    // Use custom slug if provided, otherwise auto-generate from title
    const slug = customSlug?.trim()
      ? customSlug.trim()
      : title
          ? title
              .toLowerCase()
              .replace(/[^a-z0-9가-힣]+/g, "-")
              .replace(/^-|-$/g, "")
          : "";

    if (!slug) return "";

    return `${category}/${slug}/index.mdx`;
  };

  const path = generatePath();

  if (!path) return null;

  return (
    <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
        생성될 경로
      </p>
      <p className="text-sm font-mono text-slate-900 dark:text-white break-all">
        {path}
      </p>
      {customSlug && (
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
          커스텀 파일명 사용 중
        </p>
      )}
    </div>
  );
}

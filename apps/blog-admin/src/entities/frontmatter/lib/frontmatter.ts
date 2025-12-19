/**
 * Frontmatter utilities
 *
 * Parse and serialize YAML frontmatter in markdown files
 */

export interface FrontMatter {
  title: string;
  description: string;
  date: string;
  tags: string[];
  author: string;
  draft?: boolean;
  series?: string;
  seriesOrder?: number;
}

/**
 * Parse frontmatter from raw markdown content
 */
export function parseFrontMatter(content: string): {
  frontMatter: Partial<FrontMatter> | null;
  body: string;
} {
  const frontMatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontMatterRegex);

  if (!match) {
    return { frontMatter: null, body: content };
  }

  const frontMatterText = match[1];
  const body = match[2];

  const frontMatter: any = {};

  // Simple YAML parser
  frontMatterText.split("\n").forEach((line) => {
    const colonIndex = line.indexOf(":");
    if (colonIndex <= 0) return;

    const key = line.substring(0, colonIndex).trim();
    let value: any = line.substring(colonIndex + 1).trim();

    // Skip empty values
    if (!value) return;

    // Remove quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // Parse arrays
    if (value.startsWith("[") && value.endsWith("]")) {
      value = value
        .slice(1, -1)
        .split(",")
        .map((v: string) => v.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    }

    // Parse numbers
    if (key === "seriesOrder" && !isNaN(Number(value))) {
      value = Number(value);
    }

    // Parse booleans
    if (value === "true") value = true;
    if (value === "false") value = false;

    frontMatter[key] = value;
  });

  return { frontMatter, body };
}

/**
 * Serialize frontmatter to YAML string
 */
export function serializeFrontMatter(
  frontMatter: Partial<FrontMatter>
): string {
  const lines = Object.entries(frontMatter)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: [${value.map((v) => `"${v}"`).join(", ")}]`;
      }
      if (typeof value === "boolean") {
        return `${key}: ${value}`;
      }
      return `${key}: "${value}"`;
    });

  return lines.join("\n");
}

/**
 * Combine frontmatter and content into full markdown
 */
export function combineContent(
  frontMatter: Partial<FrontMatter>,
  content: string
): string {
  const yaml = serializeFrontMatter(frontMatter);
  return `---\n${yaml}\n---\n${content}`;
}

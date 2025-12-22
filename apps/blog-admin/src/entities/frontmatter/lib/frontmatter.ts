/**
 * Frontmatter utilities
 *
 * Parse and serialize YAML frontmatter in markdown files
 */

import matter from 'gray-matter';

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
 * Uses gray-matter for proper YAML parsing (handles multiline strings, etc.)
 */
export function parseFrontMatter(content: string): {
  frontMatter: Partial<FrontMatter> | null;
  body: string;
} {
  try {
    const { data, content: body } = matter(content);

    // gray-matter returns empty object if no frontmatter exists
    if (Object.keys(data).length === 0) {
      return { frontMatter: null, body: content };
    }

    return { frontMatter: data as Partial<FrontMatter>, body };
  } catch (error) {
    console.error('Failed to parse frontmatter:', error);
    return { frontMatter: null, body: content };
  }
}

/**
 * Serialize frontmatter to YAML string
 */
export function serializeFrontMatter(frontMatter: Partial<FrontMatter>): string {
  // Filter out undefined and null values
  const cleanedData = Object.entries(frontMatter)
    .filter(([_, value]) => value !== undefined && value !== null)
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

  // Use gray-matter's stringify for proper YAML formatting
  const result = matter.stringify('', cleanedData);

  // Extract just the YAML part (between --- markers)
  const match = result.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[1] : '';
}

/**
 * Combine frontmatter and content into full markdown
 */
export function combineContent(frontMatter: Partial<FrontMatter>, content: string): string {
  // Filter out undefined and null values
  const cleanedData = Object.entries(frontMatter)
    .filter(([_, value]) => value !== undefined && value !== null)
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

  // Use gray-matter's stringify for proper YAML formatting
  return matter.stringify(content, cleanedData);
}

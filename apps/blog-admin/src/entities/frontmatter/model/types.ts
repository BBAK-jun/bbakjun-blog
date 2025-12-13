/**
 * Frontmatter Entity Types
 */

export interface FrontMatter {
  title: string;
  description: string;
  date: string;
  tags: string[];
  author: string;
  draft?: boolean;
}

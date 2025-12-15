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

/**
 * Editor form data combining frontmatter and content
 */
export interface EditorFormData {
  title: string;
  description: string;
  date: string;
  tags: string[];
  author: string;
  draft?: boolean;
  content: string;
}

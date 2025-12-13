/**
 * Frontmatter Entity
 *
 * Public API for frontmatter domain model
 */

export type { FrontMatter, EditorFormData } from "./model/types";
export {
  parseFrontMatter,
  serializeFrontMatter,
  combineContent,
} from "./lib/frontmatter";

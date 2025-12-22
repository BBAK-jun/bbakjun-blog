// Post entity types and interfaces
import { Post } from '@repo/content';

export type { Post };

// Post metadata interface for UI components
export interface PostMetadata {
  title: string;
  date: string;
  description: string;
  tags: string[];
  author: string;
  draft?: boolean;
}

// Post card props interface
export interface PostCardProps {
  post: Post;
}

// Post content props interface
export interface PostContentProps {
  post: Post;
  content: string;
}

// Post meta props interface
export interface PostMetaProps {
  date: string;
  readingTime: string;
  tags: string[];
  author?: string;
}

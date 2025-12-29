/**
 * Blog ISR Revalidation Utility
 *
 * Triggers on-demand revalidation in the public blog app
 * when content is updated in the admin panel.
 */

import { env } from '@/shared/config';

interface RevalidateResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Revalidate a specific blog post or page
 *
 * @param path - Blog path to revalidate (e.g., "/blog/my-post")
 * @returns Success status and message
 */
export async function revalidateBlogPath(path: string): Promise<RevalidateResponse> {
  const blogUrl = env.NEXT_PUBLIC_BLOG_URL;
  const secret = env.REVALIDATION_SECRET;

  if (!blogUrl) {
    console.warn('NEXT_PUBLIC_BLOG_URL is not set. Skipping blog revalidation.');
    return {
      success: false,
      error: 'Blog URL not configured',
    };
  }

  if (!secret) {
    console.warn('REVALIDATION_SECRET is not set. Skipping blog revalidation.');
    return {
      success: false,
      error: 'Revalidation secret not configured',
    };
  }

  try {
    const url = `${blogUrl}/api/revalidate?secret=${encodeURIComponent(secret)}&path=${encodeURIComponent(path)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Revalidation failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Revalidated blog path: ${path}`, data);

    return {
      success: true,
      message: `Successfully revalidated ${path}`,
    };
  } catch (error) {
    console.error('Blog revalidation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown revalidation error',
    };
  }
}

/**
 * Revalidate all blog pages
 * Useful when making global changes
 */
export async function revalidateAllBlogPages(): Promise<RevalidateResponse> {
  const blogUrl = env.NEXT_PUBLIC_BLOG_URL;
  const secret = env.REVALIDATION_SECRET;

  if (!blogUrl || !secret) {
    console.warn('Blog URL or secret not configured. Skipping revalidation.');
    return {
      success: false,
      error: 'Blog revalidation not configured',
    };
  }

  try {
    const url = `${blogUrl}/api/revalidate?secret=${encodeURIComponent(secret)}&all=true`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Revalidation failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Revalidated all blog pages', data);

    return {
      success: true,
      message: 'Successfully revalidated all blog pages',
    };
  } catch (error) {
    console.error('Blog revalidation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown revalidation error',
    };
  }
}

/**
 * Extract slug from pathname
 * Converts "DEV/my-post/index.mdx" → "DEV/my-post"
 */
export function extractSlugFromPathname(pathname: string): string {
  return pathname
    .replace(/\/(index\.)?(md|mdx)$/, '') // Remove /index.mdx or .md/.mdx
    .replace(/\.(md|mdx)$/, ''); // Remove standalone .md/.mdx
}

/**
 * Revalidate blog post by pathname
 * Convenience function that extracts slug and revalidates
 */
export async function revalidateBlogPost(pathname: string): Promise<RevalidateResponse> {
  const slug = extractSlugFromPathname(pathname);
  const blogPath = `/blog/${slug}`;
  return revalidateBlogPath(blogPath);
}

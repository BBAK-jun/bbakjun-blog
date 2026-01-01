'use server';

import { put, del } from '@vercel/blob';
import { processMarkdown } from '@repo/content';
import { revalidatePath } from 'next/cache';
import matter from 'gray-matter';
import { createFileSchema, updateFileSchema, deleteFileSchema } from '@/shared/lib/schemas';
import { revalidateBlogPost } from '@/shared/lib/revalidate-blog';
import { getCachedBlobFiles, onBlobUpload, onBlobDelete } from '@/shared/server/blob-cdc';
import { env } from '@/shared/config';

const BLOB_TOKEN = env.BLOB_READ_WRITE_TOKEN;

/**
 * Get file content and metadata from Blob Storage
 */
export async function getFileContent(pathname: string) {
  try {
    // Use CDC cached file list instead of direct Blob API call
    const { files } = await getCachedBlobFiles();

    const blob = files.find(f => f.pathname === pathname);

    if (!blob) {
      throw new Error(`File not found in Blob Storage: ${pathname}`);
    }

    // Fetch content using the blob's URL with no-cache to ensure fresh data
    const response = await fetch(blob.url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const rawContent = await response.text();

    // Parse front matter
    const { data: frontMatter, content } = matter(rawContent);

    // Process markdown to HTML
    const htmlContent = await processMarkdown(content);

    return {
      success: true,
      rawContent,
      htmlContent,
      frontMatter: Object.keys(frontMatter).length > 0 ? frontMatter : null,
      metadata: {
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt.toISOString(),
        url: blob.url,
      },
    };
  } catch (error) {
    console.error('Get file content error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get file',
    };
  }
}

/**
 * Update file content in Blob Storage
 */
export interface UpdateFileInput {
  pathname: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  author: string;
  draft?: boolean;
  content: string;
}

export async function updateFile(input: UpdateFileInput) {
  try {
    // Validate input with Zod
    const validationResult = updateFileSchema.safeParse(input);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: firstError.message,
      };
    }

    const validatedData = validationResult.data;

    // Create frontmatter
    const frontMatter = matter.stringify('', {
      title: validatedData.title,
      date: validatedData.date,
      description: validatedData.description,
      tags: validatedData.tags,
      author: validatedData.author,
      ...(validatedData.draft !== undefined && { draft: validatedData.draft }),
    });

    // Combine frontmatter and content
    const fullContent = frontMatter + '\n' + validatedData.content;

    // Upload to Blob Storage (overwrite existing file)
    const blob = await put(validatedData.pathname, fullContent, {
      access: 'public',
      token: BLOB_TOKEN,
      contentType: 'text/markdown',
      addRandomSuffix: false, // Ensure file is overwritten, not duplicated
    });

    // CDC: DB에 파일 정보 저장
    try {
      await onBlobUpload({
        url: blob.url,
        pathname: blob.pathname,
        size: Buffer.byteLength(fullContent, 'utf8'),
        uploadedAt: new Date(),
        contentType: 'text/markdown',
      });
    } catch (cdcError) {
      console.error('CDC sync failed (non-critical):', cdcError);
    }

    // Revalidate admin file list
    revalidatePath('/dashboard/files');

    // Revalidate blog post using utility function
    await revalidateBlogPost(validatedData.pathname);

    return {
      success: true,
      message: '파일이 성공적으로 업데이트되었습니다',
    };
  } catch (error) {
    console.error('Update file error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '파일 업데이트에 실패했습니다',
    };
  }
}

/**
 * Delete file from Blob Storage
 */
export async function deleteFile(pathname: string) {
  try {
    // Validate input with Zod
    const validationResult = deleteFileSchema.safeParse({ pathname });

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: firstError.message,
      };
    }

    // First get the file URL for CDC
    const { files } = await getCachedBlobFiles({ limit: 1000 });
    const fileToDelete = files.find(f => f.pathname === validationResult.data.pathname);

    await del(validationResult.data.pathname, { token: BLOB_TOKEN });

    // CDC: DB에서 파일 삭제 표시
    if (fileToDelete) {
      try {
        await onBlobDelete(fileToDelete.pathname);
      } catch (cdcError) {
        console.error('CDC sync failed (non-critical):', cdcError);
      }
    }

    revalidatePath('/dashboard/files');

    // Revalidate blog post
    await revalidateBlogPost(validationResult.data.pathname);

    return {
      success: true,
      message: '파일이 성공적으로 삭제되었습니다',
    };
  } catch (error) {
    console.error('Delete file error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '파일 삭제에 실패했습니다',
    };
  }
}

/**
 * List all markdown files from Blob Storage with front matter metadata
 */
export async function listFiles(limit = 100) {
  try {
    // Use CDC cached file list instead of direct Blob API call
    const { files } = await getCachedBlobFiles({ limit: 1000 });

    const markdownBlobs = files
      .filter(
        blob =>
          (blob.pathname.endsWith('.md') || blob.pathname.endsWith('.mdx')) &&
          !blob.pathname.includes('/.')
      )
      .slice(0, limit);

    // Fetch front matter for each file
    const filesWithMetadata = await Promise.all(
      markdownBlobs.map(async blob => {
        try {
          // Fetch file content with no-cache to ensure fresh data
          const response = await fetch(blob.url, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
          });
          if (!response.ok) {
            throw new Error('Failed to fetch file');
          }

          const content = await response.text();
          const { data: frontMatter } = matter(content);

          return {
            filename: blob.pathname.split('/').pop() || blob.pathname,
            pathname: blob.pathname,
            size: blob.size,
            uploadedAt: new Date(blob.uploadedAt).toISOString(),
            url: blob.url,
            title: frontMatter.title || null,
            description: frontMatter.description || null,
            date: frontMatter.date || null,
          };
        } catch (error) {
          // If front matter parsing fails, return basic info
          console.error(`Failed to parse front matter for ${blob.pathname}:`, error);
          return {
            filename: blob.pathname.split('/').pop() || blob.pathname,
            pathname: blob.pathname,
            size: blob.size,
            uploadedAt: new Date(blob.uploadedAt).toISOString(),
            url: blob.url,
            title: null,
            description: null,
            date: null,
          };
        }
      })
    );

    return {
      success: true,
      files: filesWithMetadata,
      total: filesWithMetadata.length,
    };
  } catch (error) {
    console.error('List files error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list files',
      files: [],
      total: 0,
    };
  }
}

/**
 * Upload markdown file to Blob Storage
 */
export async function uploadMarkdown(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;

    if (!file) {
      return {
        success: false,
        error: 'No file provided',
      };
    }

    if (!path?.trim()) {
      return {
        success: false,
        error: 'Path is required',
      };
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_EXTENSIONS = ['.md', '.mdx'];

    const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
    if (!ALLOWED_EXTENSIONS.includes(fileExtension.toLowerCase())) {
      return {
        success: false,
        error: `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
      };
    }

    if (file.size > MAX_SIZE) {
      return {
        success: false,
        error: `File size exceeds ${MAX_SIZE / 1024 / 1024}MB limit`,
      };
    }

    // Sanitize path
    const sanitizedPath = path.trim().replace(/^\/+|\/+$/g, '');
    const pathname = `${sanitizedPath}${fileExtension}`;

    const blob = await put(pathname, file, {
      access: 'public',
      token: BLOB_TOKEN,
    });

    // CDC: DB에 파일 정보 저장
    try {
      await onBlobUpload({
        url: blob.url,
        pathname: blob.pathname,
        size: file.size,
        uploadedAt: new Date(),
        contentType: file.type,
      });
    } catch (cdcError) {
      console.error('CDC sync failed (non-critical):', cdcError);
    }

    revalidatePath('/dashboard/files');

    return {
      success: true,
      path: blob.pathname,
      url: blob.url,
      size: file.size,
    };
  } catch (error) {
    console.error('Upload markdown error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file',
    };
  }
}

/**
 * Preview markdown content as HTML
 */
export async function previewMarkdown(content: string) {
  try {
    const htmlContent = await processMarkdown(content);

    return {
      success: true,
      htmlContent,
    };
  } catch (error) {
    console.error('Preview markdown error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to preview',
      htmlContent: '',
    };
  }
}

/**
 * Upload image to Blob Storage
 *
 * 개선사항:
 * 1. crypto.randomUUID() 사용으로 고유한 파일명 보장 (동시성 문제 해결)
 * 2. Vercel Blob 업로드 재시도 로직 추가
 * 3. 구체적인 에러 메시지 제공
 * 4. 파일명 sanitization 개선
 */
export async function uploadImage(formData: FormData) {
  try {
    const file = formData.get('file') as File;

    if (!file) {
      return {
        success: false,
        error: 'No file provided',
      };
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        success: false,
        error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`,
      };
    }

    if (file.size > MAX_SIZE) {
      return {
        success: false,
        error: `File size exceeds ${MAX_SIZE / 1024 / 1024}MB limit`,
      };
    }

    // crypto.randomUUID() 사용으로 고유한 파일명 보장 (동시 업로드 시 충돌 방지)
    const uniqueId = crypto.randomUUID().split('-')[0]; // 짧은 ID 사용
    const extension = file.name.split('.').pop() || 'jpg';
    const sanitizedBaseName = file.name.replace(`.${extension}`, '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
    const pathname = `images/${Date.now()}-${uniqueId}-${sanitizedBaseName}.${extension}`;

    // Vercel Blob 업로드 재시도 로직 (최대 3회)
    let blob;
    let lastError;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[Image Upload] Attempt ${attempt}/3: ${pathname}`);
        blob = await put(pathname, file, {
          access: 'public',
          token: BLOB_TOKEN,
          addRandomSuffix: false,
        });
        break; // 성공 시 루프 탈출
      } catch (putError) {
        lastError = putError;
        console.error(`[Image Upload] Attempt ${attempt} failed:`, putError);

        if (attempt < 3) {
          // 지수 백오프 대기: 1초, 2초, 4초
          const waitTime = Math.pow(2, attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    if (!blob) {
      throw lastError || new Error('Failed to upload after 3 attempts');
    }

    console.log(`[Image Upload] Success: ${blob.url}`);

    // CDC: DB에 파일 정보 저장 (실패해도 업로드는 성공한 것으로 처리)
    try {
      await onBlobUpload({
        url: blob.url,
        pathname: blob.pathname,
        size: file.size,
        uploadedAt: new Date(),
        contentType: file.type,
      });
      console.log(`[Image Upload] CDC sync completed: ${blob.pathname}`);
    } catch (cdcError) {
      console.error('[Image Upload] CDC sync failed (non-critical):', cdcError);
      // CDC 실패는 업로드 실패로 처리하지 않음 (Blob Storage가 source of truth)
    }

    return {
      success: true,
      url: blob.url,
      pathname: blob.pathname,
      size: file.size,
      contentType: file.type,
    };
  } catch (error) {
    console.error('[Image Upload] Final error:', error);

    // 구체적인 에러 메시지 제공
    let errorMessage = 'Failed to upload image';

    if (error instanceof Error) {
      if (error.message.includes('ECONNRESET') || error.message.includes('ETIMEDOUT')) {
        errorMessage = '네트워크 연결이 불안정합니다. 다시 시도해 주세요.';
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        errorMessage = 'Blob Storage 용량 한도에 도달했습니다.';
      } else if (error.message.includes('auth') || error.message.includes('token')) {
        errorMessage = '인증 오류가 발생했습니다. 관리자에게 문의해 주세요.';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Upload multiple images to Blob Storage
 *
 * 여러 이미지를 병렬로 업로드합니다.
 * 각 파일은 독립적으로 처리되며, 개별 실패시 전체 작업이 계속 진행됩니다.
 */
export async function uploadMultipleImages(formData: FormData) {
  try {
    const files: File[] = [];
    const pathname = formData.get('pathname') as string | null;

    // FormData에서 모든 파일 추출
    for (const [key, value] of formData.entries()) {
      if (key === 'files' && value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return {
        success: false,
        error: 'No files provided',
      };
    }

    const MAX_FILES = 20;

    if (files.length > MAX_FILES) {
      return {
        success: false,
        error: `Too many files. Maximum ${MAX_FILES} files allowed`,
      };
    }

    // 각 파일 개별 업로드
    const uploadPromises = files.map(async file => {
      try {
        const singleFormData = new FormData();
        singleFormData.append('file', file);
        if (pathname) {
          singleFormData.append('pathname', pathname);
        }

        const result = await uploadImage(singleFormData);

        return {
          ...result,
          filename: file.name,
        };
      } catch (error) {
        return {
          success: false,
          filename: file.name,
          error: error instanceof Error ? error.message : 'Failed to upload file',
        };
      }
    });

    const results = await Promise.all(uploadPromises);

    const uploaded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return {
      success: uploaded > 0,
      results,
      total: files.length,
      uploaded,
      failed,
    };
  } catch (error) {
    console.error('[Multiple Image Upload] Final error:', error);

    let errorMessage = 'Failed to upload images';

    if (error instanceof Error) {
      if (error.message.includes('ECONNRESET') || error.message.includes('ETIMEDOUT')) {
        errorMessage = '네트워크 연결이 불안정합니다. 다시 시도해 주세요.';
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        errorMessage = 'Blob Storage 용량 한도에 도달했습니다.';
      } else if (error.message.includes('auth') || error.message.includes('token')) {
        errorMessage = '인증 오류가 발생했습니다. 관리자에게 문의해 주세요.';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * List all images from Blob Storage
 */
export async function listImages(limit = 50) {
  try {
    // Use CDC cached file list instead of direct Blob API call
    const { files } = await getCachedBlobFiles({
      limit: 1000,
      searchTerm: 'images/',
    });

    const images = files
      .filter(blob => /\.(jpg|jpeg|png|gif|webp)$/i.test(blob.pathname))
      .slice(0, limit)
      .map(blob => ({
        url: blob.url,
        pathname: blob.pathname,
        filename: blob.pathname.split('/').pop() || blob.pathname,
        size: blob.size,
        uploadedAt: new Date(blob.uploadedAt).toISOString(),
      }));

    return {
      success: true,
      images,
      total: images.length,
    };
  } catch (error) {
    console.error('List images error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list images',
      images: [],
      total: 0,
    };
  }
}

/**
 * Create new markdown file in Blob Storage
 */
export interface CreateFileInput {
  pathname: string; // e.g., "DEV/my-post"
  title: string;
  description: string;
  date: string;
  tags: string[];
  author: string;
  draft?: boolean;
  content: string;
}

export async function createFile(input: CreateFileInput) {
  try {
    // Validate input with Zod
    const validationResult = createFileSchema.safeParse(input);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: firstError.message,
      };
    }

    const validatedData = validationResult.data;

    // Sanitize pathname
    const sanitized = validatedData.pathname.trim().replace(/^\/+|\/+$/g, '');
    const finalPathname = `${sanitized}/index.mdx`;

    // Check if file already exists using CDC cache
    const { files } = await getCachedBlobFiles({ limit: 1000 });
    const existingFile = files.find(f => f.pathname === finalPathname);

    if (existingFile) {
      return {
        success: false,
        error: `파일이 이미 존재합니다: ${finalPathname}`,
      };
    }

    // Create frontmatter
    const frontMatter = matter.stringify('', {
      title: validatedData.title,
      date: validatedData.date,
      description: validatedData.description,
      tags: validatedData.tags,
      author: validatedData.author,
      ...(validatedData.draft !== undefined && { draft: validatedData.draft }),
    });

    // Combine frontmatter and content
    const fullContent = frontMatter + '\n' + validatedData.content;

    // Upload to Blob Storage
    const blob = await put(finalPathname, fullContent, {
      access: 'public',
      token: BLOB_TOKEN,
      contentType: 'text/markdown',
    });

    // CDC: DB에 파일 정보 저장
    try {
      await onBlobUpload({
        url: blob.url,
        pathname: blob.pathname,
        size: Buffer.byteLength(fullContent, 'utf8'),
        uploadedAt: new Date(),
        contentType: 'text/markdown',
      });
    } catch (cdcError) {
      console.error('CDC sync failed (non-critical):', cdcError);
    }

    // Revalidate cache
    revalidatePath('/dashboard/files');

    // Revalidate blog post
    await revalidateBlogPost(blob.pathname);

    return {
      success: true,
      pathname: blob.pathname,
      url: blob.url,
    };
  } catch (error) {
    console.error('Create file error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '파일 생성에 실패했습니다',
    };
  }
}

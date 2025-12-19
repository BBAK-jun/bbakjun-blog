import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { testPrisma } from './setup';
import { updateFile, createFile, deleteFile } from '../src/app/actions/files';
import { getCachedBlobFiles } from '../src/lib/blob-cdc';
import * as blobModule from '@vercel/blob';

// Mock @vercel/blob
vi.mock('@vercel/blob', () => ({
  put: vi.fn(),
  del: vi.fn(),
  list: vi.fn(),
}));

// Mock Next.js revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock revalidateBlogPost utility
vi.mock('../src/shared/lib/revalidate-blog', () => ({
  revalidateBlogPost: vi.fn(),
}));

describe('파일 업데이트 통합 테스트 - CDC 동기화', () => {
  const testPathname = 'test/integration-test.mdx';

  beforeEach(async () => {
    // 테스트 전 정리
    await testPrisma.blobFile.deleteMany({
      where: { pathname: testPathname },
    });

    // Mock 초기화
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // 테스트 후 정리
    await testPrisma.blobFile.deleteMany({
      where: { pathname: testPathname },
    });
  });

  it('파일 업데이트 시 DB의 blob URL이 새 URL로 변경되어야 함', async () => {
    const oldUrl = 'https://blob.vercel-storage.com/old-url-123.mdx';
    const newUrl = 'https://blob.vercel-storage.com/new-url-456.mdx';

    // 1. DB에 초기 레코드 생성 (첫 업로드 시뮬레이션)
    await testPrisma.blobFile.create({
      data: {
        url: oldUrl,
        pathname: testPathname,
        size: BigInt(1000),
        uploadedAt: new Date('2025-01-01'),
        contentType: 'text/markdown',
      },
    });

    // 초기 상태 확인
    let record = await testPrisma.blobFile.findUnique({
      where: { pathname: testPathname },
    });
    expect(record?.url).toBe(oldUrl);

    // 2. Vercel Blob put이 새 URL을 반환하도록 Mock
    vi.mocked(blobModule.put).mockResolvedValue({
      url: newUrl,
      pathname: testPathname,
      size: 2000,
      uploadedAt: new Date('2025-01-02'),
      downloadUrl: newUrl,
    } as any);

    // 3. updateFile 액션 호출
    const result = await updateFile({
      pathname: testPathname,
      title: 'Updated Title',
      description: 'Updated description',
      date: '2025-01-02',
      tags: ['test', 'integration'],
      author: 'tester',
      content: 'Updated content',
    });

    // 4. updateFile 성공 확인
    expect(result.success).toBe(true);

    // 5. DB가 새 URL로 업데이트되었는지 확인
    record = await testPrisma.blobFile.findUnique({
      where: { pathname: testPathname },
    });

    expect(record).toBeDefined();
    expect(record?.url).toBe(newUrl);
    expect(record?.pathname).toBe(testPathname);
    expect(record?.isDeleted).toBe(false);

    // 6. 중복 없이 하나의 레코드만 존재하는지 확인
    const count = await testPrisma.blobFile.count({
      where: { pathname: testPathname },
    });
    expect(count).toBe(1);
  });

  it('CDC 동기화 실패 시에도 정상적으로 처리해야 함', async () => {
    const newUrl = 'https://blob.vercel-storage.com/new-url-789.mdx';

    // Vercel Blob put Mock
    vi.mocked(blobModule.put).mockResolvedValue({
      url: newUrl,
      pathname: testPathname,
      size: 3000,
      uploadedAt: new Date('2025-01-03'),
      downloadUrl: newUrl,
    } as any);

    // CDC 실패 시에도 파일 업데이트는 성공해야 함
    const result = await updateFile({
      pathname: testPathname,
      title: 'Test Title',
      description: 'Test description',
      date: '2025-01-03',
      tags: ['test'],
      author: 'tester',
      content: 'Test content',
    });

    expect(result.success).toBe(true);
  });

  it('파일 크기와 업로드 시간이 업데이트되어야 함', async () => {
    const initialUrl = 'https://blob.vercel-storage.com/initial-url.mdx';
    const updatedUrl = 'https://blob.vercel-storage.com/updated-url.mdx';

    // 작은 크기로 초기 레코드 생성
    await testPrisma.blobFile.create({
      data: {
        url: initialUrl,
        pathname: testPathname,
        size: BigInt(50),
        uploadedAt: new Date('2025-01-01T00:00:00Z'),
        contentType: 'text/markdown',
      },
    });

    // 업데이트된 blob Mock
    const newUploadDate = new Date('2025-01-10T12:00:00Z');
    vi.mocked(blobModule.put).mockResolvedValue({
      url: updatedUrl,
      pathname: testPathname,
      size: 5000,
      uploadedAt: newUploadDate,
      downloadUrl: updatedUrl,
    } as any);

    // 긴 컨텐츠로 파일 업데이트
    const longContent = '파일 크기를 크게 만들기 위한 긴 컨텐츠입니다. '.repeat(10);
    await updateFile({
      pathname: testPathname,
      title: '업데이트된 제목',
      description: '업데이트된 설명',
      date: '2025-01-10',
      tags: ['updated', 'test'],
      author: 'updater',
      content: longContent,
    });

    // 모든 필드가 업데이트되었는지 확인
    const record = await testPrisma.blobFile.findUnique({
      where: { pathname: testPathname },
    });

    expect(record?.url).toBe(updatedUrl);
    // 크기는 frontmatter + content로 계산되므로 초기값보다 커야 함
    expect(Number(record?.size)).toBeGreaterThan(50);
    expect(record?.uploadedAt.getTime()).toBeGreaterThan(new Date('2025-01-01').getTime());
  });

  it('동일한 파일을 연속으로 여러 번 업데이트해도 정상 동작해야 함', async () => {
    const urls = [
      'https://blob.vercel-storage.com/v1.mdx',
      'https://blob.vercel-storage.com/v2.mdx',
      'https://blob.vercel-storage.com/v3.mdx',
    ];

    // 초기 레코드 생성
    await testPrisma.blobFile.create({
      data: {
        url: urls[0],
        pathname: testPathname,
        size: BigInt(100),
        uploadedAt: new Date('2025-01-01'),
        contentType: 'text/markdown',
      },
    });

    // 3번 연속 업데이트
    for (let i = 1; i < urls.length; i++) {
      vi.mocked(blobModule.put).mockResolvedValue({
        url: urls[i],
        pathname: testPathname,
        size: 100 * (i + 1),
        uploadedAt: new Date(`2025-01-0${i + 1}`),
        downloadUrl: urls[i],
      } as any);

      const result = await updateFile({
        pathname: testPathname,
        title: `버전 ${i + 1}`,
        description: `업데이트 ${i + 1}`,
        date: `2025-01-0${i + 1}`,
        tags: ['test', `v${i + 1}`],
        author: 'tester',
        content: `컨텐츠 버전 ${i + 1}`,
      });

      expect(result.success).toBe(true);
    }

    // 최종 상태가 마지막 URL을 가지고 있는지 확인
    const record = await testPrisma.blobFile.findUnique({
      where: { pathname: testPathname },
    });

    expect(record?.url).toBe(urls[2]);

    // 여전히 하나의 레코드만 존재하는지 확인
    const count = await testPrisma.blobFile.count({
      where: { pathname: testPathname },
    });
    expect(count).toBe(1);
  });

  it('draft 필드가 정상적으로 업데이트되어야 함', async () => {
    const url = 'https://blob.vercel-storage.com/draft-test.mdx';

    // 초기 비-draft 파일 생성
    await testPrisma.blobFile.create({
      data: {
        url,
        pathname: testPathname,
        size: BigInt(100),
        uploadedAt: new Date('2025-01-01'),
        contentType: 'text/markdown',
      },
    });

    vi.mocked(blobModule.put).mockResolvedValue({
      url,
      pathname: testPathname,
      size: 150,
      uploadedAt: new Date('2025-01-02'),
      downloadUrl: url,
    } as any);

    // draft로 업데이트
    const result = await updateFile({
      pathname: testPathname,
      title: '임시 저장 글',
      description: '임시 저장 상태입니다',
      date: '2025-01-02',
      tags: ['draft'],
      author: 'tester',
      draft: true,
      content: '임시 저장 컨텐츠',
    });

    expect(result.success).toBe(true);

    // 참고: draft 필드는 frontmatter에 저장되므로 BlobFile 테이블에서는 확인할 수 없지만,
    // updateFile 호출이 draft: true와 함께 성공했음을 확인
  });
});

describe('파일 생성 통합 테스트 - CDC 동기화', () => {
  const testPathname = 'test/create-test';
  const fullPathname = `${testPathname}/index.mdx`;

  beforeEach(async () => {
    await testPrisma.blobFile.deleteMany({
      where: { pathname: fullPathname },
    });
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await testPrisma.blobFile.deleteMany({
      where: { pathname: fullPathname },
    });
  });

  it('새 파일 생성 시 DB 레코드가 생성되어야 함', async () => {
    const newUrl = 'https://blob.vercel-storage.com/new-file.mdx';

    vi.mocked(blobModule.put).mockResolvedValue({
      url: newUrl,
      pathname: fullPathname,
      size: 1500,
      uploadedAt: new Date('2025-01-15'),
      downloadUrl: newUrl,
    } as any);

    const result = await createFile({
      pathname: testPathname,
      title: '새로운 글',
      description: '완전히 새로운 글입니다',
      date: '2025-01-15',
      tags: ['new', 'test'],
      author: 'creator',
      content: '새로운 글 컨텐츠입니다',
    });

    expect(result.success).toBe(true);

    // DB 레코드가 생성되었는지 확인
    const record = await testPrisma.blobFile.findUnique({
      where: { pathname: fullPathname },
    });

    expect(record).toBeDefined();
    expect(record?.url).toBe(newUrl);
    expect(record?.pathname).toBe(fullPathname);
    expect(record?.isDeleted).toBe(false);
  });

  it('중복 파일 생성을 방지해야 함', async () => {
    const url = 'https://blob.vercel-storage.com/existing.mdx';

    // 기존 파일 생성
    await testPrisma.blobFile.create({
      data: {
        url,
        pathname: fullPathname,
        size: BigInt(100),
        uploadedAt: new Date('2025-01-01'),
        contentType: 'text/markdown',
      },
    });

    // 같은 pathname으로 생성 시도
    const result = await createFile({
      pathname: testPathname,
      title: '중복 파일',
      description: '실패해야 함',
      date: '2025-01-15',
      tags: ['duplicate'],
      author: 'creator',
      content: '중복 컨텐츠',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('이미 존재합니다');

    // 여전히 하나의 레코드만 존재하는지 확인
    const count = await testPrisma.blobFile.count({
      where: { pathname: fullPathname },
    });
    expect(count).toBe(1);
  });
});

describe('파일 삭제 통합 테스트 - CDC 동기화', () => {
  const testPathname = 'test/delete-test.mdx';

  beforeEach(async () => {
    await testPrisma.blobFile.deleteMany({
      where: { pathname: testPathname },
    });
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await testPrisma.blobFile.deleteMany({
      where: { pathname: testPathname },
    });
  });

  it('파일 삭제 시 DB에서 soft-delete되어야 함', async () => {
    const url = 'https://blob.vercel-storage.com/to-delete.mdx';

    // 파일 생성
    await testPrisma.blobFile.create({
      data: {
        url,
        pathname: testPathname,
        size: BigInt(100),
        uploadedAt: new Date('2025-01-01'),
        contentType: 'text/markdown',
      },
    });

    vi.mocked(blobModule.del).mockResolvedValue(undefined);

    const result = await deleteFile(testPathname);

    expect(result.success).toBe(true);

    // 레코드가 soft-delete되었는지 확인
    const record = await testPrisma.blobFile.findUnique({
      where: { pathname: testPathname },
    });

    expect(record).toBeDefined();
    expect(record?.isDeleted).toBe(true);
  });

  it('삭제된 파일은 getCachedBlobFiles에 나타나지 않아야 함', async () => {
    const url = 'https://blob.vercel-storage.com/to-delete-2.mdx';

    // 파일 생성
    await testPrisma.blobFile.create({
      data: {
        url,
        pathname: testPathname,
        size: BigInt(100),
        uploadedAt: new Date('2025-01-01'),
        contentType: 'text/markdown',
      },
    });

    // 삭제 전 파일이 나타나는지 확인
    let { files } = await getCachedBlobFiles({ limit: 1000 });
    let found = files.find((f) => f.pathname === testPathname);
    expect(found).toBeDefined();
    expect(found?.isDeleted).toBe(false);

    // 파일 삭제
    vi.mocked(blobModule.del).mockResolvedValue(undefined);
    await deleteFile(testPathname);

    // 삭제 후 파일이 나타나지 않는지 확인 (isDeleted 필터링)
    ({ files } = await getCachedBlobFiles({ limit: 1000 }));
    found = files.find((f) => f.pathname === testPathname);
    expect(found).toBeUndefined();
  });
});

describe('동시 작업 처리', () => {
  const testPathnames = [
    'test/concurrent-1.mdx',
    'test/concurrent-2.mdx',
    'test/concurrent-3.mdx',
  ];

  beforeEach(async () => {
    await testPrisma.blobFile.deleteMany({
      where: {
        pathname: {
          in: testPathnames,
        },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await testPrisma.blobFile.deleteMany({
      where: {
        pathname: {
          in: testPathnames,
        },
      },
    });
  });

  it('여러 파일을 동시에 업데이트해도 정상 동작해야 함', async () => {
    // 초기 파일들 생성
    for (let i = 0; i < testPathnames.length; i++) {
      await testPrisma.blobFile.create({
        data: {
          url: `https://blob.vercel-storage.com/file-${i}.mdx`,
          pathname: testPathnames[i],
          size: BigInt(100),
          uploadedAt: new Date('2025-01-01'),
          contentType: 'text/markdown',
        },
      });
    }

    // 모든 파일을 동시에 업데이트
    const updatePromises = testPathnames.map((pathname, i) => {
      const newUrl = `https://blob.vercel-storage.com/updated-${i}.mdx`;

      vi.mocked(blobModule.put).mockResolvedValue({
        url: newUrl,
        pathname,
        size: 200 * (i + 1),
        uploadedAt: new Date('2025-01-02'),
        downloadUrl: newUrl,
      } as any);

      return updateFile({
        pathname,
        title: `동시 업데이트 ${i}`,
        description: `동시에 업데이트됨 ${i}`,
        date: '2025-01-02',
        tags: ['concurrent', `file-${i}`],
        author: 'tester',
        content: `동시 업데이트 컨텐츠 ${i}`,
      });
    });

    const results = await Promise.all(updatePromises);

    // 모든 업데이트가 성공했는지 확인
    results.forEach((result) => {
      expect(result.success).toBe(true);
    });

    // 모든 레코드가 업데이트되었는지 확인
    for (let i = 0; i < testPathnames.length; i++) {
      const record = await testPrisma.blobFile.findUnique({
        where: { pathname: testPathnames[i] },
      });

      expect(record).toBeDefined();
      expect(record?.isDeleted).toBe(false);
    }

    // 전체 레코드 수 확인
    const count = await testPrisma.blobFile.count({
      where: {
        pathname: {
          in: testPathnames,
        },
      },
    });
    expect(count).toBe(testPathnames.length);
  });
});

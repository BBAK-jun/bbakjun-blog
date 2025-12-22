import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { testPrisma } from './setup';
import { onBlobUpload, onBlobDelete } from '../src/shared/server/blob-cdc';

describe('Blob CDC - Pathname 고유 제약조건', () => {
  const testPathname = 'test/cdc-test.mdx';

  beforeEach(async () => {
    // 테스트 전 정리
    await testPrisma.blobFile.deleteMany({
      where: { pathname: testPathname },
    });
  });

  afterEach(async () => {
    // 테스트 후 정리
    await testPrisma.blobFile.deleteMany({
      where: { pathname: testPathname },
    });
  });

  describe('onBlobUpload', () => {
    it('첫 업로드 시 새 레코드가 생성되어야 함', async () => {
      await onBlobUpload({
        url: 'https://example.com/file1.mdx',
        pathname: testPathname,
        size: 1000,
        uploadedAt: new Date('2025-01-01'),
        contentType: 'text/markdown',
      });

      const record = await testPrisma.blobFile.findUnique({
        where: { pathname: testPathname },
      });

      expect(record).toBeDefined();
      expect(record?.url).toBe('https://example.com/file1.mdx');
      expect(record?.pathname).toBe(testPathname);
      expect(record?.size).toBe(BigInt(1000));
      expect(record?.isDeleted).toBe(false);
    });

    it('재업로드 시 기존 레코드가 업데이트되어야 함 (같은 pathname, 다른 URL)', async () => {
      // 첫 번째 업로드
      await onBlobUpload({
        url: 'https://example.com/file1.mdx',
        pathname: testPathname,
        size: 1000,
        uploadedAt: new Date('2025-01-01'),
        contentType: 'text/markdown',
      });

      // 같은 pathname으로 두 번째 업로드 (다른 URL)
      await onBlobUpload({
        url: 'https://example.com/file2.mdx', // 다른 URL
        pathname: testPathname, // 같은 pathname
        size: 2000,
        uploadedAt: new Date('2025-01-02'),
        contentType: 'text/markdown',
      });

      // 하나의 레코드만 존재해야 함
      const count = await testPrisma.blobFile.count({
        where: { pathname: testPathname },
      });
      expect(count).toBe(1);

      // 업데이트된 값을 가지고 있어야 함
      const record = await testPrisma.blobFile.findUnique({
        where: { pathname: testPathname },
      });

      expect(record?.url).toBe('https://example.com/file2.mdx');
      expect(record?.size).toBe(BigInt(2000));
      expect(record?.isDeleted).toBe(false);
    });

    it('재업로드 시 soft-delete된 파일이 복원되어야 함', async () => {
      // 파일 생성 후 삭제
      await onBlobUpload({
        url: 'https://example.com/file1.mdx',
        pathname: testPathname,
        size: 1000,
        uploadedAt: new Date('2025-01-01'),
        contentType: 'text/markdown',
      });

      await onBlobDelete(testPathname);

      let record = await testPrisma.blobFile.findUnique({
        where: { pathname: testPathname },
      });
      expect(record?.isDeleted).toBe(true);

      // 재업로드 시 파일이 복원되어야 함
      await onBlobUpload({
        url: 'https://example.com/file2.mdx',
        pathname: testPathname,
        size: 2000,
        uploadedAt: new Date('2025-01-02'),
        contentType: 'text/markdown',
      });

      record = await testPrisma.blobFile.findUnique({
        where: { pathname: testPathname },
      });

      expect(record?.isDeleted).toBe(false);
      expect(record?.url).toBe('https://example.com/file2.mdx');
    });

    it('같은 pathname으로 여러 번 업로드해도 중복 레코드가 생성되지 않아야 함', async () => {
      // 같은 pathname으로 여러 번 업로드
      for (let i = 0; i < 5; i++) {
        await onBlobUpload({
          url: `https://example.com/file${i}.mdx`,
          pathname: testPathname,
          size: 1000 * (i + 1),
          uploadedAt: new Date(`2025-01-0${i + 1}`),
          contentType: 'text/markdown',
        });
      }

      // 하나의 레코드만 존재해야 함
      const count = await testPrisma.blobFile.count({
        where: { pathname: testPathname },
      });

      expect(count).toBe(1);

      // 마지막에 업로드한 값을 가지고 있어야 함
      const record = await testPrisma.blobFile.findUnique({
        where: { pathname: testPathname },
      });

      expect(record?.url).toBe('https://example.com/file4.mdx');
      expect(record?.size).toBe(BigInt(5000));
    });

    it('재업로드 시 lastChecked 타임스탬프가 업데이트되어야 함', async () => {
      await onBlobUpload({
        url: 'https://example.com/file1.mdx',
        pathname: testPathname,
        size: 1000,
        uploadedAt: new Date('2025-01-01'),
        contentType: 'text/markdown',
      });

      const firstRecord = await testPrisma.blobFile.findUnique({
        where: { pathname: testPathname },
      });

      // 타임스탬프 차이를 위해 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 100));

      await onBlobUpload({
        url: 'https://example.com/file2.mdx',
        pathname: testPathname,
        size: 2000,
        uploadedAt: new Date('2025-01-02'),
        contentType: 'text/markdown',
      });

      const secondRecord = await testPrisma.blobFile.findUnique({
        where: { pathname: testPathname },
      });

      expect(secondRecord?.lastChecked.getTime()).toBeGreaterThan(
        firstRecord?.lastChecked.getTime() || 0
      );
    });
  });

  describe('onBlobDelete', () => {
    it('파일 삭제 시 soft-delete로 표시되어야 함', async () => {
      // 파일 생성
      await onBlobUpload({
        url: 'https://example.com/file1.mdx',
        pathname: testPathname,
        size: 1000,
        uploadedAt: new Date('2025-01-01'),
        contentType: 'text/markdown',
      });

      // 파일 삭제
      await onBlobDelete(testPathname);

      // 레코드는 여전히 존재하지만 삭제로 표시되어야 함
      const record = await testPrisma.blobFile.findUnique({
        where: { pathname: testPathname },
      });

      expect(record).toBeDefined();
      expect(record?.isDeleted).toBe(true);
    });

    it('삭제 시 lastChecked 타임스탬프가 업데이트되어야 함', async () => {
      await onBlobUpload({
        url: 'https://example.com/file1.mdx',
        pathname: testPathname,
        size: 1000,
        uploadedAt: new Date('2025-01-01'),
        contentType: 'text/markdown',
      });

      const beforeDelete = await testPrisma.blobFile.findUnique({
        where: { pathname: testPathname },
      });

      // 타임스탬프 차이를 위해 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 100));

      await onBlobDelete(testPathname);

      const afterDelete = await testPrisma.blobFile.findUnique({
        where: { pathname: testPathname },
      });

      expect(afterDelete?.lastChecked.getTime()).toBeGreaterThan(
        beforeDelete?.lastChecked.getTime() || 0
      );
    });

    it('존재하지 않는 pathname 삭제 시 에러가 발생해야 함', async () => {
      await expect(onBlobDelete('test/nonexistent.mdx')).rejects.toThrow();
    });
  });

  describe('Pathname 고유 제약조건 (데이터베이스 레벨)', () => {
    it('데이터베이스 레벨에서 고유 제약조건이 강제되어야 함', async () => {
      // Prisma를 통해 같은 pathname으로 두 개의 레코드 생성 시도
      await testPrisma.blobFile.create({
        data: {
          url: 'https://example.com/file1.mdx',
          pathname: testPathname,
          size: BigInt(1000),
          uploadedAt: new Date('2025-01-01'),
          contentType: 'text/markdown',
        },
      });

      // 같은 pathname으로 두 번째 삽입은 실패해야 함
      await expect(
        testPrisma.blobFile.create({
          data: {
            url: 'https://example.com/file2.mdx',
            pathname: testPathname, // 같은 pathname
            size: BigInt(2000),
            uploadedAt: new Date('2025-01-02'),
            contentType: 'text/markdown',
          },
        })
      ).rejects.toThrow(/Unique constraint failed/);
    });

    it('다른 pathname을 가진 파일들은 허용되어야 함', async () => {
      await onBlobUpload({
        url: 'https://example.com/file1.mdx',
        pathname: 'test/file1.mdx',
        size: 1000,
        uploadedAt: new Date('2025-01-01'),
        contentType: 'text/markdown',
      });

      await onBlobUpload({
        url: 'https://example.com/file2.mdx',
        pathname: 'test/file2.mdx',
        size: 2000,
        uploadedAt: new Date('2025-01-02'),
        contentType: 'text/markdown',
      });

      const count = await testPrisma.blobFile.count({
        where: {
          pathname: {
            startsWith: 'test/',
          },
        },
      });

      expect(count).toBeGreaterThanOrEqual(2);
    });
  });
});

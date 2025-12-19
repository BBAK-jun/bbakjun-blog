import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { testPrisma } from './setup';
import { onBlobUpload, onBlobDelete } from '../src/lib/blob-cdc';

describe('Blob CDC - Pathname Unique Constraint', () => {
  const testPathname = 'test/cdc-test.mdx';

  beforeEach(async () => {
    // Clean up before each test
    await testPrisma.blobFile.deleteMany({
      where: { pathname: testPathname },
    });
  });

  afterEach(async () => {
    // Clean up after each test
    await testPrisma.blobFile.deleteMany({
      where: { pathname: testPathname },
    });
  });

  describe('onBlobUpload', () => {
    it('should create a new record on first upload', async () => {
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

    it('should update existing record on re-upload (same pathname, different URL)', async () => {
      // First upload
      await onBlobUpload({
        url: 'https://example.com/file1.mdx',
        pathname: testPathname,
        size: 1000,
        uploadedAt: new Date('2025-01-01'),
        contentType: 'text/markdown',
      });

      // Second upload with same pathname but different URL
      await onBlobUpload({
        url: 'https://example.com/file2.mdx', // Different URL
        pathname: testPathname,                // Same pathname
        size: 2000,
        uploadedAt: new Date('2025-01-02'),
        contentType: 'text/markdown',
      });

      // Should only have one record
      const count = await testPrisma.blobFile.count({
        where: { pathname: testPathname },
      });
      expect(count).toBe(1);

      // Should have updated values
      const record = await testPrisma.blobFile.findUnique({
        where: { pathname: testPathname },
      });

      expect(record?.url).toBe('https://example.com/file2.mdx');
      expect(record?.size).toBe(BigInt(2000));
      expect(record?.isDeleted).toBe(false);
    });

    it('should restore soft-deleted file on re-upload', async () => {
      // Create and delete a file
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

      // Re-upload should restore the file
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

    it('should prevent duplicate records for same pathname', async () => {
      // Upload multiple times with same pathname
      for (let i = 0; i < 5; i++) {
        await onBlobUpload({
          url: `https://example.com/file${i}.mdx`,
          pathname: testPathname,
          size: 1000 * (i + 1),
          uploadedAt: new Date(`2025-01-0${i + 1}`),
          contentType: 'text/markdown',
        });
      }

      // Should only have one record
      const count = await testPrisma.blobFile.count({
        where: { pathname: testPathname },
      });

      expect(count).toBe(1);

      // Should have the last uploaded values
      const record = await testPrisma.blobFile.findUnique({
        where: { pathname: testPathname },
      });

      expect(record?.url).toBe('https://example.com/file4.mdx');
      expect(record?.size).toBe(BigInt(5000));
    });

    it('should update lastChecked timestamp on re-upload', async () => {
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

      // Wait a bit to ensure timestamp difference
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
    it('should mark file as deleted (soft delete)', async () => {
      // Create a file
      await onBlobUpload({
        url: 'https://example.com/file1.mdx',
        pathname: testPathname,
        size: 1000,
        uploadedAt: new Date('2025-01-01'),
        contentType: 'text/markdown',
      });

      // Delete the file
      await onBlobDelete(testPathname);

      // Record should still exist but marked as deleted
      const record = await testPrisma.blobFile.findUnique({
        where: { pathname: testPathname },
      });

      expect(record).toBeDefined();
      expect(record?.isDeleted).toBe(true);
    });

    it('should update lastChecked timestamp on delete', async () => {
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

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      await onBlobDelete(testPathname);

      const afterDelete = await testPrisma.blobFile.findUnique({
        where: { pathname: testPathname },
      });

      expect(afterDelete?.lastChecked.getTime()).toBeGreaterThan(
        beforeDelete?.lastChecked.getTime() || 0
      );
    });

    it('should throw error if pathname does not exist', async () => {
      await expect(
        onBlobDelete('test/nonexistent.mdx')
      ).rejects.toThrow();
    });
  });

  describe('Pathname Unique Constraint (Database Level)', () => {
    it('should enforce unique constraint at database level', async () => {
      // Try to create two records with same pathname directly via Prisma
      await testPrisma.blobFile.create({
        data: {
          url: 'https://example.com/file1.mdx',
          pathname: testPathname,
          size: BigInt(1000),
          uploadedAt: new Date('2025-01-01'),
          contentType: 'text/markdown',
        },
      });

      // Second insert with same pathname should fail
      await expect(
        testPrisma.blobFile.create({
          data: {
            url: 'https://example.com/file2.mdx',
            pathname: testPathname, // Same pathname
            size: BigInt(2000),
            uploadedAt: new Date('2025-01-02'),
            contentType: 'text/markdown',
          },
        })
      ).rejects.toThrow(/Unique constraint failed/);
    });

    it('should allow different files with different pathnames', async () => {
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

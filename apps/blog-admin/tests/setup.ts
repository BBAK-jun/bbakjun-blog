import { beforeAll, afterAll, vi } from 'vitest';
import './vitest.env';

type BlobFileRecord = {
  url: string;
  pathname: string;
  size: bigint;
  uploadedAt: Date;
  contentType?: string | null;
  uploadedBy?: string | null;
  isDeleted: boolean;
  lastChecked: Date;
};

const blobFiles = new Map<string, BlobFileRecord>();

function cloneRecord(record: BlobFileRecord): BlobFileRecord {
  return {
    ...record,
    uploadedAt: new Date(record.uploadedAt),
    lastChecked: new Date(record.lastChecked),
  };
}

function matchesWhere(record: BlobFileRecord, where?: any): boolean {
  if (!where) return true;

  if (where.pathname !== undefined) {
    if (typeof where.pathname === 'string') {
      if (record.pathname !== where.pathname) return false;
    } else {
      if (where.pathname.startsWith && !record.pathname.startsWith(where.pathname.startsWith)) return false;
      if (where.pathname.in && !where.pathname.in.includes(record.pathname)) return false;
      if (where.pathname.contains) {
        const haystack = where.pathname.mode === 'insensitive' ? record.pathname.toLowerCase() : record.pathname;
        const needle = where.pathname.mode === 'insensitive' ? where.pathname.contains.toLowerCase() : where.pathname.contains;
        if (!haystack.includes(needle)) return false;
      }
    }
  }

  if (where.url !== undefined) {
    if (typeof where.url === 'string') {
      if (record.url !== where.url) return false;
    } else if (where.url.in && !where.url.in.includes(record.url)) {
      return false;
    }
  }

  if (where.isDeleted !== undefined && record.isDeleted !== where.isDeleted) return false;

  return true;
}

function normalizeBlobFile(data: any): BlobFileRecord {
  const now = new Date();
  return {
    url: data.url,
    pathname: data.pathname,
    size: typeof data.size === 'bigint' ? data.size : BigInt(data.size ?? 0),
    uploadedAt: data.uploadedAt ? new Date(data.uploadedAt) : now,
    contentType: data.contentType ?? null,
    uploadedBy: data.uploadedBy ?? null,
    isDeleted: data.isDeleted ?? false,
    lastChecked: data.lastChecked ? new Date(data.lastChecked) : now,
  };
}

function applyUpdate(record: BlobFileRecord, data: any): BlobFileRecord {
  return {
    ...record,
    ...data,
    size: data.size !== undefined ? (typeof data.size === 'bigint' ? data.size : BigInt(data.size)) : record.size,
    uploadedAt: data.uploadedAt !== undefined ? new Date(data.uploadedAt) : record.uploadedAt,
    lastChecked: data.lastChecked !== undefined ? new Date(data.lastChecked) : record.lastChecked,
  };
}

export const testPrisma = {
  blobFile: {
    async deleteMany({ where }: { where?: any } = {}) {
      let count = 0;
      for (const [pathname, record] of Array.from(blobFiles.entries())) {
        if (matchesWhere(record, where)) {
          blobFiles.delete(pathname);
          count += 1;
        }
      }
      return { count };
    },
    async findUnique({ where }: { where: { pathname: string } }) {
      const record = blobFiles.get(where.pathname);
      return record ? cloneRecord(record) : null;
    },
    async create({ data }: { data: any }) {
      if (blobFiles.has(data.pathname)) {
        throw new Error('Unique constraint failed on the fields: (`pathname`)');
      }
      const record = normalizeBlobFile(data);
      blobFiles.set(record.pathname, record);
      return cloneRecord(record);
    },
    async createMany({ data, skipDuplicates }: { data: any[]; skipDuplicates?: boolean }) {
      let count = 0;
      for (const item of data) {
        if (blobFiles.has(item.pathname)) {
          if (skipDuplicates) continue;
          throw new Error('Unique constraint failed on the fields: (`pathname`)');
        }
        const record = normalizeBlobFile(item);
        blobFiles.set(record.pathname, record);
        count += 1;
      }
      return { count };
    },
    async upsert({ where, create, update }: { where: { pathname: string }; create: any; update: any }) {
      const existing = blobFiles.get(where.pathname);
      if (!existing) {
        const record = normalizeBlobFile(create);
        blobFiles.set(record.pathname, record);
        return cloneRecord(record);
      }
      const updated = applyUpdate(existing, update);
      blobFiles.set(where.pathname, updated);
      return cloneRecord(updated);
    },
    async update({ where, data }: { where: { pathname: string }; data: any }) {
      const existing = blobFiles.get(where.pathname);
      if (!existing) {
        throw new Error('Record to update not found');
      }
      const updated = applyUpdate(existing, data);
      blobFiles.set(where.pathname, updated);
      return cloneRecord(updated);
    },
    async updateMany({ where, data }: { where?: any; data: any }) {
      let count = 0;
      for (const [pathname, record] of Array.from(blobFiles.entries())) {
        if (matchesWhere(record, where)) {
          blobFiles.set(pathname, applyUpdate(record, data));
          count += 1;
        }
      }
      return { count };
    },
    async findMany({ where, orderBy, take, skip }: { where?: any; orderBy?: any; take?: number; skip?: number } = {}) {
      let records = Array.from(blobFiles.values()).filter(record => matchesWhere(record, where));
      if (orderBy?.uploadedAt === 'desc') {
        records = records.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
      }
      const offset = skip ?? 0;
      const limit = take ?? records.length;
      return records.slice(offset, offset + limit).map(cloneRecord);
    },
    async count({ where }: { where?: any } = {}) {
      return Array.from(blobFiles.values()).filter(record => matchesWhere(record, where)).length;
    },
  },
  uploadHistory: {
    async create() {
      return {};
    },
  },
  user: {
    async count() {
      return 1;
    },
    async update({ data }: { data: any }) {
      return data;
    },
  },
  async $disconnect() {},
} as any;

vi.doMock('../src/shared/lib/db', () => ({ prisma: testPrisma }));
vi.doMock('@/shared/lib/db', () => ({ prisma: testPrisma }));
vi.doMock('@repo/cache', () => ({
  invalidateCache: vi.fn(async () => undefined),
  CacheKeys: {
    blobFilesPattern: () => 'blob-files:*',
  },
}));
vi.doMock('../auth', () => ({
  handlers: {},
  auth: vi.fn(async () => ({ user: { id: 'test-user', email: 'tester@example.com', role: 'SUPER_ADMIN' } })),
  signOut: vi.fn(async () => undefined),
}));

beforeAll(async () => {
  await testPrisma.blobFile.deleteMany({
    where: {
      pathname: {
        startsWith: 'test/',
      },
    },
  });
});

afterAll(async () => {
  await testPrisma.blobFile.deleteMany({
    where: {
      pathname: {
        startsWith: 'test/',
      },
    },
  });
  await testPrisma.$disconnect();
});

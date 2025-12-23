import { QdrantClient } from '@qdrant/js-client-rest';
import { z } from 'zod';
import { env } from '../env';
import type { QdrantPoint, DocumentFilter, SearchParams, SimilarityResult } from '@repo/rag-types';
import type { IQdrantService } from '@repo/rag-types';

// Zod schemas for Qdrant API responses
const CollectionInfoSchema = z.object({
  points_count: z.number().nullable().default(0),
  segments_count: z.number().nullable().default(0),
  disk_data_size: z.number().nullable().default(0),
  ram_data_size: z.number().nullable().default(0),
  config: z.record(z.unknown()).nullable().default({}),
});

const ScrollResultSchema = z.object({
  points: z.array(
    z.object({
      id: z.union([z.string(), z.number()]),
      payload: z.record(z.unknown()).optional(),
    })
  ),
  next_page_offset: z
    .union([z.object({ point_id: z.union([z.string(), z.number()]) }), z.string(), z.number()])
    .nullable()
    .optional(),
});

const CountResultSchema = z.object({
  count: z.number().nullable().default(0),
});

const QdrantFilterSchema = z.object({
  must: z.array(z.record(z.unknown())).optional(),
  should: z.array(z.record(z.unknown())).optional(),
  minimum_should: z.number().optional(),
});

// Return type for collection info
interface CollectionInfo {
  name: string;
  vectorsCount: number;
  segmentsCount: number;
  diskDataSize: number;
  ramDataSize: number;
  config: Record<string, unknown>;
}

// Return type for scroll points
interface ScrollPointsResult {
  points: Array<{ id: string; [key: string]: unknown }>;
  nextPageOffset?: string;
}

export class QdrantService implements IQdrantService {
  private client: QdrantClient;
  private readonly COLLECTION_NAME = 'blog_documents';

  constructor() {
    this.client = new QdrantClient({
      url: env.QDRANT_URL,
      apiKey: env.QDRANT_API_KEY,
    });
  }

  /**
   * Initialize the collection if it doesn't exist
   */
  async initializeCollection(): Promise<void> {
    try {
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(c => c.name === this.COLLECTION_NAME);

      if (!exists) {
        await this.client.createCollection(this.COLLECTION_NAME, {
          vectors: {
            size: 1536, // text-embedding-3-small dimensions
            distance: 'Cosine',
          },
          optimizers_config: {
            default_segment_number: 2,
            max_segment_size: 200000,
            memmap_threshold: 50000,
          },
          replication_factor: 1,
          write_consistency_factor: 1,
          on_disk_payload: true,
        });
        console.log(`✅ Created collection: ${this.COLLECTION_NAME}`);
        // Create indexes after collection creation
        await this.createIndexes();
      } else {
        // Check and create indexes if they don't exist
        await this.ensureIndexes();
      }
    } catch (error) {
      console.error(
        '❌ Failed to initialize collection:',
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  /**
   * Create indexes for filtered fields
   */
  async createIndexes(): Promise<void> {
    try {
      const indexes = [
        { field_name: 'documentId', field_schema: 'keyword' },
        { field_name: 'metadata.category', field_schema: 'keyword' },
        { field_name: 'metadata.tags', field_schema: 'keyword' },
        { field_name: 'metadata.author', field_schema: 'keyword' },
        { field_name: 'metadata.source', field_schema: 'keyword' },
        { field_name: 'metadata.publishedAt', field_schema: 'datetime' },
      ];

      for (const index of indexes) {
        try {
          await this.client.createPayloadIndex(this.COLLECTION_NAME, {
            field_name: index.field_name,
            field_schema: index.field_schema as 'keyword' | 'datetime',
          });
          console.log(`✅ Created index for: ${index.field_name}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes('already exists')) {
            console.log(`ℹ️  Index already exists for: ${index.field_name}`);
          } else {
            console.warn(`⚠️  Failed to create index for ${index.field_name}:`, errorMessage);
          }
        }
      }
    } catch (error) {
      console.error(
        '❌ Failed to create indexes:',
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  /**
   * Ensure indexes exist (create if missing)
   */
  async ensureIndexes(): Promise<void> {
    try {
      const collectionInfo = await this.client.getCollection(this.COLLECTION_NAME);
      const existingIndexes = collectionInfo.payload_schema
        ? Object.keys(collectionInfo.payload_schema)
        : [];

      const requiredIndexes = [
        'documentId',
        'metadata.category',
        'metadata.tags',
        'metadata.author',
        'metadata.source',
        'metadata.publishedAt',
      ];

      for (const field of requiredIndexes) {
        if (!existingIndexes.includes(field)) {
          console.log(`Creating missing index for: ${field}`);
          try {
            await this.client.createPayloadIndex(this.COLLECTION_NAME, {
              field_name: field,
              field_schema: (field.includes('publishedAt') ? 'datetime' : 'keyword') as
                | 'keyword'
                | 'datetime',
            });
            console.log(`✅ Created index for: ${field}`);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.warn(`⚠️  Failed to create index for ${field}:`, errorMessage);
          }
        }
      }
    } catch (error) {
      console.error(
        '❌ Failed to ensure indexes:',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Upsert points (documents) to the collection
   */
  async upsertPoints(points: QdrantPoint[]): Promise<void> {
    try {
      await this.client.upsert(this.COLLECTION_NAME, {
        wait: true,
        points: points.map(point => ({
          id: point.id,
          vector: point.vector,
          payload: point.payload,
        })),
      });
      console.log(`✅ Upserted ${points.length} points`);
    } catch (error) {
      console.error(
        '❌ Failed to upsert points:',
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  /**
   * Search for similar documents
   */
  async search(
    queryVector: number[],
    params: Partial<SearchParams> = {}
  ): Promise<SimilarityResult[]> {
    const { limit = 10, threshold = 0.7, filter, includeMetadata = true } = params;

    try {
      const builtFilter = this.buildFilter(filter);
      const searchParams: {
        vector: number[];
        limit: number;
        score_threshold?: number;
        with_payload: boolean;
        with_vector: false;
        filter?: z.infer<typeof QdrantFilterSchema>;
      } = {
        vector: queryVector,
        limit,
        with_payload: includeMetadata,
        with_vector: false,
      };

      if (threshold !== undefined) {
        searchParams.score_threshold = threshold;
      }

      if (builtFilter) {
        searchParams.filter = builtFilter;
      }

      const searchResult = await this.client.search(this.COLLECTION_NAME, searchParams);

      return searchResult.map(point => {
        const payload = point.payload as Record<string, unknown> | undefined;
        const rawPosition = payload?.position as { start: number; end: number } | undefined;
        return {
          id: point.id as string,
          score: point.score,
          text: (payload?.content as string) || '',
          documentId: payload?.documentId as string | undefined,
          metadata: includeMetadata
            ? (payload?.metadata as {
                title?: string;
                slug?: string;
                author?: string;
                category?: string;
                tags?: string[];
                publishedAt?: string;
                wordCount?: number;
                language?: string;
                source?: string;
              })
            : undefined,
          position: rawPosition
            ? {
                start: rawPosition.start,
                end: rawPosition.end,
                charCount: rawPosition.end - rawPosition.start,
              }
            : undefined,
        };
      });
    } catch (error) {
      console.error('❌ Failed to search:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Delete points by filter
   */
  async deletePoints(filter: DocumentFilter): Promise<void> {
    try {
      const builtFilter = this.buildFilter(filter);

      if (!builtFilter) {
        throw new Error('Filter is required for deletePoints operation');
      }

      await this.client.delete(this.COLLECTION_NAME, {
        wait: true,
        filter: builtFilter,
      });
      console.log(`✅ Deleted points matching filter`);
    } catch (error) {
      console.error(
        '❌ Failed to delete points:',
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  /**
   * Delete point by ID
   */
  async deletePoint(pointId: string): Promise<void> {
    try {
      await this.client.delete(this.COLLECTION_NAME, {
        wait: true,
        points: [pointId],
      });
      console.log(`✅ Deleted point: ${pointId}`);
    } catch (error) {
      console.error(
        '❌ Failed to delete point:',
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  /**
   * Get collection info
   */
  async getCollectionInfo(): Promise<CollectionInfo> {
    try {
      const info = await this.client.getCollection(this.COLLECTION_NAME);
      const parsed = CollectionInfoSchema.parse(info);
      return {
        name: this.COLLECTION_NAME,
        vectorsCount: parsed.points_count ?? 0,
        segmentsCount: parsed.segments_count ?? 0,
        diskDataSize: parsed.disk_data_size ?? 0,
        ramDataSize: parsed.ram_data_size ?? 0,
        config: parsed.config ?? {},
      };
    } catch (error) {
      console.error(
        '❌ Failed to get collection info:',
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  /**
   * Scroll through points with pagination
   */
  async scrollPoints(
    filter?: DocumentFilter,
    limit: number = 100,
    offset?: { point_id: string }
  ): Promise<ScrollPointsResult> {
    try {
      const builtFilter = this.buildFilter(filter);
      const scrollParams: {
        limit: number;
        offset?: { point_id: string };
        with_payload: true;
        with_vector: false;
        filter?: z.infer<typeof QdrantFilterSchema>;
      } = {
        limit,
        with_payload: true,
        with_vector: false,
      };

      if (offset) {
        scrollParams.offset = offset;
      }

      if (builtFilter) {
        scrollParams.filter = builtFilter;
      }

      const result = await this.client.scroll(this.COLLECTION_NAME, scrollParams);
      const parsed = ScrollResultSchema.parse(result);

      // Handle next_page_offset which can be object, string, or number
      let nextPageOffset: string | undefined;
      if (parsed.next_page_offset) {
        if (typeof parsed.next_page_offset === 'object') {
          nextPageOffset = String(parsed.next_page_offset.point_id);
        } else {
          nextPageOffset = String(parsed.next_page_offset);
        }
      }

      return {
        points:
          parsed.points?.map(point => ({
            id: String(point.id),
            ...point.payload,
          })) || [],
        nextPageOffset,
      };
    } catch (error) {
      console.error(
        '❌ Failed to scroll points:',
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  /**
   * Count points matching filter
   */
  async countPoints(filter?: DocumentFilter): Promise<number> {
    try {
      const builtFilter = this.buildFilter(filter);
      const countParams: {
        filter?: z.infer<typeof QdrantFilterSchema>;
      } = {};

      if (builtFilter) {
        countParams.filter = builtFilter;
      }

      const result = await this.client.count(this.COLLECTION_NAME, countParams);
      const parsed = CountResultSchema.parse(result);
      return parsed.count ?? 0;
    } catch (error) {
      console.error(
        '❌ Failed to count points:',
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  /**
   * Build Qdrant filter from DocumentFilter
   */
  private buildFilter(filter?: DocumentFilter): z.infer<typeof QdrantFilterSchema> | undefined {
    if (!filter) return undefined;

    const must: Array<Record<string, unknown>> = [];
    const should: Array<Record<string, unknown>> = [];

    if (filter.documentId) {
      must.push({
        key: 'documentId',
        match: { value: filter.documentId },
      });
    }

    if (filter.category) {
      must.push({
        key: 'metadata.category',
        match: { value: filter.category },
      });
    }

    if (filter.tags && filter.tags.length > 0) {
      should.push(
        ...filter.tags.map(tag => ({
          key: 'metadata.tags',
          match: { value: tag },
        }))
      );
    }

    if (filter.author) {
      must.push({
        key: 'metadata.author',
        match: { value: filter.author },
      });
    }

    if (filter.source) {
      must.push({
        key: 'metadata.source',
        match: { value: filter.source },
      });
    }

    if (filter.dateRange) {
      const dateFilter: Record<string, string> = {};
      if (filter.dateRange.start) {
        dateFilter.gte = filter.dateRange.start;
      }
      if (filter.dateRange.end) {
        dateFilter.lte = filter.dateRange.end;
      }
      if (Object.keys(dateFilter).length > 0) {
        must.push({
          key: 'metadata.publishedAt',
          range: dateFilter,
        });
      }
    }

    // Combine filters
    if (should.length > 0) {
      return QdrantFilterSchema.parse({
        must: must.length > 0 ? must : undefined,
        should,
        minimum_should: 1,
      });
    }

    if (must.length > 0) {
      return QdrantFilterSchema.parse({ must });
    }

    return undefined;
  }

  /**
   * Health check for Qdrant
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.getCollections();
      return true;
    } catch (error) {
      console.error(
        '❌ Qdrant health check failed:',
        error instanceof Error ? error.message : String(error)
      );
      return false;
    }
  }
}

// Singleton instance
let qdrantService: QdrantService | null = null;

export function getQdrantService(): QdrantService {
  if (!qdrantService) {
    qdrantService = new QdrantService();
  }
  return qdrantService;
}

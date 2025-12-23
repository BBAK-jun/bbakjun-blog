import { QdrantClient } from 'qdrant';
import { env } from '../env';
import type { QdrantPoint, DocumentFilter, SearchParams, SimilarityResult } from '@repo/rag-types';

export class QdrantService {
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
      }
    } catch (error) {
      console.error('❌ Failed to initialize collection:', error);
      throw error;
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
      console.error('❌ Failed to upsert points:', error);
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
      const searchResult = await this.client.search(this.COLLECTION_NAME, {
        vector: queryVector,
        limit,
        score_threshold: threshold,
        filter: this.buildFilter(filter),
        with_payload: includeMetadata,
        with_vector: false,
      });

      return searchResult.map(point => ({
        id: point.id as string,
        score: point.score,
        text: point.payload?.content || '',
        metadata: includeMetadata ? point.payload : undefined,
      }));
    } catch (error) {
      console.error('❌ Failed to search:', error);
      throw error;
    }
  }

  /**
   * Delete points by filter
   */
  async deletePoints(filter: DocumentFilter): Promise<void> {
    try {
      // Use the filter-based deletion
      await this.client.delete(this.COLLECTION_NAME, {
        wait: true,
        filter: this.buildFilter(filter),
      } as any);
      console.log(`✅ Deleted points matching filter`);
    } catch (error) {
      console.error('❌ Failed to delete points:', error);
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
      console.error('❌ Failed to delete point:', error);
      throw error;
    }
  }

  /**
   * Get collection info
   */
  async getCollectionInfo(): Promise<any> {
    try {
      const info = await this.client.getCollection(this.COLLECTION_NAME);
      const result: any = info.result || info;
      return {
        name: this.COLLECTION_NAME,
        vectorsCount: result.points_count || 0,
        segmentsCount: result.segments_count || 0,
        diskDataSize: result.disk_data_size || 0,
        ramDataSize: result.ram_data_size || 0,
        config: result.config || {},
      };
    } catch (error) {
      console.error('❌ Failed to get collection info:', error);
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
  ): Promise<{ points: any[]; nextPageOffset?: string }> {
    try {
      const result = await this.client.scroll(this.COLLECTION_NAME, {
        filter: this.buildFilter(filter),
        limit,
        offset,
        with_payload: true,
        with_vector: false,
      });
      const data: any = result.result || result;

      return {
        points:
          data.points?.map((point: any) => ({
            id: point.id as string,
            ...point.payload,
          })) || [],
        nextPageOffset: data.next_page_offset?.point_id,
      };
    } catch (error) {
      console.error('❌ Failed to scroll points:', error);
      throw error;
    }
  }

  /**
   * Count points matching filter
   */
  async countPoints(filter?: DocumentFilter): Promise<number> {
    try {
      const result = await this.client.count(this.COLLECTION_NAME, {
        filter: this.buildFilter(filter),
      });
      const data: any = result.result || result;
      return data.count || 0;
    } catch (error) {
      console.error('❌ Failed to count points:', error);
      throw error;
    }
  }

  /**
   * Build Qdrant filter from DocumentFilter
   */
  private buildFilter(filter?: DocumentFilter): any {
    if (!filter) return undefined;

    const must: any[] = [];
    const should: any[] = [];

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
      const dateFilter: any = {};
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
      return {
        must: must.length > 0 ? must : undefined,
        should,
        minimum_should: 1,
      };
    }

    return must.length > 0 ? { must } : undefined;
  }

  /**
   * Health check for Qdrant
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.getCollections();
      return true;
    } catch (error) {
      console.error('❌ Qdrant health check failed:', error);
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

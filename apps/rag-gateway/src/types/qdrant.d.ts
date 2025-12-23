declare module 'qdrant' {
  export interface QdrantClientConfig {
    url?: string;
    apiKey?: string;
    timeout?: number;
  }

  export class QdrantClient {
    constructor(config?: string | QdrantClientConfig);

    getCollections(): Promise<{ collections: Array<{ name: string }> }>;

    createCollection(
      name: string,
      config: {
        vectors: { size: number; distance: 'Cosine' | 'Euclid' | 'Dot' };
        optimizers_config?: {
          default_segment_number?: number;
          max_segment_size?: number;
          memmap_threshold?: number;
        };
        replication_factor?: number;
        write_consistency_factor?: number;
        on_disk_payload?: boolean;
      }
    ): Promise<{ result?: { status: string }; status?: string }>;

    getCollection(name: string): Promise<{
      result?: {
        points_count: number;
        segments_count: number;
        disk_data_size: number;
        ram_data_size: number;
        config: any;
      };
      status?: string;
    }>;

    upsert(
      collectionName: string,
      params: {
        wait?: boolean;
        points: Array<{
          id: string;
          vector: number[];
          payload?: Record<string, any>;
        }>;
      }
    ): Promise<{ result?: { operation_id: number; status: string } }>;

    search(
      collectionName: string,
      params: {
        vector: number[];
        limit: number;
        score_threshold?: number;
        filter?: any;
        with_payload?: boolean;
        with_vector?: boolean;
      }
    ): Promise<
      Array<{
        id: string | number;
        score: number;
        payload?: Record<string, any>;
      }>
    >;

    delete(
      collectionName: string,
      params: string[] | { wait?: boolean; points: string[] } | { wait?: boolean; filter: any }
    ): Promise<{ result?: { operation_id: number; status: string } }>;

    scroll(
      collectionName: string,
      params: {
        filter?: any;
        limit: number;
        offset?: { point_id: string } | null;
        with_payload?: boolean;
        with_vector?: boolean;
      }
    ): Promise<{
      result?: {
        points: Array<{
          id: string;
          payload?: Record<string, any>;
        }>;
        next_page_offset?: { point_id: string } | null;
      };
    }>;

    count(
      collectionName: string,
      params?: {
        filter?: any;
      }
    ): Promise<{ result?: { count: number } }>;
  }

  export const Qdrant: new (url?: string) => {
    url: string;
    delete_collection(name: string): Promise<any>;
    create_collection(name: string, body: any): Promise<any>;
    get_collection(name: string): Promise<any>;
    upload_points(name: string, points: any[]): Promise<any>;
    search_collection(
      name: string,
      vector: number[],
      k?: number,
      ef?: number,
      filter?: any
    ): Promise<any>;
    query_collection(name: string, query: any): Promise<any>;
    retrieve_points(name: string, query: any): Promise<any>;
  };
}

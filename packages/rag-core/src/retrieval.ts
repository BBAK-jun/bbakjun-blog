import { QdrantPoint } from '@repo/rag-types';

export class RetrievalService {
  async retrieve(query: string, limit: number = 10): Promise<QdrantPoint[]> {
    // Placeholder implementation
    return [];
  }
}

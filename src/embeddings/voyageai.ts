import axios from 'axios';
import { config } from '../config';

export class VoyageAIEmbeddings {
  configured: boolean;

  constructor() {
    this.configured = !!config.voyageai.apiKey;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.configured) throw new Error('VoyageAI not configured');
    try {
      const response = await axios.post(
        'https://api.voyageai.com/v1/embeddings',
        {
          input: text,
          model: 'voyage-2',
        },
        {
          headers: {
            'Authorization': `Bearer ${config.voyageai.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data?.data?.[0]?.embedding || [];
    } catch (error) {
      console.error('VoyageAI embedding error:', error);
      throw error;
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!this.configured) throw new Error('VoyageAI not configured');
    try {
      const response = await axios.post(
        'https://api.voyageai.com/v1/embeddings',
        {
          input: texts,
          model: 'voyage-2',
        },
        {
          headers: {
            'Authorization': `Bearer ${config.voyageai.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data?.data?.map((d: any) => d.embedding) || [];
    } catch (error) {
      console.error('VoyageAI embeddings error:', error);
      throw error;
    }
  }
}
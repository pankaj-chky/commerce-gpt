import axios from 'axios';
import { config } from '../config';

export class UnstructuredEmbeddings {
  configured: boolean;

  constructor() {
    this.configured = !!config.unstructured.apiKey;
  }

  async parseDocument(fileBuffer: Buffer, filename: string): Promise<string> {
    if (!this.configured) throw new Error('Unstructured not configured');
    try {
      const formData = new FormData();
      const blob = new Blob([fileBuffer], { type: 'application/octet-stream' });
      formData.append('files', blob, filename);

      const response = await axios.post(
        'https://api.unstructured.io/general/v0/general',
        formData,
        {
          headers: {
            'api-key': config.unstructured.apiKey,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const elements = response.data || [];
      return elements
        .map((el: any) => el.text || '')
        .filter(Boolean)
        .join('\n');
    } catch (error) {
      console.error('Unstructured parsing error:', error);
      throw error;
    }
  }
}
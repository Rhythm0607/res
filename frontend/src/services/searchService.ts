import api from './api';

export interface SearchResult {
  id: number;
  type: 'job' | 'candidate';
  title?: string;
  department?: string;
  location?: string;
  name?: string;
  email?: string;
}

export interface SearchResponse {
  jobs: SearchResult[];
  candidates: SearchResult[];
}

export const searchService = {
  globalSearch: async (query: string): Promise<SearchResponse> => {
    const response = await api.get(`/search`, { params: { q: query } });
    return response.data;
  }
};

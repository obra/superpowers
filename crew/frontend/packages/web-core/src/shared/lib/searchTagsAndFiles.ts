import { searchApi, tagsApi } from '@/shared/lib/api';
import type { SearchResult, Tag } from 'shared/types';

interface FileSearchResult extends SearchResult {
  name: string;
}

export interface SearchResultItem {
  type: 'tag' | 'file';
  tag?: Tag;
  file?: FileSearchResult;
}

export interface SearchOptions {
  repoIds?: string[];
  projectId?: string;
}

export async function searchTagsAndFiles(
  query: string,
  options?: SearchOptions
): Promise<SearchResultItem[]> {
  const results: SearchResultItem[] = [];

  // Fetch all tags and filter client-side
  const tags = await tagsApi.list();
  const filteredTags = tags.filter((tag) =>
    tag.tag_name.toLowerCase().includes(query.toLowerCase())
  );
  results.push(...filteredTags.map((tag) => ({ type: 'tag' as const, tag })));

  // Fetch files - prefer repo-scoped if available
  if (query.length > 0) {
    let fileResults: SearchResult[] = [];
    if (options?.repoIds && options.repoIds.length > 0) {
      fileResults = await searchApi.searchFiles(options.repoIds, query);
    }

    if (fileResults.length > 0) {
      const fileSearchResults: FileSearchResult[] = fileResults.map((item) => ({
        ...item,
        name: item.path.split('/').pop() || item.path,
      }));
      results.push(
        ...fileSearchResults.map((file) => ({ type: 'file' as const, file }))
      );
    }
  }

  return results;
}

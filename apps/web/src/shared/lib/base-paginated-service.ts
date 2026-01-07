import {
  PaginationParams,
  PaginationResponse,
  SearchParams,
  parseSearchParams,
} from '@/shared/types/pagination';

// Re-export for convenience
export { parseSearchParams } from '@/shared/types/pagination';
export type { SearchParams } from '@/shared/types/pagination';

/**
 * Base service class for handling paginated API requests
 */
export abstract class BasePaginatedService<
  T,
  TCreateDto = any,
  TUpdateDto = any,
> {
  protected abstract baseUrl: string;

  /**
   * Get all items with pagination
   */
  async getAll(
    params: PaginationParams,
  ): Promise<PaginationResponse<T> | null> {
    try {
      const searchParams = new URLSearchParams();

      if (params.page) searchParams.set('page', params.page.toString());
      if (params.take) searchParams.set('take', params.take.toString());
      if (params.order) searchParams.set('order', params.order);
      if (params.q) searchParams.set('q', params.q);

      const url = `${this.baseUrl}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching data:', error);
      return null;
    }
  }

  /**
   * Get a single item by ID
   */
  async getById(id: number | string): Promise<T | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching item:', error);
      return null;
    }
  }

  /**
   * Create a new item
   */
  async create(data: TCreateDto): Promise<T | null> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating item:', error);
      return null;
    }
  }

  /**
   * Update an existing item
   */
  async update(id: number | string, data: TUpdateDto): Promise<T | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating item:', error);
      return null;
    }
  }

  /**
   * Delete an item
   */
  async delete(id: number | string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting item:', error);
      return false;
    }
  }
}

/**
 * Utility function to create page props interface
 */
export function createPagePropsInterface() {
  return `
interface PageProps {
  searchParams?: {
    page?: string;
    take?: string;
    order?: 'ASC' | 'DESC';
    q?: string;
  };
}
`;
}

/**
 * Helper function for server components to parse search params
 */
export function getServerPaginationParams(
  searchParams: SearchParams,
  defaults: {
    defaultPage?: number;
    defaultPageSize?: number;
    defaultOrder?: 'ASC' | 'DESC';
  } = {},
): SearchParams {
  return parseSearchParams(searchParams, defaults);
}

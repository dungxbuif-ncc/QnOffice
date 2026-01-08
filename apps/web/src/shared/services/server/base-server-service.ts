import { config } from '@/shared/config';
import { getServerSession } from '@/shared/services/server/auth-server-service';
import { joinUrlPaths } from '@/shared/utils/joinUrlPaths';
import { ApiResponse } from '@qnoffice/shared';
import console from 'console';

/**
 * Base server service for making authenticated API calls from server components
 * Handles session extraction and token management
 */
export abstract class BaseServerService {
  protected async getAuthHeaders() {
    try {
      const session = await getServerSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      headers['Authorization'] = `Bearer ${session.tokens.accessToken}`;
      return headers;
    } catch (error) {
      console.warn(
        '[BaseServerService] Failed to get session for auth headers:',
        error,
      );
      return {
        'Content-Type': 'application/json',
      };
    }
  }

  /**
   * Make authenticated request through BFF proxy
   */
  protected async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const url = joinUrlPaths(config.backendBaseUrl, endpoint);

    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(url, {
        headers: {
          ...headers,
          ...options.headers,
        },
        cache: 'no-store',
        ...options,
      });
      if (!response.ok) {
        throw new Error(
          `Failed to fetch ${endpoint}: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Server-side fetch error for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Make GET request through BFF proxy
   */
  protected async get<T>(
    endpoint: string,
    params?: Record<string, any>,
  ): Promise<ApiResponse<T>> {
    let url = endpoint;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });

      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }

    return this.makeRequest<T>(url);
  }

  /**
   * Make POST request through BFF proxy
   */
  protected async post<T>(
    endpoint: string,
    data?: any,
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Make PUT request through BFF proxy
   */
  protected async put<T>(
    endpoint: string,
    data?: any,
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Make DELETE request through BFF proxy
   */
  protected async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'DELETE',
    });
  }

  /**
   * Make PATCH request through BFF proxy
   */
  protected async patch<T>(
    endpoint: string,
    data?: any,
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

import { config } from '@/lib/config';
import { SessionData, sessionOptions } from '@/lib/session';
import { joinUrlPaths } from '@/lib/utils/joinUrlPaths';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

/**
 * Base server service for making authenticated API calls from server components
 * Handles session extraction and token management
 */
export abstract class BaseServerService {
  protected async getAuthHeaders() {
    const cookieStore = await cookies();

    try {
      const session = await getIronSession<SessionData>(
        cookieStore,
        sessionOptions,
      );

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add Authorization header if access token exists
      if (session.accessToken) {
        headers['Authorization'] = `Bearer ${session.accessToken}`;
        console.log('[BaseServerService] Using access token from session');
      } else {
        console.warn('[BaseServerService] No access token found in session:', {
          sessionKeys: Object.keys(session),
          hasUser: !!session.user,
          hasRefreshToken: !!session.refreshToken,
        });
      }

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
  ): Promise<T> {
    const url = joinUrlPaths(config.frontendBaseUrl, 'api', endpoint);

    try {
      const headers = await this.getAuthHeaders();
      const cookieStore = await cookies();

      // Get the session cookie to pass to the BFF proxy
      const sessionCookie = cookieStore.get('qn-session');

      console.log('[BaseServerService] Making request:', {
        url,
        method: options.method || 'GET',
        hasAuthToken: headers.Authorization ? 'yes' : 'no',
        hasSessionCookie: sessionCookie ? 'yes' : 'no',
      });

      const response = await fetch(url, {
        headers: {
          ...headers,
          ...(sessionCookie && { Cookie: `qn-sesion=${sessionCookie.value}` }),
          ...options.headers,
        },
        cache: 'no-store', // Ensure fresh data for server components
        ...options,
      });

      console.log('[BaseServerService] Response status:', response.status);

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
  ): Promise<T> {
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
  protected async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Make PUT request through BFF proxy
   */
  protected async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Make DELETE request through BFF proxy
   */
  protected async delete<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'DELETE',
    });
  }

  /**
   * Make PATCH request through BFF proxy
   */
  protected async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

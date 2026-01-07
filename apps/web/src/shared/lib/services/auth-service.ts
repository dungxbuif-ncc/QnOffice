import { PATHS } from '@/shared/constants';
import { UserRole } from '@qnoffice/shared';
import { BaseService } from './base-service';

export interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
  staff?: {
    id: number;
    email: string;
    status: number;
    role: UserRole;
    branchId: number;
    branch?: any;
  };
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

export class AuthService extends BaseService {
  async me(): Promise<AuthState> {
    return this.get<AuthState>(PATHS.API.AUTH.ME);
  }

  async logout(): Promise<void> {
    await this.post<void>(PATHS.API.AUTH.LOGOUT);
  }

  async redirectToOAuth(): Promise<void> {
    try {
      // Fetch OAuth URL from backend
      const response = await fetch(`/api${PATHS.API.AUTH.OAUTH_URL}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get OAuth URL');
      }

      const data = await response.json();
      const oauthUrl = data.url || data.data?.url;

      if (!oauthUrl) {
        throw new Error('No OAuth URL received from server');
      }

      // Redirect to OAuth URL
      window.location.href = oauthUrl;
    } catch (error) {
      console.error('Error getting OAuth URL:', error);
      // Fallback to direct endpoint if OAuth URL fetch fails
      window.location.href = `/api${PATHS.API.AUTH.LOGIN_REDIRECT}`;
    }
  }
}

export const authService = new AuthService();

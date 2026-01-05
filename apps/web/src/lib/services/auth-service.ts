import { PATHS } from '@/constants';
import { BaseService } from './base-service';

export interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
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
    // Call BFF endpoint that handles server-side redirect to OAuth
    window.location.href = `/api${PATHS.API.AUTH.LOGIN_REDIRECT}`;
  }
}

export const authService = new AuthService();

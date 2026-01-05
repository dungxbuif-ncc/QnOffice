import api from './api-simple';

export interface User {
  mezonId: string;
  role: number;
}

export const authApi = {
  getProfile: async (): Promise<{
    data: User;
  }> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  getLoginUrl: (): string => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    return `${apiUrl}/auth/login`;
  },
};

export interface ApiResponse<T> {
  statusCode: 200;
  data: T;
  message?: string;
}
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserAuth {
  mezonId: string;
  name: string;
  email: string;
  role: number | null;
  staffId?: number;
}
export interface AuthProfile {
  user: UserAuth;
  tokens: AuthTokens;
}

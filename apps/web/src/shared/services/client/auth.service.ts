import { API_PATHS, PATHS } from '@/shared/constants';
import baseApi from '@/shared/services/client/base-api';
import { ApiResponse, AuthProfile } from '@qnoffice/shared';

class AuthService {
  async me() {
    return (await baseApi.get<ApiResponse<AuthProfile>>(API_PATHS.AUTH.PROFILE))
      ?.data;
  }

  async redirectToOAuth() {
    const response = await baseApi.get<{ url: string }>(PATHS.AUTH.LOGIN);
    if (response.data.url) {
      window.location.href = response.data.url;
    }
  }

  async logout() {}
}
const authService = new AuthService();
export default authService;

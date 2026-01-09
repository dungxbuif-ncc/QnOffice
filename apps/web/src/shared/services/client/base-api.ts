import { joinUrlPaths } from '@qnoffice/shared';
import axios from 'axios';
export default axios.create({
  baseURL: joinUrlPaths(process.env.NEXT_PUBLIC_API_BASE_URL as string, 'api'),
  withCredentials: true,
});

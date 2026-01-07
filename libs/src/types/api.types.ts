export interface ApiResponse<T> {
  statusCode: 200;
  data: T;
  message?: string;
}

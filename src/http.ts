export interface HttpClient {
  get<T = unknown>(url: string): Promise<T>;
  post<T = unknown>(url: string, data?: unknown): Promise<T>;
  put<T = unknown>(url: string, data?: unknown): Promise<T>;
  patch<T = unknown>(url: string, data?: unknown): Promise<T>;
  delete<T = unknown>(url: string): Promise<T>;
}

import { getApiBaseUrl } from './env';

export interface ApiError {
  statusCode: number;
  code: string;
  message: string;
}

/**
 * Thin fetch wrapper that:
 * - Prepends the API base URL
 * - Sends cookies (credentials: 'include')
 * - Throws a typed ApiError on non-2xx responses
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;

  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const error: ApiError = {
      statusCode: res.status,
      code: body.code ?? 'UNKNOWN',
      message: body.message ?? res.statusText,
    };
    throw error;
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

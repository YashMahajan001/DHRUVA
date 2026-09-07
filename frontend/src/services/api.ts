/**
 * DHRUVAA - Central API Transport Layer
 * Provides seamless bridge between local mock simulation and live FastAPI / WebSocket backend
 */

export const API_BASE_URL: string =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    (import.meta.env.VITE_API_BASE_URL as string)) ||
  '';

export const isLiveBackendAvailable = (): boolean => {
  return Boolean(API_BASE_URL && API_BASE_URL.trim().length > 0);
};

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public isLive(): boolean {
    return isLiveBackendAvailable();
  }

  public async get<T>(endpoint: string, fallbackData: T): Promise<T> {
    if (!this.isLive()) return fallbackData;
    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn(`API GET ${endpoint} error, falling back to local digital twin:`, err);
    }
    return fallbackData;
  }

  public async post<T, B = unknown>(endpoint: string, body: B, fallbackData: T): Promise<T> {
    if (!this.isLive()) return fallbackData;
    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn(`API POST ${endpoint} error, falling back to local digital twin:`, err);
    }
    return fallbackData;
  }
}

export const apiClient = new ApiClient();
export const apiService = apiClient;
export const dhruvaaApi = apiClient;

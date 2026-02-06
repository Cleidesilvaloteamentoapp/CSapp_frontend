const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

type RequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  cache?: RequestCache;
  next?: { revalidate?: number; tags?: string[] };
};

export class ApiError extends Error {
  status: number;
  detail: string | Array<{ loc: string[]; msg: string; type: string }>;

  constructor(
    status: number,
    detail: string | Array<{ loc: string[]; msg: string; type: string }>
  ) {
    const message = typeof detail === "string" ? detail : "Erro de validação";
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

function getTokenFromCookies(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )access_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function fetchWithAuth(
  endpoint: string,
  options: RequestOptions = {}
): Promise<Response> {
  const { method = "GET", headers = {}, body, ...rest } = options;

  const token = getTokenFromCookies();

  const reqHeaders: Record<string, string> = {
    ...headers,
  };

  if (token) {
    reqHeaders["Authorization"] = `Bearer ${token}`;
  }

  if (body && !(body instanceof FormData)) {
    reqHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: reqHeaders,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    ...rest,
  });

  if (response.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const newToken = getTokenFromCookies();
      if (newToken) {
        reqHeaders["Authorization"] = `Bearer ${newToken}`;
      }
      const retryResponse = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers: reqHeaders,
        body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
        ...rest,
      });

      if (!retryResponse.ok) {
        let detail: string | Array<{ loc: string[]; msg: string; type: string }>;
        try {
          const errorData = await retryResponse.json();
          detail = errorData.detail || `Erro ${retryResponse.status}`;
        } catch {
          detail = `Erro ${retryResponse.status}: ${retryResponse.statusText}`;
        }
        throw new ApiError(retryResponse.status, detail);
      }

      return retryResponse;
    }

    // Refresh failed — session expired. Let auth context handle redirect.
    clearTokenCookies();
    throw new ApiError(401, "Sessão expirada. Faça login novamente.");
  }

  if (!response.ok) {
    let detail: string | Array<{ loc: string[]; msg: string; type: string }>;
    try {
      const errorData = await response.json();
      detail = errorData.detail || `Erro ${response.status}`;
    } catch {
      detail = `Erro ${response.status}: ${response.statusText}`;
    }
    throw new ApiError(response.status, detail);
  }

  return response;
}

async function tryRefreshToken(): Promise<boolean> {
  try {
    const refreshToken = getRefreshTokenFromCookies();
    if (!refreshToken) return false;

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    setTokenCookies(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

function getRefreshTokenFromCookies(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )refresh_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function setTokenCookies(
  accessToken: string,
  refreshToken: string
): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `access_token=${encodeURIComponent(accessToken)}; path=/; SameSite=Lax; max-age=3600${secure}`;
  document.cookie = `refresh_token=${encodeURIComponent(refreshToken)}; path=/; SameSite=Lax; max-age=604800${secure}`;
}

export function clearTokenCookies(): void {
  document.cookie = "access_token=; path=/; max-age=0";
  document.cookie = "refresh_token=; path=/; max-age=0";
}

export const api = {
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const res = await fetchWithAuth(endpoint, { ...options, method: "GET" });
    if (res.status === 204) return undefined as T;
    return res.json();
  },

  async post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const res = await fetchWithAuth(endpoint, { ...options, method: "POST", body });
    if (res.status === 204) return undefined as T;
    return res.json();
  },

  async put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const res = await fetchWithAuth(endpoint, { ...options, method: "PUT", body });
    if (res.status === 204) return undefined as T;
    return res.json();
  },

  async patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const res = await fetchWithAuth(endpoint, { ...options, method: "PATCH", body });
    if (res.status === 204) return undefined as T;
    return res.json();
  },

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const res = await fetchWithAuth(endpoint, { ...options, method: "DELETE" });
    if (res.status === 204) return undefined as T;
    return res.json();
  },

  async upload<T>(endpoint: string, file: File): Promise<T> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetchWithAuth(endpoint, { method: "POST", body: formData });
    return res.json();
  },
};

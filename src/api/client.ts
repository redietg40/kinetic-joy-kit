export const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"] || "https://redudev.pythonanywhere.com";

export function getCsrfToken() {
  if (typeof document === "undefined") return "";
  return document.cookie.split("; ").find((row) => row.startsWith("csrftoken="))?.split("=")[1] ?? "";
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('fieldflow-token') : null;
  const headers: Record<string, string> = { 
    "Content-Type": "application/json", 
    "X-CSRFToken": getCsrfToken(),
    ...(init.headers as Record<string, string> || {})
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
    });
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    return response.json() as Promise<T>;
  } catch (error: any) {
    if (typeof window === 'undefined') {
      // In SSR mode, log a clear warning if Django backend is not reachable
      console.warn(`[SSR] Django backend at ${API_BASE_URL} unreachable: ${error.message}`);
    }
    throw error;
  }
}

export const delay = (ms = 550) => new Promise((resolve) => setTimeout(resolve, ms));

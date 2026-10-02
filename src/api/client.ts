export const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"] ?? "http://127.0.0.1:8000";

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

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export const delay = (ms = 550) => new Promise((resolve) => setTimeout(resolve, ms));

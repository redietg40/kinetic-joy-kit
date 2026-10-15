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

  let attempts = 0;
  while (attempts < 2) {
    attempts++;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout for cloud cold-starts

    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      return (await response.json()) as Promise<T>;
    } catch (error: any) {
      clearTimeout(timeout);
      if (attempts >= 2) {
        if (typeof window === "undefined") {
          console.warn(`[SSR] Django backend at ${API_BASE_URL} unreachable: ${error.message}`);
        }
        throw error;
      }
      // Brief pause before retry
      await new Promise((r) => setTimeout(r, 1200));
    }
  }
  throw new Error("Request failed after retry");
}

export const delay = (ms = 550) => new Promise((resolve) => setTimeout(resolve, ms));

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const TOKEN_KEY = "pd_token";
const EMAIL_KEY = "pd_email";

export function getToken(): string {
  return (typeof window !== "undefined" && localStorage.getItem(TOKEN_KEY)) || "";
}

export function getEmail(): string {
  return (typeof window !== "undefined" && localStorage.getItem(EMAIL_KEY)) || "";
}

export function saveSession(token: string, email: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EMAIL_KEY, email);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
}

export function apiPost(path: string, opts: RequestInit = {}) {
  return fetch(`${API_URL}${path}`, opts);
}

export { API_URL };

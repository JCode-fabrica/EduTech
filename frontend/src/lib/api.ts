export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init
  });
  if (!res.ok) throw new Error(`API_ERROR_${res.status}`);
  return (await res.json()) as T;
}

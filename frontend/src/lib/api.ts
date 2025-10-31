export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const isForm = typeof FormData !== 'undefined' && init?.body instanceof FormData;
  const headers: Record<string, string> = { ...(init?.headers as any) };
  if (!isForm && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (res.status === 401) {
    localStorage.removeItem('token');
    if (!location.pathname.startsWith('/login')) location.href = '/login';
    throw new Error('UNAUTHORIZED');
  }
  if (!res.ok) throw new Error(`API_ERROR_${res.status}`);
  return (await res.json()) as T;
}

export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const isForm = typeof FormData !== 'undefined' && init?.body instanceof FormData;
  const headers: Record<string, string> = { ...(init?.headers as any) };
  if (!isForm && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, { ...init, headers });
  if (res.status === 401) {
    localStorage.removeItem('token');
    if (!location.pathname.startsWith('/login')) location.href = '/login';
    throw new Error('UNAUTHORIZED');
  }
  if (!res.ok) {
    let bodyText = '';
    try { bodyText = await res.text(); } catch {}
    // Try parse JSON error to surface details
    let detail: any = null;
    try { detail = bodyText ? JSON.parse(bodyText) : null; } catch {}
    const method = (init?.method || 'GET').toString();
    const msg = `API_ERROR_${res.status} ${method} ${url}` + (detail ? `\n${JSON.stringify(detail)}` : (bodyText ? `\n${bodyText}` : ''));
    const err = new Error(msg);
    (err as any).status = res.status;
    (err as any).url = url;
    (err as any).detail = detail || bodyText;
    throw err;
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return (await res.json()) as T;
  // Non-JSON success
  return (await res.text()) as unknown as T;
}

export async function api<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch('/api' + path, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error ?? 'Unable to connect. Please try again.');
  return data as T;
}

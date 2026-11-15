/** JSON API uchun kichik fetch yordamchisi. Xato bo'lsa `ApiError(code)` tashlaydi. */
export class ApiError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

export async function api<T = unknown>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  const res = await fetch(path, {
    ...rest,
    headers: { ...(json !== undefined ? { "Content-Type": "application/json" } : {}), ...rest.headers },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new ApiError(data.error ?? "server");
  return data;
}

/** Browser-side fetch wrapper. Surfaces the server's Korean error message. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly requestId?: string,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(path, {
      ...rest,
      headers: { ...(json !== undefined ? { "content-type": "application/json" } : {}), ...headers },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError(0, "network", "인터넷 연결이 끊긴 것 같아요. 연결을 확인하고 다시 시도해 주세요.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = data?.error;
    throw new ApiError(
      res.status,
      err?.code ?? "unknown",
      err?.message ?? "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.",
      err?.requestId,
    );
  }
  return data as T;
}

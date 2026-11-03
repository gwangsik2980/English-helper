import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, AUTH_SESSION_DAYS } from "./config";
import { userIdFromToken } from "./auth";
import { AppError } from "./errors";

/** For Server Components: the signed-in user id, or a redirect to /login. */
export async function requirePageUser(): Promise<string> {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  const userId = await userIdFromToken(token);
  if (!userId) redirect("/login");
  return userId;
}

export async function optionalPageUser(): Promise<string | null> {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  return userIdFromToken(token);
}

async function requireApiUser(req: NextRequest): Promise<string> {
  const userId = await userIdFromToken(req.cookies.get(AUTH_COOKIE)?.value);
  if (!userId) throw new AppError("unauthorized", "로그인이 필요해요. 다시 로그인해 주세요.");
  return userId;
}

/**
 * Blocks cross-site form posts. SameSite=Lax already covers most cases;
 * this is a second check for state-changing requests.
 */
function assertSameOrigin(req: NextRequest) {
  if (req.method === "GET" || req.method === "HEAD") return;
  const origin = req.headers.get("origin");
  if (!origin) return; // non-browser clients; cookie is still required
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  let originHost: string | null = null;
  try {
    originHost = new URL(origin).host;
  } catch {
    originHost = null;
  }
  if (!host || originHost !== host) {
    throw new AppError("forbidden", "허용되지 않은 요청이에요. 페이지를 새로고침한 뒤 다시 시도해 주세요.");
  }
}

type Handler<C> = (ctx: { req: NextRequest; requestId: string; params: C }) => Promise<Response>;
type AuthedHandler<C> = (ctx: { req: NextRequest; requestId: string; params: C; userId: string }) => Promise<Response>;

function errorResponse(err: unknown, requestId: string) {
  if (err instanceof AppError) {
    return NextResponse.json(
      { error: { code: err.code, message: err.messageKo, requestId } },
      { status: err.status },
    );
  }
  // Never log request bodies or conversation text; identifiers only.
  console.error(`[api] unexpected error requestId=${requestId}`, err instanceof Error ? err.name : "unknown");
  return NextResponse.json(
    {
      error: {
        code: "internal",
        message: "일시적인 문제가 생겼어요. 잠시 후 다시 시도해 주세요.",
        requestId,
      },
    },
    { status: 500 },
  );
}

export function route<C = Record<string, never>>(handler: Handler<C>) {
  return async (req: NextRequest, ctx: { params: Promise<C> }) => {
    const requestId = randomUUID();
    try {
      assertSameOrigin(req);
      const params = ctx?.params ? await ctx.params : ({} as C);
      const res = await handler({ req, requestId, params });
      res.headers.set("x-request-id", requestId);
      return res;
    } catch (err) {
      return errorResponse(err, requestId);
    }
  };
}

export function authedRoute<C = Record<string, never>>(handler: AuthedHandler<C>) {
  return route<C>(async ({ req, requestId, params }) => {
    const userId = await requireApiUser(req);
    return handler({ req, requestId, params, userId });
  });
}

export async function readJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new AppError("invalid_input", "요청 형식이 올바르지 않아요.");
  }
}

export function setAuthCookie(res: NextResponse, token: string) {
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AUTH_SESSION_DAYS * 24 * 60 * 60,
  });
}

export function clearAuthCookie(res: NextResponse) {
  res.cookies.set(AUTH_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
}

const buckets = new Map<string, { count: number; resetAt: number }>();

/** Simple per-process limiter. Good enough for one server; swap for Redis when scaling out. */
export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  bucket.count += 1;
  if (bucket.count > max) {
    throw new AppError("rate_limited", "너무 빠르게 보내고 있어요. 잠시 후 다시 보내 주세요.");
  }
}

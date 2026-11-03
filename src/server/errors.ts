export type AppErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "invalid_input"
  | "conflict"
  | "rate_limited"
  | "session_closed"
  | "ai_unavailable"
  | "ai_output_invalid"
  | "service_unavailable"
  | "token_invalid";

const STATUS: Record<AppErrorCode, number> = {
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  invalid_input: 400,
  conflict: 409,
  rate_limited: 429,
  session_closed: 409,
  ai_unavailable: 503,
  ai_output_invalid: 502,
  service_unavailable: 503,
  token_invalid: 400,
};

/** Domain error with a Korean, user-facing message that says what to do next. */
export class AppError extends Error {
  readonly status: number;
  constructor(
    readonly code: AppErrorCode,
    readonly messageKo: string,
  ) {
    super(code);
    this.status = STATUS[code];
  }
}

import { NextResponse } from "next/server";
import { authedRoute, clearAuthCookie } from "@/server/http";
import { deleteAccountData } from "@/server/services/account";

export const DELETE = authedRoute(async ({ userId }) => {
  const result = await deleteAccountData(userId);
  const res = NextResponse.json(result);
  clearAuthCookie(res);
  return res;
});

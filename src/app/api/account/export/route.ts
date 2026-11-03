import { NextResponse } from "next/server";
import { authedRoute } from "@/server/http";
import { exportAccountData } from "@/server/services/account";

export const GET = authedRoute(async ({ userId }) => {
  const data = await exportAccountData(userId);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": 'attachment; filename="english-quest-my-data.json"',
    },
  });
});

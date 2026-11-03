import { NextResponse } from "next/server";
import { authedRoute } from "@/server/http";
import { listMissions } from "@/server/repositories/missions";

export const GET = authedRoute(async ({ req }) => {
  const q = req.nextUrl.searchParams;
  const level = Number(q.get("level")) || undefined;
  const maxDuration = Number(q.get("maxDuration")) || undefined;
  const missions = await listMissions({ category: q.get("category") ?? undefined, level, maxDuration });
  // The catalog is small; a cursor is reserved for when it grows.
  return NextResponse.json({
    missions: missions.map(({ scenario, successCriteria, ...m }) => ({
      ...m,
      summaryKo: scenario.summaryKo,
      learningPointsKo: scenario.learningPointsKo,
      goalCount: successCriteria.length,
    })),
    nextCursor: null,
  });
});

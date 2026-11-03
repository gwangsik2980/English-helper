import { NextResponse } from "next/server";
import { AppError } from "@/server/errors";
import { authedRoute } from "@/server/http";
import { getMissionByIdOrSlug } from "@/server/repositories/missions";

export const GET = authedRoute<{ id: string }>(async ({ params }) => {
  const mission = await getMissionByIdOrSlug(params.id);
  if (!mission) throw new AppError("not_found", "미션을 찾을 수 없어요.");
  const { mockScript: _s, mockClosing: _c, ...scenario } = mission.scenario;
  void _s;
  void _c;
  return NextResponse.json({
    ...mission,
    scenario,
    successCriteria: mission.successCriteria.map(({ id, descriptionKo }) => ({ id, descriptionKo })),
  });
});

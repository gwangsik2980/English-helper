import "server-only";
import type { Mission } from "@prisma/client";
import {
  ScenarioSchema,
  SuccessCriterionSchema,
  type Category,
  type MissionView,
} from "@/shared/schemas/domain";
import { prisma } from "../db";
import { MISSION_SEEDS } from "../missions/catalog";

export function toMissionView(row: Mission): MissionView {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category as Category,
    levelMin: row.levelMin,
    levelMax: row.levelMax,
    durationMin: row.durationMin,
    version: row.version,
    scenario: ScenarioSchema.parse(JSON.parse(row.scenarioJson)),
    successCriteria: SuccessCriterionSchema.array().parse(JSON.parse(row.successCriteriaJson)),
  };
}

export async function seedMissions() {
  for (const m of MISSION_SEEDS) {
    const data = {
      slug: m.slug,
      title: m.title,
      category: m.category,
      levelMin: m.levelMin,
      levelMax: m.levelMax,
      durationMin: m.durationMin,
      version: m.version,
      scenarioJson: JSON.stringify(m.scenario),
      successCriteriaJson: JSON.stringify(m.successCriteria),
      active: true,
    };
    await prisma.mission.upsert({ where: { id: m.id }, create: { id: m.id, ...data }, update: data });
  }
}

export type MissionFilter = { category?: string; level?: number; maxDuration?: number };

export async function listMissions(filter: MissionFilter = {}): Promise<MissionView[]> {
  const rows = await prisma.mission.findMany({
    where: {
      active: true,
      ...(filter.category ? { category: filter.category } : {}),
      ...(filter.level ? { levelMin: { lte: filter.level }, levelMax: { gte: filter.level } } : {}),
      ...(filter.maxDuration ? { durationMin: { lte: filter.maxDuration } } : {}),
    },
    orderBy: [{ levelMin: "asc" }, { durationMin: "asc" }],
  });
  return rows.map(toMissionView);
}

export async function getMissionByIdOrSlug(idOrSlug: string): Promise<MissionView | null> {
  const row = await prisma.mission.findFirst({
    where: { active: true, OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
  });
  return row ? toMissionView(row) : null;
}

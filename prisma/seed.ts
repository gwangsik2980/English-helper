import { PrismaClient } from "@prisma/client";
import { MISSION_SEEDS } from "../src/server/missions/catalog";

const prisma = new PrismaClient();

async function main() {
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
  console.log(`Seeded ${MISSION_SEEDS.length} missions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

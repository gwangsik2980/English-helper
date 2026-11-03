import Link from "next/link";
import { MissionCard } from "@/features/missions/MissionCard";
import { prisma } from "@/server/db";
import { requirePageUser } from "@/server/http";
import { listMissions } from "@/server/repositories/missions";
import { CATEGORIES, CATEGORY_LABEL_KO, LEVEL_LABEL_KO, LEVELS } from "@/shared/schemas/domain";

export const metadata = { title: "미션 · ENGLISH QUEST" };

const OUTCOME_KO: Record<string, string> = {
  all_met: "✓ 목표 모두 달성",
  partial: "◐ 일부 달성",
  none: "○ 다시 도전해 보세요",
  undetermined: "· 판단 보류",
};

type Search = { category?: string; level?: string; maxDuration?: string };

export default async function MissionsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const userId = await requirePageUser();
  const sp = await searchParams;
  const category = CATEGORIES.find((c) => c === sp.category);
  const level = [1, 2, 3].find((n) => String(n) === sp.level);
  const maxDuration = [5, 6, 8, 10].find((n) => String(n) === sp.maxDuration);

  const [missions, progress] = await Promise.all([
    listMissions({ category, level, maxDuration }),
    prisma.userMissionProgress.findMany({ where: { userId } }),
  ]);
  const byMission = new Map(progress.map((p) => [p.missionId, p]));
  const activeFilters = [category, level, maxDuration].filter(Boolean).length;

  return (
    <div className="space-y-8">
      <header className="text-center">
        <p className="reveal inline-flex rounded-full border border-line px-4 py-1.5">
          <span className="eyebrow">Missions</span>
        </p>
        <h1 className="display reveal-lines mx-auto mt-5 w-fit text-4xl sm:text-5xl">
          <span className="line">
            <span>미션 둘러보기</span>
          </span>
        </h1>
      </header>

      <details className="card-soft" open={activeFilters > 0}>
        <summary className="cursor-pointer text-sm font-semibold">
          필터 {activeFilters > 0 ? `· ${activeFilters}개 적용 중` : ""}
        </summary>
        <form method="get" className="mt-4 grid gap-3 sm:grid-cols-4 sm:items-end">
          <div>
            <label htmlFor="category" className="label">
              카테고리
            </label>
            <select id="category" name="category" defaultValue={category ?? ""} className="input bg-white">
              <option value="">전체</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL_KO[c]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="level" className="label">
              레벨
            </label>
            <select id="level" name="level" defaultValue={level ? String(level) : ""} className="input bg-white">
              <option value="">전체</option>
              {LEVELS.map((l, i) => (
                <option key={l} value={i + 1}>
                  {LEVEL_LABEL_KO[l]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="maxDuration" className="label">
              시간
            </label>
            <select
              id="maxDuration"
              name="maxDuration"
              defaultValue={maxDuration ? String(maxDuration) : ""}
              className="input bg-white"
            >
              <option value="">전체</option>
              <option value="5">5분 이하</option>
              <option value="6">6분 이하</option>
              <option value="8">8분 이하</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1">
              적용
            </button>
            <Link href="/missions" className="btn-ghost">
              초기화
            </Link>
          </div>
        </form>
      </details>

      <p role="status" className="text-sm text-muted">
        미션 {missions.length}개
      </p>
      {missions.length === 0 ? (
        <div className="card-soft py-10 text-center">
          <p className="font-semibold">조건에 맞는 미션이 없어요.</p>
          <p className="mt-1 text-sm text-muted">필터를 줄이거나 초기화해 보세요.</p>
        </div>
      ) : (
        <ul className="grid gap-6 md:grid-cols-2">
          {missions.map((m, i) => {
            const p = byMission.get(m.id);
            return (
              <li key={m.id}>
                <MissionCard
                  mission={m}
                  delay={Math.min(i, 5) * 90}
                  status={
                    p ? `${p.completionCount}회 완료 · ${OUTCOME_KO[p.bestOutcome ?? "undetermined"]}` : "아직 안 해 본 미션"
                  }
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

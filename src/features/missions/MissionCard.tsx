import Link from "next/link";
import { CATEGORY_LABEL_KO, LEVEL_LABEL_KO, LEVELS, type MissionView } from "@/shared/schemas/domain";

export function levelRangeKo(min: number, max: number) {
  const a = LEVEL_LABEL_KO[LEVELS[min - 1]];
  const b = LEVEL_LABEL_KO[LEVELS[max - 1]];
  return a === b ? a : `${a}~${b}`;
}

export function MissionMeta({ mission }: { mission: MissionView }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <span className="chip">{CATEGORY_LABEL_KO[mission.category]}</span>
      <span className="chip">권장 {levelRangeKo(mission.levelMin, mission.levelMax)}</span>
      <span className="chip">약 {mission.durationMin}분</span>
    </div>
  );
}

export function MissionCard({
  mission,
  note,
  status,
}: {
  mission: MissionView;
  note?: string;
  status?: string;
}) {
  return (
    <article className="card flex h-full flex-col gap-3">
      <MissionMeta mission={mission} />
      <div>
        <h3 className="text-base font-bold">
          <Link href={`/missions/${mission.slug}`} className="hover:underline">
            {mission.title}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-muted">{mission.scenario.summaryKo}</p>
      </div>
      <p className="text-sm">
        <span className="font-semibold">학습 포인트 </span>
        <span className="text-muted">{mission.scenario.learningPointsKo.join(" · ")}</span>
      </p>
      {note && <p className="rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand">{note}</p>}
      {status && <p className="mt-auto text-xs font-semibold text-muted">{status}</p>}
    </article>
  );
}

import Link from "next/link";
import { ArrowUpRight, LogoMark } from "@/features/ui/Icons";
import { CATEGORY_LABEL_KO, LEVEL_LABEL_KO, LEVELS, type MissionView } from "@/shared/schemas/domain";

export function levelRangeKo(min: number, max: number) {
  const a = LEVEL_LABEL_KO[LEVELS[min - 1]];
  const b = LEVEL_LABEL_KO[LEVELS[max - 1]];
  return a === b ? a : `${a}~${b}`;
}

export function MissionMeta({ mission, tone = "dark" }: { mission: MissionView; tone?: "dark" | "light" }) {
  const cls = tone === "light" ? "text-white/50" : "text-muted";
  return (
    <p className={`text-xs font-medium uppercase tracking-wide ${cls}`}>
      {CATEGORY_LABEL_KO[mission.category]} · 권장 {levelRangeKo(mission.levelMin, mission.levelMax)} · 약 {mission.durationMin}분
    </p>
  );
}

/** Ink card in the reference "Portfolio" style. The whole card is the link. */
export function MissionCard({ mission, status, delay = 0 }: { mission: MissionView; status?: string; delay?: number }) {
  return (
    <Link
      href={`/missions/${mission.slug}`}
      className="reveal nudge-group block rounded-[2rem]"
      style={{ ["--delay" as string]: `${delay}ms`, ["--rise" as string]: "40px" }}
    >
      <article className="card-ink nudge-lift flex min-h-[20rem] flex-col sm:min-h-[22rem] sm:p-8">
        <div className="flex items-start justify-between gap-3">
          <MissionMeta mission={mission} tone="light" />
          <span className="nudge-rotate grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 ring-1 ring-white/15">
            <ArrowUpRight />
          </span>
        </div>
        <LogoMark aria-hidden className="pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 text-[4.5rem] text-white/10" />
        <div className="relative mt-auto pt-16">
          <h3 className="text-2xl font-medium tracking-tight sm:text-3xl">{mission.title}</h3>
          <p className="mt-2 max-w-md text-sm text-white/60">{mission.scenario.summaryKo}</p>
          <ul className="mt-5 flex flex-wrap gap-2" aria-label="학습 포인트">
            {mission.scenario.learningPointsKo.map((p) => (
              <li key={p} className="tag-chip">
                {p}
              </li>
            ))}
          </ul>
          {status && <p className="mt-4 text-xs font-medium text-white/50">{status}</p>}
        </div>
      </article>
    </Link>
  );
}

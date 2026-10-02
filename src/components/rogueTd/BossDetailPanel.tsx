import type { Monster, MonsterCategory } from "../../games/rogueTd/types";

interface Props {
  boss: Monster;
  gameNowMs: number;
}

const CATEGORY_LABELS: Array<{ id: MonsterCategory; label: string }> = [
  { id: "human", label: "인간형" },
  { id: "land", label: "육지형" },
  { id: "flying", label: "조류형" },
];
const STAGE05_PORTRAIT = new URL(
  "../../images/boss-stage05-lich-portrait.png",
  import.meta.url,
).href;
const STAGE10_PORTRAIT = new URL(
  "../../images/boss-stage10-armored-beast-portrait.png",
  import.meta.url,
).href;
const STAGE15_PORTRAIT = new URL(
  "../../images/boss-stage15-phoenix-portrait.png",
  import.meta.url,
).href;
const STAGE15_EGG_PORTRAIT = new URL(
  "../../images/boss-stage15-egg-portrait.png",
  import.meta.url,
).href;

const BOSS_NAMES: Record<number, string> = {
  5: "황혼의 리치",
  10: "용암갑주 베히모스",
  15: "영겁의 불사조",
  20: "20스테이지 보스",
  25: "25스테이지 보스",
  30: "30스테이지 보스",
  33: "인간형 최종 보스",
  34: "육지형 최종 보스",
  35: "조류형 최종 보스",
  36: "FINAL BOSS",
};

const formatSeconds = (milliseconds: number) =>
  `${Math.max(0, Math.ceil(milliseconds / 100) / 10).toFixed(1)}초`;

export default function BossDetailPanel({ boss, gameNowMs }: Props) {
  const stage = boss.bossStage ?? 0;
  const isStage05 = stage === 5;
  const isStage10 = stage === 10;
  const isStage15 = stage === 15;
  const stage15State = boss.stage15State ?? "phoenix";
  const isStage10Stomping =
    boss.stage10StompImpactAtMs !== undefined &&
    gameNowMs < boss.stage10StompImpactAtMs;
  const displayedMaxHp = isStage15 && stage15State !== "phoenix"
    ? boss.stage15EggMaxHp ?? boss.maxHp
    : boss.maxHp;
  const hpPercent = displayedMaxHp > 0 ? (boss.hp / displayedMaxHp) * 100 : 0;
  const hpTone = hpPercent < 20
    ? "bossHpDanger"
    : hpPercent < 50
      ? "bossHpWarning"
      : "bossHpHealthy";
  const state = isStage15
    ? stage15State === "transforming"
      ? "불타는 알로 변신 중"
      : stage15State === "egg"
        ? "부활 준비 중 · 받는 피해 30% 감소"
        : stage15State === "hatching"
          ? "불길 속에서 부화 중"
          : "비행 중"
    : isStage10
    ? isStage10Stomping
      ? "대지 강타 준비 중"
      : "이동 중"
    : boss.stage05AbsorbingUntilMs !== undefined
      ? "생명력 흡수 중"
      : boss.stage05SummoningUntilMs !== undefined
        ? "스켈레톤 소환 중"
        : boss.stage05ShieldActive
          ? "소환 보호막 · 무적"
          : "이동 중";
  const timerLabel = isStage15
    ? stage15State === "egg" && boss.stage15ReviveAtMs !== undefined
      ? `부활까지 ${formatSeconds(boss.stage15ReviveAtMs - gameNowMs)}`
      : stage15State === "transforming" && boss.stage15PhaseEndsAtMs !== undefined
        ? `알 형성까지 ${formatSeconds(boss.stage15PhaseEndsAtMs - gameNowMs)}`
        : stage15State === "hatching" && boss.stage15PhaseEndsAtMs !== undefined
          ? `부화까지 ${formatSeconds(boss.stage15PhaseEndsAtMs - gameNowMs)}`
          : "다음 소멸 시 발동"
    : isStage10
    ? isStage10Stomping && boss.stage10StompImpactAtMs !== undefined
      ? `강타까지 ${formatSeconds(boss.stage10StompImpactAtMs - gameNowMs)}`
      : boss.stage10NextStompAtMs !== undefined
        ? `다음 강타까지 ${formatSeconds(boss.stage10NextStompAtMs - gameNowMs)}`
        : "발동 대기"
    : boss.stage05AbsorbingUntilMs !== undefined
      ? `흡수 완료까지 ${formatSeconds(boss.stage05AbsorbingUntilMs - gameNowMs)}`
      : boss.stage05SummoningUntilMs !== undefined
        ? `소환 완료까지 ${formatSeconds(boss.stage05SummoningUntilMs - gameNowMs)}`
        : boss.stage05ShieldActive && boss.stage05AbsorbAtMs !== undefined
          ? `강제 흡수까지 ${formatSeconds(boss.stage05AbsorbAtMs - gameNowMs)}`
          : boss.stage05NextSummonAtMs !== undefined
            ? `다음 소환까지 ${formatSeconds(boss.stage05NextSummonAtMs - gameNowMs)}`
            : "발동 대기";

  return (
    <section className="unitDetailPanel bossDetailPanel panelBox">
      {isStage05 ? (
        <img
          className="bossDetailPortrait"
          src={STAGE05_PORTRAIT}
          alt="황혼의 리치 포트레이트"
        />
      ) : isStage10 ? (
        <img
          className="bossDetailPortrait"
          src={STAGE10_PORTRAIT}
          alt="용암갑주 베히모스 포트레이트"
        />
      ) : isStage15 ? (
        <img
          className="bossDetailPortrait"
          src={stage15State === "phoenix" ? STAGE15_PORTRAIT : STAGE15_EGG_PORTRAIT}
          alt={stage15State === "phoenix" ? "영겁의 불사조 전체 모습" : "영겁의 불사조의 알"}
        />
      ) : (
        <div className="bossDetailPortrait bossPortraitFallback" aria-label="보스 포트레이트">
          <span>BOSS</span>
        </div>
      )}
      <div className="unitDetailStats bossDetailStats">
        <div className="unitDetailHeading bossDetailHeading">
          <span>BOSS · STAGE {stage}</span>
          <strong>{BOSS_NAMES[stage] ?? `${stage}스테이지 보스`}</strong>
        </div>

        <dl>
          <div className="bossHpRow">
            <dt>체력</dt>
            <dd className={hpTone}>{Math.max(0, Math.ceil(boss.hp)).toLocaleString()} / {displayedMaxHp.toLocaleString()}</dd>
          </div>
          <div>
            <dt>형태</dt>
            <dd className="bossCategoryLights">
              {CATEGORY_LABELS.map((category) => (
                <span
                  key={category.id}
                  className={boss.category === category.id ? "active" : ""}
                >
                  {category.label}
                </span>
              ))}
            </dd>
          </div>
          <div><dt>이동속도</dt><dd>{boss.speedTilesPerSecond.toFixed(2)}칸/초</dd></div>
          <div><dt>현재 상태</dt><dd className={boss.stage05ShieldActive ? "bossStateActive" : ""}>{state}</dd></div>
          {(isStage05 || isStage10 || isStage15) && <div><dt>스킬 시간</dt><dd>{timerLabel}</dd></div>}
          <div><dt>완주 횟수</dt><dd>{boss.laps}회</dd></div>
        </dl>

        <div className="unitSpecialEffect bossSkillDescription">
          <strong>{isStage05
            ? "스킬 · 망자의 부름"
            : isStage10
              ? "스킬 · 대지 강타"
              : isStage15
                ? "스킬 · 영겁의 환생"
              : "스킬"}</strong>
          <p>{isStage05
            ? "등장 8초 후 스켈레톤 5마리를 소환한다. 소환수가 존재하는 동안 무적이 되며, 15초 안에 처치하지 못하면 남은 스켈레톤의 체력을 흡수해 회복한다."
            : isStage10
              ? "이동을 멈추고 주변 3칸에 강력한 충격파를 일으킨다. 범위 안의 유닛은 3초 동안 기절해 공격할 수 없다."
              : isStage15
                ? "체력이 모두 소진되면 최대 체력의 30%를 지닌 불타는 알로 변한다. 알은 받는 피해가 30% 감소하며, 8초 안에 파괴하지 못하면 최대 체력의 50%로 부활한다."
            : "고유 스킬 정보 준비 중"}</p>
        </div>
      </div>
    </section>
  );
}

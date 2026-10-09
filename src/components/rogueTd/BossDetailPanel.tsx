import type { Monster, MonsterCategory } from "../../games/rogueTd/types";
import { STAGE20_SHIELD_RATIO } from "../../games/rogueTd/constants";

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
const STAGE20_PORTRAIT = new URL(
  "../../images/boss-stage20-fortress-knight-portrait.png",
  import.meta.url,
).href;
const STAGE25_PORTRAIT = new URL(
  "../../images/boss-stage25-morgaron-portrait.png",
  import.meta.url,
).href;
const STAGE30_PORTRAIT = new URL(
  "../../images/boss-stage30-astrayon-portrait.png",
  import.meta.url,
).href;
const FINAL_BOSS_CORE_PORTRAIT = new URL(
  "../../images/final-boss-phase4-core.png",
  import.meta.url,
).href;

const BOSS_NAMES: Record<number, string> = {
  5: "황혼의 리치",
  10: "용암갑주 베히모스",
  15: "영겁의 불사조",
  20: "자색 성채의 기사 바르카인",
  25: "산맥거북 모르가론",
  30: "천공요새 아스트라온",
  36: "FINAL BOSS",
};

const formatSeconds = (milliseconds: number) =>
  `${Math.max(0, Math.ceil(milliseconds / 100) / 10).toFixed(1)}초`;

export default function BossDetailPanel({ boss, gameNowMs }: Props) {
  const stage = boss.bossStage ?? 0;
  const isStage05 = stage === 5;
  const isStage10 = stage === 10;
  const isStage15 = stage === 15;
  const isStage20 = stage === 20;
  const isStage25 = stage === 25;
  const isStage30 = stage === 30;
  const isFinalBoss = boss.isFinalBoss || stage === 36;
  const stage15State = boss.stage15State ?? "phoenix";
  const stage20ShieldMaxHp = boss.stage20ShieldMaxHp ?? Math.max(
    1,
    Math.round(boss.hp * STAGE20_SHIELD_RATIO),
  );
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
  const state = isStage20
    ? boss.stage20State === "charging"
      ? (boss.stage20ShieldHp ?? 0) > 0 ? "보호막 재충전 중" : "보호막 생성 중"
      : boss.stage20State === "shielded"
        ? "성채 보호막 · 이동속도 80% 감소"
        : boss.stage20State === "stunned"
          ? "보호막 파괴 · 기절 · 받는 피해 2배"
          : "이동 중"
    : isStage30
    ? boss.stage30TeleportEndsAtMs !== undefined
      ? "자력 도약 충전 중"
      : boss.stage30WeakUntilMs !== undefined
        ? "동력핵 노출 · 받는 피해 50% 증가"
        : `궤도 방위체계 · 부유석 ${boss.stage30StoneCount ?? 0}개`
    : isStage25
    ? boss.stage25CastEndsAtMs !== undefined
      ? "대지 에너지 흡수 중"
      : "이동 중"
    : isStage15
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
  const timerLabel = isStage20
    ? boss.stage20State === "charging" && boss.stage20CastEndsAtMs !== undefined
      ? `전개까지 ${formatSeconds(boss.stage20CastEndsAtMs - gameNowMs)}`
      : boss.stage20State === "shielded" && boss.stage20NextShieldAtMs !== undefined
        ? `재충전까지 ${formatSeconds(boss.stage20NextShieldAtMs - gameNowMs)}`
        : boss.stage20State === "stunned" && boss.stage20StunnedUntilMs !== undefined
          ? `기절 해제까지 ${formatSeconds(boss.stage20StunnedUntilMs - gameNowMs)}`
          : boss.stage20NextShieldAtMs !== undefined
            ? `다음 보호막까지 ${formatSeconds(boss.stage20NextShieldAtMs - gameNowMs)}`
            : "발동 대기"
    : isStage30
    ? boss.stage30TeleportEndsAtMs !== undefined
      ? `도약까지 ${formatSeconds(boss.stage30TeleportEndsAtMs - gameNowMs)}`
      : boss.stage30WeakUntilMs !== undefined
        ? `부유석 복구까지 ${formatSeconds(boss.stage30WeakUntilMs - gameNowMs)}`
        : boss.stage30NextTeleportAtMs !== undefined
          ? `다음 도약까지 ${formatSeconds(boss.stage30NextTeleportAtMs - gameNowMs)}`
          : "발동 대기"
    : isStage25
    ? boss.stage25CastEndsAtMs !== undefined
      ? `재편까지 ${formatSeconds(boss.stage25CastEndsAtMs - gameNowMs)}`
      : boss.stage25NextReforgeAtMs !== undefined
        ? `다음 재편까지 ${formatSeconds(boss.stage25NextReforgeAtMs - gameNowMs)}`
        : "발동 대기"
    : isStage15
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
      {isFinalBoss ? (
        <img
          className="bossDetailPortrait finalBossCorePortrait"
          src={FINAL_BOSS_CORE_PORTRAIT}
          alt="최종 보스의 핵"
        />
      ) : isStage05 ? (
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
      ) : isStage20 ? (
        <img
          className="bossDetailPortrait"
          src={STAGE20_PORTRAIT}
          alt="20스테이지 보스 전체 모습"
        />
      ) : isStage25 ? (
        <img
          className="bossDetailPortrait"
          src={STAGE25_PORTRAIT}
          alt="산맥거북 모르가론 전체 모습"
        />
      ) : isStage30 ? (
        <img
          className="bossDetailPortrait"
          src={STAGE30_PORTRAIT}
          alt="천공요새 아스트라온 전체 모습"
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
              {boss.isFinalBoss && boss.finalBossPhase === 4
                ? <span className="active">???</span>
                : CATEGORY_LABELS.map((category) => (
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
          {isStage20 && (
            <div><dt>보호막</dt><dd className="bossShieldValue">{Math.ceil(boss.stage20ShieldHp ?? 0).toLocaleString()} / {stage20ShieldMaxHp.toLocaleString()}</dd></div>
          )}
          {isStage30 && (
            <div><dt>부유석</dt><dd className="bossShieldValue">{boss.stage30StoneCount ?? 0}/4 · {Math.ceil(boss.stage30StoneHp ?? 0).toLocaleString()} / {(boss.stage30StoneMaxHp ?? 0).toLocaleString()}</dd></div>
          )}
          {(isStage05 || isStage10 || isStage15 || isStage20 || isStage25 || isStage30) && <div><dt>스킬 시간</dt><dd>{timerLabel}</dd></div>}
        </dl>

        <div className="unitSpecialEffect bossSkillDescription">
          <strong>{isStage05
            ? "스킬 · 망자의 부름"
            : isStage10
              ? "스킬 · 대지 강타"
              : isStage15
                ? "스킬 · 영겁의 환생"
                : isStage20
                  ? "스킬 · 성채의 맹세"
                  : isStage25
                    ? "스킬 · 대지의 재편"
                    : isStage30
                      ? "스킬 · 궤도 방위체계 / 자력 도약"
              : "스킬"}</strong>
          <p>{isStage05
            ? "등장 8초 후 스켈레톤 5마리를 소환한다. 소환수가 존재하는 동안 무적이 되며, 15초 안에 처치하지 못하면 남은 스켈레톤의 체력을 흡수해 회복한다."
            : isStage10
              ? "이동을 멈추고 주변 3칸에 강력한 충격파를 일으킨다. 범위 안의 유닛은 3초 동안 기절해 공격할 수 없다."
              : isStage15
                ? "체력이 모두 소진되면 불타는 알로 변한다. 첫 알은 최대 체력의 30%, 두 번째 알부터는 첫 알 체력의 70%로 시작한다. 알은 받는 피해가 30% 감소하며, 15초 안에 파괴하지 못하면 최대 체력의 50%로 부활한다."
                : isStage20
                  ? "빛을 모아 현재 체력의 70%인 보호막을 전개한다. 보호막은 4구간으로 나뉘며, 15초마다 현재 수치의 다음 구간까지만 회복한다. 보호막은 피해를 50% 줄이고 이동속도를 80% 낮춘다. 파괴하면 5초간 기절하며 받는 피해가 2배가 되고, 파괴 시점부터 15초 후 새 보호막 충전을 시작한다."
                  : isStage25
                    ? "15초마다 이동을 멈추고 대지의 기운을 흡수한다. 붉게 예고된 5칸 중 빈 칸에는 자연벽을 세우고, 벽이 있는 칸은 종류와 관계없이 파괴해 이동 경로를 바꾼다. 파괴된 벽 위 유닛은 창고로 회수된다."
                    : isStage30
                      ? "부유석 4개가 피해 일부를 흡수한다. 모두 파괴하면 5초간 동력핵이 노출되어 받는 피해가 50% 증가한다. 부유석이 남아 있으면 무작위 경로로 자력 도약해 주변 2칸의 유닛을 3초간 기절시킨다."
            : "고유 스킬 정보 준비 중"}</p>
        </div>
      </div>
    </section>
  );
}

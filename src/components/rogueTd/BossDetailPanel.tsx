import type { Monster, MonsterCategory } from "../../games/rogueTd/types";
import { STAGE20_SHIELD_RATIO } from "../../games/rogueTd/constants";
import { FINAL_BOSS_LIGHT_DRAIN, getBossSkills } from "../../games/rogueTd/bossSkillInfo";

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
  36: "찬휘의 군주 아르카디온",
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
  const detailSkills = getBossSkills(stage, boss.finalBossPhase ?? 1);
  const stage15State = boss.stage15State ?? "phoenix";
  const stage20ShieldMaxHp = boss.stage20ShieldMaxHp ?? Math.max(
    1,
    Math.round(boss.hp * STAGE20_SHIELD_RATIO),
  );
  const finalBossPhase2ShieldMaxHp = boss.finalBossPhase2ShieldMaxHp ?? Math.max(1, Math.round(boss.maxHp * 0.2));
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
  const state = isFinalBoss
    ? boss.finalBossMode !== "combat"
      ? "빛 흡수·형태 전환 중"
      : `${boss.finalBossPhase ?? 1}페이즈 전투 중`
    : isStage20
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
  const timerLabel = isFinalBoss
    ? boss.finalBossPhase === 1 && boss.finalBossNextSkillAtMs !== undefined
      ? `다음 찬탈까지 ${formatSeconds(boss.finalBossNextSkillAtMs - gameNowMs)}`
      : boss.finalBossPhase === 2 && (boss.finalBossPhase2ShieldHp ?? 0) > 0 && boss.finalBossPhase2ShieldEndsAtMs !== undefined
        ? `갑주 폭발까지 ${formatSeconds(boss.finalBossPhase2ShieldEndsAtMs - gameNowMs)}`
        : boss.finalBossPhase === 2 && boss.finalBossPhase2NextShieldAtMs !== undefined
          ? `다음 빙결 갑주까지 ${formatSeconds(boss.finalBossPhase2NextShieldAtMs - gameNowMs)}`
          : boss.finalBossPhase === 2 && boss.finalBossPhase2StunnedUntilMs !== undefined && gameNowMs < boss.finalBossPhase2StunnedUntilMs
            ? `정지 해제까지 ${formatSeconds(boss.finalBossPhase2StunnedUntilMs - gameNowMs)}`
          : boss.finalBossPhase === 3 && boss.finalBossPhase3DiveImpactAtMs !== undefined
            ? `급강하까지 ${formatSeconds(boss.finalBossPhase3DiveImpactAtMs - gameNowMs)}`
          : boss.finalBossPhase === 3 && boss.finalBossPhase3NextDiveAtMs !== undefined
            ? `다음 급강하까지 ${formatSeconds(boss.finalBossPhase3NextDiveAtMs - gameNowMs)}`
          : boss.finalBossPhase === 4 && boss.finalBossPhase4NextComboAtMs !== undefined
            ? `다음 권능 폭주까지 ${formatSeconds(boss.finalBossPhase4NextComboAtMs - gameNowMs)}`
      : "발동 대기"
    : isStage20
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
          {isFinalBoss && (
            <div><dt>빛 흡수</dt><dd className="bossLightDrainValue">{FINAL_BOSS_LIGHT_DRAIN[boss.finalBossPhase ?? 1]}</dd></div>
          )}
          {isStage20 && (
            <div><dt>보호막</dt><dd className="bossShieldValue">{Math.ceil(boss.stage20ShieldHp ?? 0).toLocaleString()} / {stage20ShieldMaxHp.toLocaleString()}</dd></div>
          )}
          {isFinalBoss && (boss.finalBossPhase === 2 || boss.finalBossPhase === 4) && (boss.finalBossPhase2ShieldMaxHp ?? 0) > 0 && (
            <div><dt>빙결 갑주</dt><dd className="bossShieldValue">{Math.ceil(boss.finalBossPhase2ShieldHp ?? 0).toLocaleString()} / {finalBossPhase2ShieldMaxHp.toLocaleString()}</dd></div>
          )}
          {isStage30 && (
            <div><dt>부유석</dt><dd className="bossShieldValue">{boss.stage30StoneCount ?? 0}/4 · {Math.ceil(boss.stage30StoneHp ?? 0).toLocaleString()} / {(boss.stage30StoneMaxHp ?? 0).toLocaleString()}</dd></div>
          )}
          {(isFinalBoss || isStage05 || isStage10 || isStage15 || isStage20 || isStage25 || isStage30) && <div><dt>스킬 시간</dt><dd>{timerLabel}</dd></div>}
        </dl>

        <div className="unitTierSkill bossTierSkill">
          <strong>스킬</strong>
          <div className="unitSkillIconRow bossSkillIconList" aria-label="보스 스킬">
            {detailSkills.map((skill) => (
              <span
                className="unitSkillIcon bossSkillIcon"
                key={skill.name}
                tabIndex={0}
                aria-label={`${skill.name}: ${skill.description}`}
              >
                <img src={skill.icon} alt={skill.name} />
                <span className="unitSkillTooltip bossSkillTooltip" role="tooltip">
                  <b>{skill.name}</b>
                  <em>{skill.description}</em>
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

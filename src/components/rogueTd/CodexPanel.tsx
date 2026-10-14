import { useEffect, useState } from "react";
import {
  getUnitTierAttackSpeedBonus,
  getUnitTierDamageMultiplier,
  getUnitTierRangeBonus,
  getBossHp,
  MONSTER_STATS,
  UNIT_TYPES,
  getUnitUpgradeDamageMultiplier,
} from "../../games/rogueTd/constants";
import type { UnitTypeId } from "../../games/rogueTd/types";
import { UNIT_PORTRAIT_CLASSES, UNIT_SPRITE_CLASSES } from "../../games/rogueTd/unitSprites";
import { UNIT_TIER2_SKILL_ICONS, UNIT_TIER3_SKILL_ICONS } from "../../games/rogueTd/unitSprites";
import { getTierThreeSkill, getTierTwoSkill } from "../../games/rogueTd/unitSkillInfo";
import { BOSS_SKILLS, FINAL_BOSS_SKILLS } from "../../games/rogueTd/bossSkillInfo";

type CodexTab = "units" | "enemies" | "ultimates";
type UnitTier = 1 | 2 | 3;

const TABS: Array<{ id: CodexTab; label: string }> = [
  { id: "units", label: "유닛" },
  { id: "enemies", label: "적유닛" },
  { id: "ultimates", label: "필살 스킬" },
];
const UNIT_IDS = Object.keys(UNIT_TYPES) as UnitTypeId[];
const CLASS_LABELS = { warrior: "전사", mage: "마법사", ranger: "사수" } as const;
const ATTACK_TYPE_LABELS = { balance: "밸런스형", land_spec: "육지형", air_spec: "비행형" } as const;
const ROLE_DESCRIPTIONS: Record<UnitTypeId, string> = {
  swordsman: "안정적인 성능을 가진 근접 전사입니다.",
  dual_swordsman: "빠른 두 번의 공격으로 적을 베는 근접 전사입니다.",
  magic_swordsman: "공격한 적 주변까지 함께 타격하는 범위 전사입니다.",
  fire_mage: "주 대상 주변으로 피해를 확산시키는 마법사입니다.",
  ice_mage: "둔화와 프로즌 오브로 길목을 제어하는 마법사입니다.",
  lightning_mage: "번개를 전이시키고 적을 마비시키는 마법사입니다.",
  rifleman: "긴 사거리에서 안정적인 단일 피해를 주는 사수입니다.",
  shotgunner: "가까운 다수의 적에게 산탄을 퍼붓는 범위 사수입니다.",
  sniper: "초장거리에서 강한 단일 피해를 주는 저격수입니다.",
};
const SPECIAL_EFFECTS: Record<UnitTypeId, { name: string; description: string }> = {
  swordsman: { name: "단일 공격", description: "사거리 안의 적 한 명을 공격합니다." },
  dual_swordsman: { name: "쌍검", description: "한 번 공격할 때 두 검으로 나누어 2회 타격합니다." },
  magic_swordsman: { name: "마력 범위베기", description: "주 대상을 공격하면서 주변에 있는 적을 최대 2명까지 함께 타격합니다." },
  fire_mage: { name: "화염 확산", description: "기본 공격 시 30% 확률로 대상 주변 1.5칸의 적에게 범위 피해를 줍니다." },
  ice_mage: { name: "냉기 둔화", description: "기본 공격 시 10% 확률로 대상 주변의 적을 1초 동안 50% 둔화시킵니다." },
  lightning_mage: { name: "번개 마비", description: "기본 공격 시 15% 확률로 대상을 1초 동안 마비시켜 움직이지 못하게 합니다." },
  rifleman: { name: "정밀 사격", description: "긴 사거리에서 적 한 명에게 안정적인 피해를 줍니다." },
  shotgunner: { name: "산탄 사격", description: "부채꼴 범위 안의 여러 적을 공격합니다. 대상이 가까울수록 강하며 거리에 따라 100%에서 50%까지 피해가 감소합니다." },
  sniper: { name: "저격", description: "매우 먼 거리의 적 한 명을 공격하며, 기본 공격 시 5% 확률로 일반 적을 즉사시킵니다." },
};
const ENEMY_ENTRIES = [
  { label: "인간형", sub: "일반 적", spriteClass: "enemyHumanSprite", speed: MONSTER_STATS.human.speed, description: "균형 잡힌 능력으로 길을 따라 진군하는 병사입니다. 특별히 두드러진 약점 없이 안정적인 속도로 방어선을 압박합니다." },
  { label: "육지형", sub: "일반 적", spriteClass: "enemyLandSprite", speed: MONSTER_STATS.land.speed, description: "단단한 몸으로 공격을 버티며 전진하는 지상 괴수입니다. 이동은 느리지만 높은 생존력으로 화력을 오래 받아냅니다." },
  { label: "비행형", sub: "일반 적", spriteClass: "enemyFlySprite", speed: MONSTER_STATS.flying.speed, description: "공중에서 빠르게 길을 돌파하는 비행 괴수입니다. 내구력은 낮지만 빠른 이동으로 방어선의 빈틈을 노립니다." },
  { label: "5스테이지 보스", sub: "황혼의 리치", hp: getBossHp(5), speed: MONSTER_STATS.human.speed, description: "죽은 병사를 불러내는 사령술사입니다. 소환수를 방패로 삼아 전장을 장악하고, 남은 생명력을 흡수해 끈질기게 버팁니다.", skills: [{ name: "망자의 부름", description: "스켈레톤 5마리를 소환하고 소환수가 남아 있는 동안 무적이 됩니다. 제한시간 내 처치하지 못한 소환수의 체력을 흡수합니다." }], image: new URL("../../images/boss-stage05-lich-portrait.png", import.meta.url).href },
  { label: "10스테이지 보스", sub: "용암갑주 베히모스", hp: getBossHp(10), speed: MONSTER_STATS.land.speed, description: "용암으로 달궈진 갑주를 두른 거대 괴수입니다. 육중한 몸으로 진군하며 강력한 충격으로 주변 방어선을 흔듭니다.", skills: [{ name: "대지 강타", description: "이동을 멈추고 주변 3칸에 충격파를 일으켜 범위 안 아군을 3초간 기절시킵니다." }], image: new URL("../../images/boss-stage10-armored-beast-portrait.png", import.meta.url).href },
  { label: "15스테이지 보스", sub: "영겁의 불사조", hp: getBossHp(15), speed: MONSTER_STATS.flying.speed, description: "꺼지지 않는 불꽃에서 되살아나는 불사조입니다. 쓰러질 때마다 다시 날아올라 방어선에 반복해서 위협을 가합니다.", skills: [{ name: "영겁의 환생", description: "체력이 소진되면 불타는 알로 변합니다. 제한시간 안에 알을 파괴하지 못하면 최대 체력의 50%로 부활합니다." }], image: new URL("../../images/boss-stage15-phoenix-portrait.png", import.meta.url).href },
  { label: "20스테이지 보스", sub: "자색 성채의 기사 바르카인", hp: getBossHp(20), speed: MONSTER_STATS.human.speed, description: "자색 성채의 힘을 두른 수호 기사입니다. 견고한 보호막으로 피해를 막아내며 방어가 무너진 순간에만 빈틈을 드러냅니다.", skills: [{ name: "성채의 맹세", description: "현재 체력의 70%만큼 보호막을 생성합니다. 보호막을 파괴하면 잠시 기절하고 받는 피해가 증가합니다." }], image: new URL("../../images/boss-stage20-fortress-knight-portrait.png", import.meta.url).href },
  { label: "25스테이지 보스", sub: "산맥거북 모르가론", hp: getBossHp(25), speed: MONSTER_STATS.land.speed * 0.5, description: "산맥처럼 거대한 등껍질을 지닌 고대 거북입니다. 매우 느리지만 압도적인 방어력과 재생력으로 장기전을 강요합니다.", skills: [{ name: "대지의 재편", description: "예고된 5칸의 지형을 바꿉니다. 빈칸에는 자연벽을 세우고 기존 벽은 파괴해 이동 경로를 변화시킵니다." }], image: new URL("../../images/boss-stage25-morgaron-portrait.png", import.meta.url).href },
  { label: "30스테이지 보스", sub: "천공요새 아스트라온", hp: getBossHp(30), speed: MONSTER_STATS.flying.speed, description: "하늘을 떠도는 거대한 생체 요새입니다. 전장을 가로지르며 위치를 바꾸고 여러 방어 장치로 공격을 분산시킵니다.", skills: [{ name: "궤도 방위체계", description: "부유석 4개가 피해 일부를 흡수합니다. 모두 파괴하면 동력핵이 노출되어 받는 피해가 증가합니다." }, { name: "자력 도약", description: "무작위 경로로 순간이동한 뒤 주변 아군을 기절시킵니다." }], image: new URL("../../images/boss-stage30-astrayon-portrait.png", import.meta.url).href },
  { label: "최종 스테이지 보스", sub: "찬휘의 군주 아르카디온", hp: getBossHp(36), speed: MONSTER_STATS.human.speed, description: "쓰러진 강자들의 빛과 권능을 찬탈해 자신의 것으로 만든 최후의 군주입니다. 전투가 진행될수록 빼앗은 힘을 해방하며 새로운 형태로 변모합니다.", skills: FINAL_BOSS_SKILLS[1], image: new URL("../../images/final-boss-phase4-core.png", import.meta.url).href },
] as const;
const ULTIMATE_ENTRIES = [
  {
    unitClass: "warrior",
    className: "전사",
    name: "천검난무",
    color: "#ef4444",
    unitTypeIds: ["swordsman", "dual_swordsman", "magic_swordsman"] as UnitTypeId[],
    multiplier: 300,
    description: "세 전사가 동시에 검격을 펼쳐 맵 전체의 모든 적을 베어냅니다.",
  },
  {
    unitClass: "mage",
    className: "마법사",
    name: "종말대마법",
    color: "#a855f7",
    unitTypeIds: ["fire_mage", "ice_mage", "lightning_mage"] as UnitTypeId[],
    multiplier: 300,
    description: "세 원소의 마력을 하나로 융합해 맵 전체의 모든 적에게 폭발시킵니다.",
  },
  {
    unitClass: "ranger",
    className: "사수",
    name: "궤도섬멸포격",
    color: "#38bdf8",
    unitTypeIds: ["rifleman", "shotgunner", "sniper"] as UnitTypeId[],
    multiplier: 175,
    description: "세 사수가 표적을 동기화하고 궤도 포격을 유도해 맵 전체를 타격합니다.",
  },
] as const;

interface Props { onClose: () => void; }

export default function CodexPanel({ onClose }: Props) {
  const [tab, setTab] = useState<CodexTab>("units");
  const [selectedUnitId, setSelectedUnitId] = useState<UnitTypeId>("swordsman");
  const [tier, setTier] = useState<UnitTier>(1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [finalBossPhase, setFinalBossPhase] = useState<1 | 2 | 3 | 4>(1);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const unit = UNIT_TYPES[selectedUnitId];
  const damage = unit.damage * getUnitTierDamageMultiplier(tier, unit.unitClass);
  const attacksPerSecond = 1000 / unit.attackIntervalMs * (1 + getUnitTierAttackSpeedBonus(tier, unit.unitClass));
  const range = unit.rangeTiles + getUnitTierRangeBonus(tier, unit.unitClass);
  const oneUpgradeDamage = unit.damage * getUnitUpgradeDamageMultiplier(selectedUnitId, 1);
  const tierTwoSkill = tier >= 2 ? getTierTwoSkill(selectedUnitId, tier) : null;
  const tierThreeSkill = tier >= 3 ? getTierThreeSkill(selectedUnitId) : null;
  const selectedEnemy = ENEMY_ENTRIES[selectedIndex] ?? ENEMY_ENTRIES[0];
  const selectedBossStage = selectedIndex >= 3 ? ([5, 10, 15, 20, 25, 30, 36] as const)[selectedIndex - 3] : null;
  const displayedBossSkills = selectedBossStage === 36
    ? FINAL_BOSS_SKILLS[finalBossPhase]
    : selectedBossStage !== null ? BOSS_SKILLS[selectedBossStage] ?? [] : [];
  const selectedUltimate = ULTIMATE_ENTRIES[selectedIndex] ?? ULTIMATE_ENTRIES[0];

  return (
    <div className="codexOverlay" role="presentation" onClick={onClose}>
      <section className="codexDialog" role="dialog" aria-modal="true" aria-labelledby="codex-title" onClick={(event) => event.stopPropagation()}>
        <header className="codexHeader">
          <div><span>ROGUE PATH ARCHIVE</span><h2 id="codex-title">도감</h2></div>
          <button type="button" onClick={onClose} aria-label="도감 닫기">×</button>
        </header>
        <nav className="codexTabs" aria-label="도감 분류">
          {TABS.map((item) => (
            <button key={item.id} type="button" className={tab === item.id ? "active" : ""} onClick={() => { setTab(item.id); setSelectedIndex(0); }}>
              {item.label}
            </button>
          ))}
        </nav>

        {tab === "units" ? (
          <div className="codexBody codexUnitBody">
            <div className="codexUnitGrid" aria-label="유닛 목록">
              {UNIT_IDS.map((id) => {
                const item = UNIT_TYPES[id];
                return (
                  <button key={id} type="button" className={selectedUnitId === id ? "active" : ""} onClick={() => setSelectedUnitId(id)}>
                    <span className={`codexMapUnit ${UNIT_SPRITE_CLASSES[id]}`} aria-hidden="true" />
                    <strong>{item.name}</strong>
                    <small>{CLASS_LABELS[item.unitClass]}</small>
                  </button>
                );
              })}
            </div>
            <article className="codexDetail codexUnitDetail">
              <div className="codexTierSelect" aria-label="유닛 성급">
                {([1, 2, 3] as const).map((value) => (
                  <button key={value} type="button" className={tier === value ? "active" : ""} onClick={() => setTier(value)}>
                    {"★".repeat(value)}
                  </button>
                ))}
              </div>
              <div className={`codexPortrait unitDetailPortrait ${UNIT_PORTRAIT_CLASSES[selectedUnitId]}`} aria-label={`${unit.name} 포트레이트`} />
              <div className="codexUnitCopy">
                <span className="codexCategory">{CLASS_LABELS[unit.unitClass]} · {tier}성</span>
                <h3 style={{ color: unit.color }}>{unit.name}</h3>
                <p>{ROLE_DESCRIPTIONS[selectedUnitId]}</p>
                <dl>
                  <div><dt>공격 타입</dt><dd>{ATTACK_TYPE_LABELS[unit.specType]}</dd></div>
                  <div><dt>공격력</dt><dd>{Number(damage.toFixed(2))} <b className="codexUpgradeGain">(+{Number(oneUpgradeDamage.toFixed(2))})</b></dd></div>
                  <div><dt>공격속도</dt><dd>{attacksPerSecond.toFixed(2)}회/초</dd></div>
                  <div><dt>사거리</dt><dd>{Number(range.toFixed(2))}칸</dd></div>
                </dl>
                {selectedUnitId !== "swordsman" && selectedUnitId !== "rifleman" && (
                  <div className="codexSpecialEffect">
                    <strong>특수효과 · {SPECIAL_EFFECTS[selectedUnitId].name}</strong>
                    <p>{SPECIAL_EFFECTS[selectedUnitId].description}</p>
                  </div>
                )}
                {tierTwoSkill && (
                  <div className="codexSkills">
                    <div className="codexSkill">
                      <img src={UNIT_TIER2_SKILL_ICONS[selectedUnitId]} alt="" />
                      <p><strong>{tierTwoSkill.name}</strong><span>{tierTwoSkill.description}</span></p>
                    </div>
                    {tierThreeSkill && (
                      <div className="codexSkill">
                        <img src={UNIT_TIER3_SKILL_ICONS[selectedUnitId]} alt="" />
                        <p><strong>{tierThreeSkill.name}</strong><span>{tierThreeSkill.description}</span></p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </article>
          </div>
        ) : tab === "enemies" ? (
          <div className="codexBody codexEnemyBody">
            <div className="codexEnemyGrid" aria-label="적유닛 목록">
              {ENEMY_ENTRIES.map((entry, index) => (
                <button
                  key={entry.label}
                  type="button"
                  className={`${selectedIndex === index ? "active" : ""} ${index >= 3 ? "bossWide" : ""}`}
                  onClick={() => setSelectedIndex(index)}
                >
                  <strong>{entry.label}</strong>
                  <small>{entry.sub}</small>
                </button>
              ))}
            </div>
            <article className={`codexDetail codexEnemyDetail ${selectedIndex < 3 ? "regularEnemy" : ""}`}>
              {selectedBossStage === 36 && (
                <div className="codexBossPhaseSelect" aria-label="최종 보스 페이즈">
                  {([1, 2, 3, 4] as const).map((phase) => (
                    <button key={phase} type="button" className={finalBossPhase === phase ? "active" : ""} onClick={() => setFinalBossPhase(phase)}>
                      {phase}페이즈
                    </button>
                  ))}
                </div>
              )}
              <div className="codexEnemyVisual">
                {"spriteClass" in selectedEnemy
                  ? <div className={`codexEnemyPreview ${selectedEnemy.spriteClass}`} aria-label={selectedEnemy.label} />
                  : <img className="codexEnemyPortrait" src={selectedEnemy.image} alt={selectedEnemy.sub} />}
              </div>
              <div className="codexEnemyCopy">
                <span className="codexCategory">적유닛</span>
                <h3>{"hp" in selectedEnemy ? selectedEnemy.sub : selectedEnemy.label}</h3>
                <p>{"hp" in selectedEnemy ? selectedEnemy.label : selectedEnemy.sub}</p>
                <p className="codexEnemyDescription">{selectedEnemy.description}</p>
                <dl>
                  {"hp" in selectedEnemy && <div><dt>체력</dt><dd>{selectedEnemy.hp.toLocaleString()}</dd></div>}
                  <div><dt>이동속도</dt><dd>{selectedEnemy.speed.toFixed(2)}칸/초</dd></div>
                </dl>
                {displayedBossSkills.length > 0 && (
                  <div className="codexEnemySkills">
                    <strong className="codexEnemySkillsTitle">스킬</strong>
                    {displayedBossSkills.map((skill, index) => (
                      <div className="codexEnemySkill" key={skill.name}>
                        <img src={skill.icon} alt="" />
                        <p><strong>{skill.name}</strong>{skill.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>
          </div>
        ) : (
          <div className="codexBody codexUltimateBody">
            <div className="codexList codexUltimateList">
              {ULTIMATE_ENTRIES.map((entry, index) => (
                <button key={entry.unitClass} type="button" className={selectedIndex === index ? "active" : ""} onClick={() => setSelectedIndex(index)}>
                  <strong style={{ color: entry.color }}>{entry.name}</strong>
                  <span>{entry.className} 필살 스킬</span>
                </button>
              ))}
            </div>
            <article className="codexDetail codexUltimateDetail">
              <span className="codexCategory">{selectedUltimate.className} · 필살 스킬</span>
              <h3 style={{ color: selectedUltimate.color }}>{selectedUltimate.name}</h3>
              <p>{selectedUltimate.description}</p>
              <div className="codexUltimateMembers" aria-label="필살 스킬 구성 유닛">
                {selectedUltimate.unitTypeIds.map((typeId) => (
                  <div key={typeId}>
                    <span className={`codexUltimatePortrait unitDetailPortrait ${UNIT_PORTRAIT_CLASSES[typeId]}`} />
                    <strong>{UNIT_TYPES[typeId].name}</strong>
                  </div>
                ))}
              </div>
              <dl className="codexUltimateStats">
                <div><dt>발동 조건</dt><dd>해당 직업 3종을 모두 3성으로 맵에 배치</dd></div>
                <div><dt>최초 판정</dt><dd>웨이브 시작 20초 후</dd></div>
                <div><dt>발동 확률</dt><dd>판정마다 25%</dd></div>
                <div><dt>피해 범위</dt><dd>맵 전체의 모든 적</dd></div>
                <div><dt>데미지</dt><dd>3종의 현재 공격력 × 각각 {selectedUltimate.multiplier}% 합산</dd></div>
                <div><dt>발동 후 쿨타임</dt><dd>60초</dd></div>
                <div><dt>발동 실패 후 재판정</dt><dd>15초</dd></div>
              </dl>
              <p className="codexUltimateNote">최종 보스전에서는 세 직업 중 하나의 힘이 항상 찬탈되어 필살 스킬이 발동하지 않습니다.</p>
            </article>
          </div>
        )}
      </section>
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  getUnitTierAttackSpeedBonus,
  getUnitTierDamageMultiplier,
  getUnitTierRangeBonus,
  UNIT_TYPES,
  getUnitUpgradeDamageMultiplier,
} from "../../games/rogueTd/constants";
import type { UnitTypeId } from "../../games/rogueTd/types";
import { UNIT_PORTRAIT_CLASSES, UNIT_SPRITE_CLASSES } from "../../games/rogueTd/unitSprites";
import { UNIT_TIER2_SKILL_ICONS, UNIT_TIER3_SKILL_ICONS } from "../../games/rogueTd/unitSprites";
import { getTierThreeSkill, getTierTwoSkill } from "../../games/rogueTd/unitSkillInfo";

type CodexTab = "units" | "enemies" | "synergies";
type UnitTier = 1 | 2 | 3;

const TABS: Array<{ id: CodexTab; label: string }> = [
  { id: "units", label: "유닛" },
  { id: "enemies", label: "적유닛" },
  { id: "synergies", label: "시너지" },
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
  { label: "인간형", sub: "일반 적", spriteClass: "enemyHumanSprite" },
  { label: "육지형", sub: "일반 적", spriteClass: "enemyLandSprite" },
  { label: "비행형", sub: "일반 적", spriteClass: "enemyFlySprite" },
  { label: "5스테이지 보스", sub: "황혼의 리치", image: new URL("../../images/boss-stage05-lich-portrait.png", import.meta.url).href },
  { label: "10스테이지 보스", sub: "용암갑주 베히모스", image: new URL("../../images/boss-stage10-armored-beast-portrait.png", import.meta.url).href },
  { label: "15스테이지 보스", sub: "영겁의 불사조", image: new URL("../../images/boss-stage15-phoenix-portrait.png", import.meta.url).href },
  { label: "20스테이지 보스", sub: "자색 성채의 기사 바르카인", image: new URL("../../images/boss-stage20-fortress-knight-portrait.png", import.meta.url).href },
  { label: "25스테이지 보스", sub: "산맥거북 모르가론", image: new URL("../../images/boss-stage25-morgaron-portrait.png", import.meta.url).href },
  { label: "30스테이지 보스", sub: "천공요새 아스트라온", image: new URL("../../images/boss-stage30-astrayon-portrait.png", import.meta.url).href },
  { label: "최종 스테이지 보스", sub: "FINAL BOSS", image: new URL("../../images/final-boss-phase4-core.png", import.meta.url).href },
] as const;
const SYNERGY_ENTRIES = ["전사", "마법사", "사수", "밸런스", "육지 특화", "조류 특화"] as const;

interface Props { onClose: () => void; }

export default function CodexPanel({ onClose }: Props) {
  const [tab, setTab] = useState<CodexTab>("units");
  const [selectedUnitId, setSelectedUnitId] = useState<UnitTypeId>("swordsman");
  const [tier, setTier] = useState<UnitTier>(1);
  const [selectedIndex, setSelectedIndex] = useState(0);

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
                  {"spriteClass" in entry && <span className={`codexEnemySprite ${entry.spriteClass}`} aria-hidden="true" />}
                  <strong>{entry.label}</strong>
                  <small>{entry.sub}</small>
                </button>
              ))}
            </div>
            <article className="codexDetail codexEnemyDetail">
              <div className="codexEnemyVisual">
                {"spriteClass" in selectedEnemy
                  ? <div className={`codexEnemyPreview ${selectedEnemy.spriteClass}`} aria-label={selectedEnemy.label} />
                  : <img className="codexEnemyPortrait" src={selectedEnemy.image} alt={selectedEnemy.sub} />}
              </div>
              <div className="codexEnemyCopy">
                <span className="codexCategory">적유닛</span>
                <h3>{selectedEnemy.label}</h3>
                <p>{selectedEnemy.sub}</p>
                <div className="codexPlaceholder">
                  <strong>상세 내용 준비 중</strong>
                  <p>능력과 수치는 다음 작업에서 추가합니다.</p>
                </div>
              </div>
            </article>
          </div>
        ) : (
          <div className="codexBody">
            <div className="codexList">
              {SYNERGY_ENTRIES.map((entry, index) => (
                <button key={entry} type="button" className={selectedIndex === index ? "active" : ""} onClick={() => setSelectedIndex(index)}>
                  <strong>{entry}</strong>
                </button>
              ))}
            </div>
            <article className="codexDetail">
              <span className="codexCategory">시너지</span>
              <h3>{SYNERGY_ENTRIES[selectedIndex]}</h3>
              <div className="codexPlaceholder">
                <strong>상세 내용 준비 중</strong>
                <p>현재는 도감 화면 구조만 구성했습니다. 세부 설명과 수치는 다음 작업에서 추가합니다.</p>
              </div>
            </article>
          </div>
        )}
      </section>
    </div>
  );
}

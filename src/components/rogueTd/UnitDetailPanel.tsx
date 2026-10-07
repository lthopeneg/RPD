import {
  FIRE_AREA_CHANCE,
  ICE_SLOW_CHANCE,
  LIGHTNING_PARALYZE_CHANCE,
  SNIPER_EXECUTE_CHANCE,
  UNIT_TYPES,
  UPGRADE_DAMAGE_PER_LEVEL,
  getUnitTierAttackSpeedBonus,
  getUnitTierDamageMultiplier,
  getUnitTierRangeBonus,
} from "../../games/rogueTd/constants";
import {
  AIR_DAMAGE_BONUS,
  BALANCE_DAMAGE_BONUS,
  LAND_DAMAGE_BONUS,
  MAGE_STATUS_CHANCE_BONUS,
  RANGER_RANGE_BONUS_TILES,
  WARRIOR_ATTACK_SPEED_BONUS,
} from "../../games/rogueTd/synergies";
import type { SynergyState } from "../../games/rogueTd/synergies";
import { getUpgradeLevels } from "../../games/rogueTd/upgrades";
import type { DamageUpgrade } from "../../games/rogueTd/upgrades";
import type { StorageUnit } from "../../games/rogueTd/types";
import { UNIT_PORTRAIT_CLASSES } from "../../games/rogueTd/unitSprites";

interface Props {
  unit: StorageUnit | null;
  upgrades: DamageUpgrade[];
  synergy: SynergyState;
  emptyMessage: string;
}

const CLASS_NAMES = { warrior: "전사", mage: "마법사", ranger: "사수" } as const;
const SPEC_NAMES = { balance: "밸런스", land_spec: "육지", air_spec: "조류" } as const;
const format = (value: number) => Number(value.toFixed(2)).toLocaleString();
const percent = (value: number) => `${Math.round(value * 100)}%`;

export default function UnitDetailPanel({ unit, upgrades, synergy, emptyMessage }: Props) {
  if (!unit) {
    return (
      <section className="unitDetailPanel unitDetailEmpty panelBox">
        <strong>유닛 상세정보</strong>
        <span>맵이나 창고에서 유닛을 선택해 주세요.</span>
        <small>{emptyMessage}</small>
      </section>
    );
  }

  const def = UNIT_TYPES[unit.typeId];
  const portraitClass = UNIT_PORTRAIT_CLASSES[unit.typeId];
  const upgradeLevels = getUpgradeLevels(upgrades, unit.typeId);
  const baseDamage = def.damage * getUnitTierDamageMultiplier(unit.tier, def.unitClass);
  const upgradeDamage = def.damage * upgradeLevels * UPGRADE_DAMAGE_PER_LEVEL;
  const attackSpeedBonus = def.unitClass === "warrior"
    ? WARRIOR_ATTACK_SPEED_BONUS[synergy.classTiers.warrior]
    : 0;
  const tierAttackSpeedBonus = getUnitTierAttackSpeedBonus(unit.tier, def.unitClass);
  const attacksPerSecond = 1000 / def.attackIntervalMs * (1 + attackSpeedBonus + tierAttackSpeedBonus);
  const rangeBonus = def.unitClass === "ranger"
    ? RANGER_RANGE_BONUS_TILES[synergy.classTiers.ranger]
    : 0;
  const tierRangeBonus = getUnitTierRangeBonus(unit.tier, def.unitClass);
  const mageBonus = def.unitClass === "mage"
    ? MAGE_STATUS_CHANCE_BONUS[synergy.classTiers.mage]
    : 0;
  const specBonus = def.specType === "balance"
    ? BALANCE_DAMAGE_BONUS[synergy.specTiers.balance]
    : def.specType === "land_spec"
      ? LAND_DAMAGE_BONUS[synergy.specTiers.land_spec]
      : AIR_DAMAGE_BONUS[synergy.specTiers.air_spec];
  const specTarget = def.specType === "balance" ? "모든 적" : def.specType === "land_spec" ? "육지 적" : "조류 적";

  const specialEffect = (() => {
    if (unit.typeId === "fire_mage") return <>{percent(FIRE_AREA_CHANCE)}<i>{mageBonus > 0 ? ` (+${percent(mageBonus)})` : ""}</i> 확률로 주변 1.5칸 범위 피해</>;
    if (unit.typeId === "ice_mage") return <>{percent(ICE_SLOW_CHANCE)}<i>{mageBonus > 0 ? ` (+${percent(mageBonus)})` : ""}</i> 확률로 주변 적을 1초간 50% 둔화</>;
    if (unit.typeId === "lightning_mage") return <>{percent(LIGHTNING_PARALYZE_CHANCE)}<i>{mageBonus > 0 ? ` (+${percent(mageBonus)})` : ""}</i> 확률로 대상을 1초간 마비</>;
    if (unit.typeId === "sniper") return <>{percent(SNIPER_EXECUTE_CHANCE)} 확률로 일반 적 즉사</>;
    if (unit.typeId === "swordsman" || unit.typeId === "rifleman") return <>없음</>;
    return <>{def.description}</>;
  })();
  const tierTwoSkill = (() => {
    if (unit.tier < 2) return null;
    if (unit.typeId === "swordsman") return <><b>연속베기 · 액티브</b><span>8초마다 다음 공격으로 총 220% 피해</span></>;
    if (unit.typeId === "dual_swordsman") return <><b>혈흔 · 패시브</b><span>공격 시 20% 확률로 3초 출혈(매초 최대 체력 2%, 틱당 최대 30)</span></>;
    if (unit.typeId === "magic_swordsman") return <><b>마력각인 · 패시브</b><span>공격 시 15% 확률로 6초간 받는 피해 증가(일반 10%, 보스 5%)</span></>;
    if (unit.typeId === "fire_mage") return <><b>불씨 확산 · 패시브</b><span>기본 공격이 주변 적에게 20% 피해</span></>;
    if (unit.typeId === "ice_mage") return <><b>프로즌 오브 · 액티브</b><span>12초마다 6초간 주변을 타격하는 얼음 구체 설치</span></>;
    if (unit.typeId === "lightning_mage") return <><b>체인 라이트닝 · 액티브</b><span>9초마다 최대 6명에게 전이되는 연쇄 번개</span></>;
    if (unit.typeId === "rifleman") return <><b>아드레날린 · 액티브</b><span>4초간 공격속도 3배, 이후 2초간 0.5배</span></>;
    if (unit.typeId === "shotgunner") return <><b>전탄 사격 · 액티브</b><span>8초마다 자신 주변 원형 범위에 산탄 발사</span></>;
    return <><b>매의 눈 · 패시브</b><span>2.5칸 이상 떨어진 대상에게 피해 20% 증가</span></>;
  })();

  return (
    <section className="unitDetailPanel panelBox">
      <div
        className={`unitDetailPortrait ${portraitClass}`}
        style={{ color: def.color }}
        aria-hidden="true"
      >
      </div>
      <div className="unitDetailStats">
        <div className="unitDetailHeading">
          <span>{"★".repeat(unit.tier)}</span>
          <strong style={{ color: def.color }}>{def.name}</strong>
        </div>
        <dl>
          <div><dt>직업</dt><dd>{CLASS_NAMES[def.unitClass]}</dd></div>
          <div><dt>특화</dt><dd>{SPEC_NAMES[def.specType]}</dd></div>
          <div className="unitDetailGap"><dt>공격력</dt><dd>{format(baseDamage)} <b className="upgradeStat">(+{format(upgradeDamage)})</b></dd></div>
          <div><dt>공격속도</dt><dd>{format(attacksPerSecond)}회/초 {attackSpeedBonus > 0 && <b className="synergyStat">(+{percent(attackSpeedBonus)})</b>}</dd></div>
          <div><dt>사거리</dt><dd>{format(def.rangeTiles + tierRangeBonus + rangeBonus)}칸 {rangeBonus > 0 && <b className="synergyStat">(+{format(rangeBonus)}칸)</b>}</dd></div>
          <div><dt>{specTarget} 피해</dt><dd>{specBonus > 0 ? <b className="synergyStat">+{percent(specBonus)}</b> : "없음"}</dd></div>
        </dl>
        <div className="unitSpecialEffect"><strong>특수효과</strong><p>{specialEffect}</p></div>
        {tierTwoSkill && <div className="unitTierSkill"><strong>2성 스킬</strong><p>{tierTwoSkill}</p></div>}
      </div>
    </section>
  );
}

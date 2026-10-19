import { UNIT_TYPES } from "../../games/rogueTd/constants";
import { getUpgradeLabel, getUpgradeLevels } from "../../games/rogueTd/upgrades";
import type { DamageUpgrade } from "../../games/rogueTd/upgrades";
import type { UnitTypeId } from "../../games/rogueTd/types";

interface Props { upgrades: DamageUpgrade[]; }

export default function UpgradeStatus({ upgrades }: Props) {
  const current = (Object.keys(UNIT_TYPES) as UnitTypeId[])
    .map((typeId) => ({ typeId, levels: getUpgradeLevels(upgrades, typeId) }))
    .filter(({ levels }) => levels > 0);
  const latest = upgrades.at(-1);

  return (
    <section className="upgradeStatus panelBox">
      <h2>현재 업그레이드</h2>
      <p className="upgradeRule">유닛과 성급에 따라 업그레이드 공격력 증가</p>
      {latest && <p className="latestUpgrade">최근: {getUpgradeLabel(latest)}</p>}
      {current.length === 0 ? (
        <p className="upgradeEmpty">적용된 업그레이드 없음</p>
      ) : (
        <div className="upgradeStatusList">
          {current.map(({ typeId, levels }) => (
            <span key={typeId}>{UNIT_TYPES[typeId].icon} {UNIT_TYPES[typeId].name} {levels}업</span>
          ))}
        </div>
      )}
    </section>
  );
}

import type { UnitTypeId } from "./types";

export interface UnitSkillInfo {
  name: string;
  description: string;
}

export function getTierTwoSkill(typeId: UnitTypeId, tier: number): UnitSkillInfo {
  const tier3 = tier >= 3;
  if (typeId === "swordsman") return { name: tier3 ? "연속베기+ · 액티브" : "연속베기 · 액티브", description: tier3 ? "7초마다 다음 공격이 연속베기로 변경되어 총 520% 피해를 줍니다." : "8초마다 다음 공격이 연속베기로 변경되어 총 440% 피해를 줍니다." };
  if (typeId === "dual_swordsman") return { name: tier3 ? "혈흔+ · 패시브" : "혈흔 · 패시브", description: tier3 ? "공격 시 25% 확률로 4초간 출혈을 남깁니다. 매초 최대 체력의 4% 피해를 주며 틱당 최대 피해는 60입니다." : "공격 시 20% 확률로 3초간 출혈을 남깁니다. 매초 최대 체력의 4% 피해를 주며 틱당 최대 피해는 60입니다." };
  if (typeId === "magic_swordsman") return { name: tier3 ? "마력각인+ · 패시브" : "마력각인 · 패시브", description: tier3 ? "공격 시 25% 확률로 8초간 각인을 남깁니다. 일반 적은 30%, 보스는 14% 더 큰 피해를 받습니다." : "공격 시 15% 확률로 6초간 각인을 남겨 받는 피해를 증가시킵니다. 일반 적은 20%, 보스는 10% 증가합니다." };
  if (typeId === "fire_mage") return { name: tier3 ? "불씨 확산+ · 패시브" : "불씨 확산 · 패시브", description: tier3 ? "기본 공격이 주 대상 주변의 적에게도 30% 피해를 줍니다." : "기본 공격이 주 대상 주변의 적에게도 20% 피해를 줍니다." };
  if (typeId === "ice_mage") return { name: tier3 ? "프로즌 오브+ · 액티브" : "프로즌 오브 · 액티브", description: tier3 ? "12초마다 6초간 이동하는 오브를 설치합니다. 0.5초마다 일반 적에게 25%, 제어된 적에게 55% 피해를 줍니다." : "12초마다 6초간 유지되는 프로즌 오브를 설치합니다. 둔화·마비 상태의 적에게 더 큰 피해를 줍니다." };
  if (typeId === "lightning_mage") return { name: tier3 ? "체인 라이트닝+ · 액티브" : "체인 라이트닝 · 액티브", description: tier3 ? "9초마다 최대 8명의 적에게 더 멀리 전이되며, 남은 전류는 마지막 적에게 300% 피해를 줍니다." : "9초마다 최대 6명의 적에게 전이되는 번개를 발사하며 각 대상에게 마비를 판정합니다." };
  if (typeId === "rifleman") return { name: tier3 ? "아드레날린+ · 액티브" : "아드레날린 · 액티브", description: tier3 ? "5초간 공격속도가 3배가 되고, 이후 1.5초간 0.5배로 감소합니다." : "4초간 공격속도가 3배가 되고, 이후 2초간 0.5배로 감소합니다." };
  if (typeId === "shotgunner") return { name: tier3 ? "전탄 사격+ · 액티브" : "전탄 사격 · 액티브", description: tier3 ? "사거리 안에 적이 4마리 이상이면 반경 2칸에 강화된 산탄을 발사합니다. 보스는 한 마리만 있어도 발동합니다." : "재사용 대기시간이 끝나고 자신의 공격 범위 안에 적이 5마리 이상이면 주변 원형 범위에 산탄을 발사합니다. 보스는 범위 안에 1마리만 있어도 발동합니다." };
  return { name: tier3 ? "매의 눈+ · 패시브" : "매의 눈 · 패시브", description: tier3 ? "2.2칸 이상 떨어진 대상에게 주는 피해가 35% 증가합니다. 즉사 확률은 증가하지 않습니다." : "2.5칸 이상 떨어진 대상에게 주는 피해가 20% 증가합니다. 즉사 확률은 증가하지 않습니다." };
}

export function getTierThreeSkill(typeId: UnitTypeId): UnitSkillInfo {
  if (typeId === "swordsman") return { name: "일섬파 · 패시브", description: "기본 공격 4회마다 공격 방향의 직선을 한 번에 베어냅니다. 주 대상에게 320%, 같은 공격선의 다른 적에게 160% 피해를 동시에 줍니다. 상하좌우는 3칸, 대각선은 2칸까지 타격합니다." };
  if (typeId === "dual_swordsman") return { name: "혈풍난무 · 액티브", description: "10초마다 자신 주변 2칸의 모든 적에게 500% 피해를 주며 혈흔이 남은 적에게는 600% 피해를 줍니다." };
  if (typeId === "magic_swordsman") return { name: "각인 전개 · 액티브", description: "11초마다 자신 주변 1.8칸의 모든 적에게 300% 피해를 주고 8초간 강화 마력각인을 남깁니다." };
  if (typeId === "fire_mage") return { name: "화염기둥 · 액티브", description: "10초마다 밀집 지역에 150% 피해를 주고 3초 동안 0.5초마다 20% 피해를 줍니다." };
  if (typeId === "ice_mage") return { name: "빙하 궤도 · 패시브", description: "오브가 길을 따라 이동하며 12% 피해의 얼음 흔적을 남기고, 지속시간이 끝나면 250~330% 피해로 폭발합니다." };
  if (typeId === "lightning_mage") return { name: "천벌 · 패시브", description: "스테이지 시작 5초 후부터 5초마다 맵 전체에서 무작위 적을 최대 4명 선택해 각각 125% 피해를 줍니다. 각 낙뢰 주변 1.5칸의 적에게도 60% 피해를 줍니다." };
  if (typeId === "rifleman") return { name: "급소 사격 · 패시브", description: "기본 공격이 20% 확률로 200% 치명타 피해를 줍니다." };
  if (typeId === "shotgunner") return { name: "더블 배럴 · 패시브", description: "기본 공격 3회마다 0.2초 후 80% 피해의 두 번째 산탄을 더 넓은 범위로 발사합니다." };
  return { name: "확정 사살 · 액티브", description: "12초마다 사거리 안에서 체력이 가장 높은 적에게 350% 피해를 줍니다. 일반 적은 공격 후 체력이 20% 이하면 처치합니다." };
}

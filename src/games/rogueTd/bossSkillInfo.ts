const undeadCallIcon = new URL("../../images/boss-skill-undead-call.png", import.meta.url).href;
const earthSlamIcon = new URL("../../images/boss-skill-earth-slam.png", import.meta.url).href;
const eternalRebirthIcon = new URL("../../images/boss-skill-eternal-rebirth.png", import.meta.url).href;
const fortressVowIcon = new URL("../../images/boss-skill-fortress-vow.png", import.meta.url).href;
const earthReshapeIcon = new URL("../../images/boss-skill-earth-reshape.png", import.meta.url).href;
const orbitalDefenseIcon = new URL("../../images/boss-skill-orbital-defense.png", import.meta.url).href;
const magneticLeapIcon = new URL("../../images/boss-skill-magnetic-leap.png", import.meta.url).href;
const spaceSlashIcon = new URL("../../images/boss-skill-space-slash.png", import.meta.url).href;
const manaBurnIcon = new URL("../../images/boss-skill-mana-burn.png", import.meta.url).href;
const suppressiveFireIcon = new URL("../../images/boss-skill-suppressive-fire.png", import.meta.url).href;
const frostArmorIcon = new URL("../../images/boss-skill-frost-armor.png", import.meta.url).href;
const iceShotgunIcon = new URL("../../images/boss-skill-ice-shotgun.png", import.meta.url).href;
const freezeMarkIcon = new URL("../../images/boss-skill-freeze-mark.png", import.meta.url).href;
const diveIcon = new URL("../../images/boss-skill-dive.png", import.meta.url).href;
const featherBarrageIcon = new URL("../../images/boss-skill-feather-barrage.png", import.meta.url).href;
const radiantMoltIcon = new URL("../../images/boss-skill-radiant-molt.png", import.meta.url).href;
const powerRampageIcon = new URL("../../images/boss-skill-power-rampage.png", import.meta.url).href;

export interface BossSkillInfo {
  name: string;
  description: string;
  icon: string;
}

export const FINAL_BOSS_LIGHT_DRAIN: Record<1 | 2 | 3 | 4, string> = {
  1: "밸런스형 유닛의 피해 50% 감소",
  2: "육지 특화 유닛의 피해 50% 감소",
  3: "비행 특화 유닛의 피해 50% 감소",
  4: "모든 유닛의 피해 50% 감소",
};

export const BOSS_SKILLS: Record<number, BossSkillInfo[]> = {
  5: [{ name: "망자의 부름", description: "등장 8초 후 스켈레톤 5마리를 소환합니다. 소환수가 존재하는 동안 무적이 되며, 15초 안에 처치하지 못하면 남은 스켈레톤의 체력을 흡수해 회복합니다.", icon: undeadCallIcon }],
  10: [{ name: "대지 강타", description: "이동을 멈추고 주변 3칸에 강력한 충격파를 일으킵니다. 범위 안의 아군은 3초 동안 기절해 공격할 수 없습니다.", icon: earthSlamIcon }],
  15: [{ name: "영겁의 환생", description: "체력이 모두 소진되면 불타는 알로 변합니다. 알은 받는 피해가 30% 감소하며, 15초 안에 파괴하지 못하면 최대 체력의 50%로 부활합니다.", icon: eternalRebirthIcon }],
  20: [{ name: "성채의 맹세", description: "현재 체력의 70%인 보호막을 전개합니다. 보호막은 피해를 50% 줄이고 이동속도를 80% 낮춥니다. 파괴하면 5초간 기절하며 받는 피해가 2배가 됩니다.", icon: fortressVowIcon }],
  25: [{ name: "대지의 재편", description: "15초마다 이동을 멈추고 예고된 5칸의 지형을 바꿉니다. 빈칸에는 자연벽을 세우고 기존 벽은 파괴하며, 해당 유닛은 창고로 회수됩니다.", icon: earthReshapeIcon }],
  30: [
    { name: "궤도 방위체계", description: "부유석 4개가 피해 일부를 흡수합니다. 모두 파괴하면 5초간 동력핵이 노출되어 받는 피해가 50% 증가합니다.", icon: orbitalDefenseIcon },
    { name: "자력 도약", description: "부유석이 남아 있으면 무작위 경로로 순간이동한 뒤 주변 2칸의 아군을 3초간 기절시킵니다.", icon: magneticLeapIcon },
  ],
};

export const FINAL_BOSS_SKILLS: Record<1 | 2 | 3 | 4, BossSkillInfo[]> = {
  1: [
    { name: "공간참", description: "가장 가까운 아군 방향의 직선 3칸 또는 대각선 2칸을 베어 5초간 기절시킵니다.", icon: spaceSlashIcon },
    { name: "마력 연소", description: "가장 가까운 아군 중심 3×2 영역의 액티브·패시브 스킬을 5초간 봉인하고 모든 스킬 쿨타임을 최대치로 초기화합니다.", icon: manaBurnIcon },
    { name: "제압 사격", description: "누적 피해량 상위 아군 3기의 기본 공격을 5초간 봉인합니다.", icon: suppressiveFireIcon },
  ],
  2: [
    { name: "빙결 갑주", description: "최대 체력의 20% 보호막을 10초간 전개합니다. 파괴하지 못하면 남은 보호막만큼 회복하며, 성공과 실패 모두 종료 1초 후 얼음 산탄을 발사합니다.", icon: frostArmorIcon },
    { name: "얼음 산탄", description: "보스 주변에 얼음 파편을 발사해 적중한 아군에게 빙결 스택을 부여합니다.", icon: iceShotgunIcon },
    { name: "빙결 표식", description: "5초마다 무작위 아군 3기에게 얼음 덩어리를 떨어뜨려 빙결 스택을 부여합니다. 3스택이 되면 5초간 완전히 빙결됩니다.", icon: freezeMarkIcon },
  ],
  3: [
    { name: "급강하", description: "무작위 아군 가까이로 순간이동해 2×2 영역을 5초간 기절시킵니다.", icon: diveIcon },
    { name: "깃털 탄막", description: "8방향으로 빛의 깃털을 발사해 적중한 아군의 공격력을 5초간 20% 감소시킵니다.", icon: featherBarrageIcon },
    { name: "광휘의 탈피", description: "모든 디버프를 해제하고 5초간 상태이상 면역과 50% 피해 감소를 얻습니다.", icon: radiantMoltIcon },
  ],
  4: [{ name: "권능 폭주", description: "6초마다 이전 페이즈의 권능 중 서로 다른 3개를 무작위로 동시에 사용합니다.", icon: powerRampageIcon }],
};

export const getBossSkills = (stage: number, phase: 1 | 2 | 3 | 4 = 1) =>
  stage === 36 ? FINAL_BOSS_SKILLS[phase] : BOSS_SKILLS[stage] ?? [];

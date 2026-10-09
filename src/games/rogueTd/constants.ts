import type {
  MonsterCategory,
  SpecType,
  UnitClass,
  UnitTypeDef,
  UnitTypeId,
} from "./types";

export const ROWS = 7;
export const COLS = 20;
export const CELL_COUNT = ROWS * COLS;

export const START_GOLD = 180;
export const START_LIFE = 10;
export const START_PLAYER_LEVEL = 1;
export const MAX_PLAYER_LEVEL = 10;
export const BASE_UNIT_DEPLOY_LIMIT = 3;
export const XP_PURCHASE_COST = 20;
export const XP_PER_PURCHASE = 10;
export const getRequiredXp = (level: number) => 20 + (level - 1) * 10;
export const getUnitDeployLimit = (level: number) =>
  BASE_UNIT_DEPLOY_LIMIT + level - 1;
export const UNIT_SELL_PRICES: Record<1 | 2 | 3, number> = {
  1: 10,
  2: 35,
  3: 110,
};
export const PLAYER_WALL_COST = 10;
export const NATURAL_DESTROY_COST = 20;
export const PLAYER_WALL_REFUND_RATE = 0.5;
export const PLAYER_WALL_LIMIT = 18;
export const UNIT_RANGE_TILES = 1.5;
export const UNIT_TIER_DAMAGE_MULTIPLIER: Record<1 | 2 | 3, number> = {
  1: 1,
  2: 2,
  3: 5,
};
export const WARRIOR_TIER_ATTACK_SPEED_BONUS: Record<1 | 2 | 3, number> = {
  1: 0,
  2: 0.12,
  3: 0.3,
};
export const MAGE_TIER_DAMAGE_BONUS: Record<1 | 2 | 3, number> = {
  1: 0,
  2: 0.25,
  3: 0.75,
};
export const RANGER_TIER_RANGE_BONUS: Record<1 | 2 | 3, number> = {
  1: 0,
  2: 0.35,
  3: 0.9,
};
const normalizeUnitTier = (tier: number): 1 | 2 | 3 => tier >= 3 ? 3 : tier >= 2 ? 2 : 1;
export const getUnitTierDamageMultiplier = (tier: number, unitClass: UnitClass) => {
  const normalizedTier = normalizeUnitTier(tier);
  return UNIT_TIER_DAMAGE_MULTIPLIER[normalizedTier] + (
    unitClass === "mage" ? MAGE_TIER_DAMAGE_BONUS[normalizedTier] : 0
  );
};
export const getUnitTierAttackSpeedBonus = (tier: number, unitClass: UnitClass) =>
  unitClass === "warrior" ? WARRIOR_TIER_ATTACK_SPEED_BONUS[normalizeUnitTier(tier)] : 0;
export const getUnitTierRangeBonus = (tier: number, unitClass: UnitClass) =>
  unitClass === "ranger" ? RANGER_TIER_RANGE_BONUS[normalizeUnitTier(tier)] : 0;

export const NATURAL_WALL_COUNT = 10;
export const PERMANENT_WALL_MIN = 2;
export const PERMANENT_WALL_MAX = 3;

export const PROTOTYPE_WAVES = 36;
export const FINAL_STAGE = 36;
export const MONSTERS_PER_WAVE = 25;
export const MONSTER_SPAWN_MS = 320;
export const BOSS_WAVE_INTERVAL = 5;
export const isFinalStage = (wave: number) => wave === FINAL_STAGE;
export const isBossWave = (wave: number) =>
  wave > 0 && (isFinalStage(wave) || (wave <= 30 && wave % BOSS_WAVE_INTERVAL === 0));
export const getWaveMonsterCount = (wave: number) =>
  wave === 31
    ? 45
    : wave === 32
      ? 55
      : wave === 33
        ? 60
        : wave === 34
          ? 65
          : wave === 35
            ? 70
      : MONSTERS_PER_WAVE + Math.floor((wave - 1) / 3) * 2;

// 일반 웨이브는 5:3:2 비율로 섞고 주력 유형을 매 스테이지 순환한다.
const MONSTER_MIX: readonly MonsterCategory[] = [
  "human", "land", "human", "flying", "land",
  "human", "flying", "human", "land", "human",
];
const MONSTER_ROTATION: readonly MonsterCategory[] = ["human", "land", "flying"];
export const getWaveMonsterCategory = (wave: number, spawnIndex: number): MonsterCategory => {
  const rotation = (wave - 1) % MONSTER_ROTATION.length;
  const categoryIndex = MONSTER_ROTATION.indexOf(MONSTER_MIX[spawnIndex % MONSTER_MIX.length]);
  return MONSTER_ROTATION[(categoryIndex + rotation) % MONSTER_ROTATION.length];
};
export const getWaveComposition = (wave: number): Record<MonsterCategory, number> => {
  const counts: Record<MonsterCategory, number> = { human: 0, land: 0, flying: 0 };
  if (isFinalStage(wave)) {
    return { human: 1, land: 1, flying: 1 };
  }
  if (isBossWave(wave)) {
    counts[getBossCategory(wave)] = 1;
    return counts;
  }
  const total = getWaveMonsterCount(wave);
  for (let index = 0; index < total; index++) {
    counts[getWaveMonsterCategory(wave, index)] += 1;
  }
  return counts;
};
export const getBossCategory = (wave: number): MonsterCategory => {
  if (isFinalStage(wave)) return "human";
  return MONSTER_ROTATION[(Math.floor(wave / BOSS_WAVE_INTERVAL) - 1) % MONSTER_ROTATION.length];
};
export const FINAL_BOSS_PHASE_HP = 20000;
export const getBossHp = (wave: number) => {
  if (isFinalStage(wave)) return FINAL_BOSS_PHASE_HP * 4;
  const baseHp = BOSS_HP * 3 * 1.75 ** (Math.floor(wave / BOSS_WAVE_INTERVAL) - 1);
  return Math.round(baseHp * (wave === 20 ? 0.75 : 1));
};
// 1차 밸런스: 인간은 기준형, 육지는 느리고 튼튼하며 조류는 빠르고 약하다.
export const MONSTER_STATS: Record<MonsterCategory, { hp: number; speed: number }> = {
  human: { hp: 40, speed: 1.4 },
  land: { hp: 55, speed: 1.15 },
  flying: { hp: 30, speed: 1.7 },
};
export const MONSTER_HP_GROWTH_PER_WAVE = 0.16;
export const getMonsterHp = (category: MonsterCategory, wave: number) =>
  Math.round(
    MONSTER_STATS[category].hp *
    2.25 *
    (1 + Math.max(0, wave - 1) * MONSTER_HP_GROWTH_PER_WAVE) *
    (wave === 31
      ? 1.35
      : wave === 32
        ? 1.65
        : wave === 33
          ? 1.85
          : wave === 34
            ? 2.05
            : wave === 35
              ? 2.3
              : 1),
  );
export const BOSS_HP = 300;
export const STAGE05_SUMMON_COUNT = 5;
export const STAGE05_FIRST_SUMMON_DELAY_MS = 8000;
export const STAGE05_SUMMON_CAST_MS = 1000;
export const STAGE05_ABSORB_CAST_MS = 1200;
export const STAGE05_SUMMON_CYCLE_MS = 15000;
export const STAGE05_SKELETON_HP_RATIO = 0.7;
export const STAGE05_SKELETON_SPEED_RATIO = 0.85;
export const STAGE10_FIRST_STOMP_DELAY_MS = 7000;
export const STAGE10_STOMP_WARNING_MS = 1200;
export const STAGE10_STOMP_COOLDOWN_MS = 12000;
export const STAGE10_STOMP_STUN_MS = 3000;
export const STAGE10_STOMP_RADIUS_TILES = 3;
export const STAGE15_TRANSFORM_MS = 1200;
export const STAGE15_EGG_HATCH_DELAY_MS = 15000;
export const STAGE15_HATCH_MS = 1200;
export const STAGE15_EGG_HP_RATIO = 0.3;
// 두 번째 알부터는 첫 알 체력(보스 최대 체력의 30%)의 70%로 시작한다.
export const STAGE15_REPEAT_EGG_HP_RATIO = STAGE15_EGG_HP_RATIO * 0.7;
export const STAGE15_EGG_DAMAGE_REDUCTION = 0.3;
export const STAGE15_REVIVE_HP_RATIO = 0.5;
export const STAGE20_FIRST_SHIELD_DELAY_MS = 8000;
export const STAGE20_SHIELD_CAST_MS = 1500;
export const STAGE20_SHIELD_REFRESH_MS = 15000;
export const STAGE20_SHIELD_RATIO = 0.7;
export const STAGE20_SHIELD_SEGMENTS = 4;
export const STAGE20_SHIELD_DAMAGE_REDUCTION = 0.5;
export const STAGE20_SHIELDED_SPEED_RATIO = 0.2;
export const STAGE20_BREAK_STUN_MS = 8000;
export const STAGE20_BREAK_COOLDOWN_MS = 15000;
export const STAGE20_BREAK_DAMAGE_MULTIPLIER = 2;
export const STAGE25_SPEED_RATIO = 0.5;
export const STAGE25_FIRST_REFORGE_DELAY_MS = 8000;
export const STAGE25_REFORGE_CAST_MS = 2000;
export const STAGE25_REFORGE_COOLDOWN_MS = 15000;
export const STAGE25_REFORGE_TARGET_COUNT = 5;
export const STAGE30_STONE_COUNT = 4;
export const STAGE30_STONE_HP_RATIO = 0.08;
export const STAGE30_WEAK_DURATION_MS = 5000;
export const STAGE30_WEAK_DAMAGE_MULTIPLIER = 1.5;
export const STAGE30_FIRST_TELEPORT_DELAY_MS = 6000;
export const STAGE30_TELEPORT_CAST_MS = 1500;
export const STAGE30_TELEPORT_COOLDOWN_MS = 12000;
export const STAGE30_MAGNETIC_FIELD_MS = 4000;
export const STAGE30_MAGNETIC_RADIUS_TILES = 2;
export const STAGE30_MAGNETIC_STUN_MS = 3000;
export const BOSS_SNIPER_DAMAGE_MULTIPLIER = 3; // 즉사 발동 시 보스 대상 테스트 피해 배율
export const FIRE_AREA_CHANCE = 0.30;
export const ICE_SLOW_CHANCE = 0.10;
export const LIGHTNING_PARALYZE_CHANCE = 0.15;
export const SNIPER_EXECUTE_CHANCE = 0.05;
export const SWORDSMAN_COMBO_COOLDOWN_MS = 8000;
export const SWORDSMAN_COMBO_DAMAGE_RATIO = 4.4;
export const DUAL_BLEED_CHANCE = 0.2;
export const DUAL_BLEED_DURATION_MS = 3000;
export const DUAL_BLEED_TICK_MS = 1000;
export const DUAL_BLEED_MAX_TICK_DAMAGE = 60;
export const MAGIC_MARK_CHANCE = 0.15;
export const MAGIC_MARK_DURATION_MS = 6000;
export const FIRE_SPLASH_RATIO = 0.2;
export const FROZEN_ORB_COOLDOWN_MS = 12000;
export const FROZEN_ORB_DURATION_MS = 6000;
export const FROZEN_ORB_TICK_MS = 500;
export const CHAIN_LIGHTNING_COOLDOWN_MS = 9000;
export const RIFLE_ADRENALINE_READY_MS = 10000;
export const RIFLE_ADRENALINE_BOOST_MS = 4000;
export const RIFLE_ADRENALINE_FATIGUE_MS = 2000;
export const RIFLE_ADRENALINE_CYCLE_MS = 16000;
export const TIER3_RIFLE_CRIT_CHANCE = 0.2;
export const TIER3_RIFLE_CRIT_DAMAGE_RATIO = 2;
export const SHOTGUN_BARRAGE_COOLDOWN_MS = 8000;
export const SHOTGUN_BARRAGE_RADIUS_TILES = 1.8;
export const TIER3_SWORDSMAN_COMBO_COOLDOWN_MS = 7000;
export const TIER3_SWORDSMAN_COMBO_DAMAGE_RATIO = 5.2;
export const TIER3_DUAL_BLEED_CHANCE = 0.25;
export const TIER3_DUAL_BLEED_DURATION_MS = 4000;
export const DUAL_BLOOD_FLURRY_COOLDOWN_MS = 10000;
export const MAGIC_MARK_FIELD_COOLDOWN_MS = 11000;
export const FIRE_PILLAR_COOLDOWN_MS = 10000;
export const SNIPER_KILL_SHOT_COOLDOWN_MS = 12000;
export const TIER3_SNIPER_HAWK_EYE_DAMAGE_RATIO = 1.35;
export const TIER3_SNIPER_KILL_SHOT_DAMAGE_RATIO = 3.5;
export const TIER3_FROZEN_ORB_RADIUS_TILES = 1.8;
export const TIER3_FROZEN_ORB_MOVE_TILES_PER_SEC = 0.5;
export const TIER3_CHAIN_MAX_TARGETS = 8;
export const TIER3_SHOTGUN_BARRAGE_RADIUS_TILES = 2;

// 신규 룰 관련 상수
export const MAX_MONSTER_LAPS = 5; // 5회 완주 시 즉시 게임 오버
export const WAVE_TIME_LIMIT_SEC = 90;
export const BOSS_WAVE_TIME_LIMIT_SEC = 90;
export const FINAL_WAVE_TIME_LIMIT_SEC = 360;
export const getWaveTimeLimit = (wave: number) =>
  isFinalStage(wave)
    ? FINAL_WAVE_TIME_LIMIT_SEC
    : isBossWave(wave)
      ? BOSS_WAVE_TIME_LIMIT_SEC
      : WAVE_TIME_LIMIT_SEC;
export const SHOP_DRAW_COST = 20;
export const UPGRADE_DRAW_COST = 30;
export const MONSTER_KILL_GOLD = 2;
export const BOSS_KILL_GOLD = 10;
export const WAVE_CLEAR_GOLD = 30;
export const BOSS_CLEAR_GOLD = 60;
export const getBossClearGold = (wave: number) =>
  isFinalStage(wave)
    ? 300
    : BOSS_CLEAR_GOLD + (Math.floor(wave / BOSS_WAVE_INTERVAL) - 1) * 20;
export const WAVE_TIMEOUT_GOLD = 10;
export const UPGRADE_DAMAGE_PER_LEVEL = 0.05; // +1업당 기본 피해량 5%
export const getUnitUpgradeDamageMultiplier = (typeId: UnitTypeId, upgradeLevels: number) =>
  upgradeLevels * UPGRADE_DAMAGE_PER_LEVEL * (typeId === "dual_swordsman" ? 2 : 1);

// 타입 상성 배율표
export const DAMAGE_MULTIPLIERS: Record<
  SpecType,
  Record<MonsterCategory, number>
> = {
  balance: {
    human: 1.0,
    land: 1.0,
    flying: 1.0,
  },
  land_spec: {
    human: 0.75,
    land: 1.0,
    flying: 0.5,
  },
  air_spec: {
    human: 0.75,
    land: 0.5,
    flying: 1.0,
  },
};

// 9종 유닛 상세 정의
export const UNIT_TYPES: Record<UnitTypeId, UnitTypeDef> = {
  // --- 전사 계열 ---
  swordsman: {
    id: "swordsman",
    name: "검사",
    icon: "⚔️",
    color: "#60a5fa",
    unitClass: "warrior",
    specType: "balance",
    cost: SHOP_DRAW_COST,
    damage: 11,
    rangeTiles: 1.5,
    attackIntervalMs: 500,
    description: "밸런스형 근접 전사 (인간/육지/조류 100%)",
  },
  dual_swordsman: {
    id: "dual_swordsman",
    name: "쌍검사",
    icon: "🗡️",
    color: "#e11d48",
    unitClass: "warrior",
    specType: "land_spec",
    cost: SHOP_DRAW_COST,
    damage: 12, // 1회 공격 총 피해를 두 타격으로 분할
    rangeTiles: 1.3,
    attackIntervalMs: 450,
    description: "육지 특화 근접 전사 (1회 공격 당 2Hit 데미지)",
  },
  magic_swordsman: {
    id: "magic_swordsman",
    name: "마검사",
    icon: "🔮",
    color: "#818cf8",
    unitClass: "warrior",
    specType: "air_spec",
    cost: SHOP_DRAW_COST,
    damage: 10,
    rangeTiles: 1.8,
    attackIntervalMs: 700,
    description: "조류 특화 범위 전사 (주 대상 + 주변 최대 2마리 타격)",
  },

  // --- 마법사 계열 ---
  fire_mage: {
    id: "fire_mage",
    name: "화염술사",
    icon: "🔥",
    color: "#f87171",
    unitClass: "mage",
    specType: "balance",
    cost: SHOP_DRAW_COST,
    damage: 11,
    rangeTiles: 2.2,
    attackIntervalMs: 900,
    description: "밸런스형 마법사 (30% 확률로 주변 1.5칸 범위 피해)",
  },
  ice_mage: {
    id: "ice_mage",
    name: "얼음술사",
    icon: "❄️",
    color: "#38bdf8",
    unitClass: "mage",
    specType: "land_spec",
    cost: SHOP_DRAW_COST,
    damage: 10,
    rangeTiles: 2.3,
    attackIntervalMs: 850,
    description: "육지 특화 CC 마법사 (10% 확률로 주변 적 1초간 50% 둔화)",
  },
  lightning_mage: {
    id: "lightning_mage",
    name: "번개술사",
    icon: "⚡",
    color: "#fbbf24",
    unitClass: "mage",
    specType: "air_spec",
    cost: SHOP_DRAW_COST,
    damage: 11,
    rangeTiles: 2.4,
    attackIntervalMs: 900,
    description: "조류 특화 CC 마법사 (10% 확률로 대상 1초간 마비/이동불가)",
  },

  // --- 사수 계열 ---
  rifleman: {
    id: "rifleman",
    name: "소총수",
    icon: "🎯",
    color: "#4ade80",
    unitClass: "ranger",
    specType: "balance",
    cost: SHOP_DRAW_COST,
    damage: 15,
    rangeTiles: 2.8,
    attackIntervalMs: 650,
    description: "밸런스형 원거리 사수 (긴 사거리, 안정적 단일 피해)",
  },
  shotgunner: {
    id: "shotgunner",
    name: "산탄총병",
    icon: "💥",
    color: "#f97316",
    unitClass: "ranger",
    specType: "land_spec",
    cost: SHOP_DRAW_COST,
    damage: 14,
    rangeTiles: 1.8,
    attackIntervalMs: 750,
    description: "육지 특화 범위 사수 (적과의 거리가 가까울수록 100%~50% 피해)",
  },
  sniper: {
    id: "sniper",
    name: "저격병",
    icon: "🏹",
    color: "#e879f9",
    unitClass: "ranger",
    specType: "air_spec",
    cost: SHOP_DRAW_COST,
    damage: 32,
    rangeTiles: 3.8,
    attackIntervalMs: 1800,
    description: "조류 특화 초장거리 사수 (매우 강한 피해, 5% 확률 일반적 즉사)",
  },
};

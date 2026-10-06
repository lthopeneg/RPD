export type CellType = "empty" | "natural" | "permanent" | "player";
export type Tool = "wall" | "unit" | "erase";

export interface CellData {
  type: CellType;
  bornWave?: number;
  cost?: number;
}

export interface Point {
  row: number;
  col: number;
}

// 3가지 몬스터 분류
export type MonsterCategory = "human" | "land" | "flying";

// 3가지 직업 계열
export type UnitClass = "warrior" | "mage" | "ranger";

// 3가지 상성 특화
export type SpecType = "balance" | "land_spec" | "air_spec";

// 총 9종 유닛 ID
export type UnitTypeId =
  | "swordsman"
  | "dual_swordsman"
  | "magic_swordsman"
  | "fire_mage"
  | "ice_mage"
  | "lightning_mage"
  | "rifleman"
  | "shotgunner"
  | "sniper";

export interface UnitTypeDef {
  id: UnitTypeId;
  name: string;
  icon: string;
  color: string;
  unitClass: UnitClass;
  specType: SpecType;
  cost: number;
  damage: number;
  rangeTiles: number;
  attackIntervalMs: number;
  description: string;
}

export interface StorageUnit {
  id: number;
  typeId: UnitTypeId;
  tier: number; // 1, 2, 3
}

export interface Unit {
  id: number;
  typeId: UnitTypeId;
  tier: number; // 1, 2, 3
  cell: number;
  rangeTiles: number;
  damage: number;
  attackIntervalMs: number;
  cooldownMs: number;
  targetId: number | null;
  lastAttackTimeMs?: number;
  facing?: "left" | "right";
  stunnedUntilMs?: number;
  protected?: boolean;
}

export interface Monster {
  id: number;
  isBoss: boolean;
  bossStage?: number;
  isFinalBoss?: boolean;
  finalBossPhase?: 1 | 2 | 3 | 4;
  finalBossTargetPhase?: 1 | 2 | 3 | 4;
  finalBossMode?: "intro" | "flash" | "absorbing" | "combat" | "releasing";
  finalBossTransitionEndsAtMs?: number;
  finalBossFlashNext?: "absorbing" | "combat" | "remove";
  finalBossEnding?: boolean;
  finalBossDebugAutoPhase?: boolean;
  finalBossDebugPhaseEndsAtMs?: number;
  category: MonsterCategory;
  hp: number;
  maxHp: number;
  pathStep: number;
  progress: number;
  speedTilesPerSecond: number;
  laps: number; // 일반 몬스터만 5회 도착 시 게임 오버
  route?: number[]; // 지형 변경 직후 현재 위치에서 새 전역 경로로 합류하는 임시 경로
  lastHitTime?: number;
  statusImmunityUntilMs?: number; // 1초 상태이상 공통 면역
  slowUntilMs?: number; // 둔화 만료 시각
  paralyzeUntilMs?: number; // 마비 만료 시각
  burnHitTriggered?: boolean;
  burnEffectUntilMs?: number;
  sniperImpactUntilMs?: number;
  summonedByBossId?: number;
  noKillGold?: boolean;
  stage05BeingAbsorbed?: boolean;
  stage05ShieldActive?: boolean;
  stage05NextSummonAtMs?: number;
  stage05SummoningUntilMs?: number;
  stage05AbsorbAtMs?: number;
  stage05AbsorbingUntilMs?: number;
  stage05PendingHeal?: number;
  stage10NextStompAtMs?: number;
  stage10StompImpactAtMs?: number;
  stage15State?: "phoenix" | "transforming" | "egg" | "hatching";
  stage15PhaseEndsAtMs?: number;
  stage15ReviveAtMs?: number;
  stage15EggMaxHp?: number;
  stage15ReviveCount?: number;
  stage20State?: "waiting" | "charging" | "shielded" | "stunned";
  stage20NextShieldAtMs?: number;
  stage20CastEndsAtMs?: number;
  stage20ShieldHp?: number;
  stage20ShieldMaxHp?: number;
  stage20StunnedUntilMs?: number;
  stage20ShieldHitUntilMs?: number;
  stage20ShieldBreakUntilMs?: number;
  stage25NextReforgeAtMs?: number;
  stage25CastEndsAtMs?: number;
  stage25TargetCells?: number[];
  stage30StoneCount?: number;
  stage30StoneHp?: number;
  stage30StoneMaxHp?: number;
  stage30WeakUntilMs?: number;
  stage30NextTeleportAtMs?: number;
  stage30TeleportEndsAtMs?: number;
  stage30TeleportTargetStep?: number;
  stage30MagneticFieldUntilMs?: number;
  stage30MagneticFieldCell?: number;
}

export interface Projectile {
  id: number;
  sourceUnitId: number;
  sourceTypeId: UnitTypeId;
  fromCell: number;
  targetId: number;
  damage: number;
  baseDamage: number; // 상성·거리 배율을 적용하기 전 공격 피해
  specType: SpecType;
  rangeTiles: number;
  progress: number; // 0 to 1
  delayMs: number; // 공격 모션의 타격 프레임까지 발사를 기다리는 시간
  durationMs: number;
  effectType?: "normal" | "magic_swordsman" | "fire" | "ice" | "lightning" | "sniper" | "shotgun";
}

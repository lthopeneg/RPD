import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GameBoard from "../components/rogueTd/GameBoard";
import StorageBoard from "../components/rogueTd/StorageBoard";
import SynergyHud from "../components/rogueTd/SynergyHud";
import CommandPanel from "../components/rogueTd/CommandPanel";
import UpgradeStrip from "../components/rogueTd/UpgradeStrip";
import GameLog from "../components/rogueTd/GameLog";
import type { GameLogEntry } from "../components/rogueTd/GameLog";
import UnitDetailPanel from "../components/rogueTd/UnitDetailPanel";
import BossDetailPanel from "../components/rogueTd/BossDetailPanel";
import DamageReport from "../components/rogueTd/DamageReport";
import type { WaveDamageEntry } from "../components/rogueTd/DamageReport";
import ContextActionMenu from "../components/rogueTd/ContextActionMenu";
import DebugPanel from "../components/rogueTd/DebugPanel";
import UltimateCutIn from "../components/rogueTd/UltimateCutIn";
import type { DebugBrush, DebugMonsterEntry, DebugStagePreset } from "../components/rogueTd/DebugPanel";
import { generateMap } from "../games/rogueTd/mapGenerator";
import { findShortestPath, toRC } from "../games/rogueTd/pathfinding";
import {
  getSpecSynergyDamageMultiplier,
  getSynergyState,
  MAGE_STATUS_CHANCE_BONUS,
  RANGER_RANGE_BONUS_TILES,
  WARRIOR_ATTACK_SPEED_BONUS,
} from "../games/rogueTd/synergies";
import {
  BOSS_KILL_GOLD,
  BOSS_SNIPER_DAMAGE_MULTIPLIER,
  CHAIN_LIGHTNING_COOLDOWN_MS,
  DAMAGE_MULTIPLIERS,
  CELL_COUNT,
  COLS,
  ROWS,
  FIRE_AREA_CHANCE,
  FIRE_SPLASH_RATIO,
  FROZEN_ORB_COOLDOWN_MS,
  FROZEN_ORB_DURATION_MS,
  FROZEN_ORB_TICK_MS,
  getWaveTimeLimit,
  getBossCategory,
  getBossClearGold,
  getBossHp,
  getRequiredXp,
  getUnitDeployLimit,
  getUnitTierAttackSpeedBonus,
  getUnitTierDamageMultiplier,
  getUnitUpgradeDamageMultiplier,
  getUnitTierRangeBonus,
  getMonsterHp,
  getWaveMonsterCategory,
  getWaveComposition,
  getWaveMonsterCount,
  ICE_SLOW_CHANCE,
  isFinalStage,
  isBossWave,
  LIGHTNING_PARALYZE_CHANCE,
  MAGIC_MARK_CHANCE,
  MAGIC_MARK_DURATION_MS,
  MAX_MONSTER_LAPS,
  MAX_PLAYER_LEVEL,
  MONSTER_KILL_GOLD,
  MONSTER_SPAWN_MS,
  MONSTER_STATS,
  NATURAL_DESTROY_COST,
  PLAYER_WALL_COST,
  PLAYER_WALL_LIMIT,
  PLAYER_WALL_REFUND_RATE,
  PROTOTYPE_WAVES,
  SHOP_DRAW_COST,
  SHOTGUN_BARRAGE_COOLDOWN_MS,
  SHOTGUN_BARRAGE_RADIUS_TILES,
  TIER3_SHOTGUN_BARRAGE_RADIUS_TILES,
  SNIPER_EXECUTE_CHANCE,
  SWORDSMAN_COMBO_COOLDOWN_MS,
  SWORDSMAN_COMBO_DAMAGE_RATIO,
  TIER3_SWORDSMAN_COMBO_COOLDOWN_MS,
  TIER3_SWORDSMAN_COMBO_DAMAGE_RATIO,
  TIER3_DUAL_BLEED_CHANCE,
  TIER3_DUAL_BLEED_DURATION_MS,
  DUAL_BLOOD_FLURRY_COOLDOWN_MS,
  MAGIC_MARK_FIELD_COOLDOWN_MS,
  FIRE_PILLAR_COOLDOWN_MS,
  SNIPER_KILL_SHOT_COOLDOWN_MS,
  TIER3_RIFLE_CRIT_CHANCE,
  TIER3_RIFLE_CRIT_DAMAGE_RATIO,
  TIER3_SNIPER_HAWK_EYE_DAMAGE_RATIO,
  TIER3_SNIPER_KILL_SHOT_DAMAGE_RATIO,
  TIER3_FROZEN_ORB_RADIUS_TILES,
  TIER3_FROZEN_ORB_MOVE_TILES_PER_SEC,
  TIER3_CHAIN_MAX_TARGETS,
  DUAL_BLEED_CHANCE,
  DUAL_BLEED_DURATION_MS,
  DUAL_BLEED_MAX_TICK_DAMAGE,
  DUAL_BLEED_TICK_MS,
  RIFLE_ADRENALINE_BOOST_MS,
  RIFLE_ADRENALINE_CYCLE_MS,
  RIFLE_ADRENALINE_FATIGUE_MS,
  RIFLE_ADRENALINE_READY_MS,
  START_GOLD,
  START_LIFE,
  START_PLAYER_LEVEL,
  STAGE05_ABSORB_CAST_MS,
  STAGE05_FIRST_SUMMON_DELAY_MS,
  STAGE05_SKELETON_HP_RATIO,
  STAGE05_SKELETON_SPEED_RATIO,
  STAGE05_SUMMON_CAST_MS,
  STAGE05_SUMMON_COUNT,
  STAGE05_SUMMON_CYCLE_MS,
  STAGE10_FIRST_STOMP_DELAY_MS,
  STAGE10_STOMP_COOLDOWN_MS,
  STAGE10_STOMP_RADIUS_TILES,
  STAGE10_STOMP_STUN_MS,
  STAGE10_STOMP_WARNING_MS,
  STAGE15_EGG_DAMAGE_REDUCTION,
  STAGE15_EGG_HATCH_DELAY_MS,
  STAGE15_EGG_HP_RATIO,
  STAGE15_REPEAT_EGG_HP_RATIO,
  STAGE15_HATCH_MS,
  STAGE15_REVIVE_HP_RATIO,
  STAGE15_TRANSFORM_MS,
  STAGE20_BREAK_COOLDOWN_MS,
  STAGE20_BREAK_DAMAGE_MULTIPLIER,
  STAGE20_BREAK_STUN_MS,
  STAGE20_FIRST_SHIELD_DELAY_MS,
  STAGE20_SHIELD_CAST_MS,
  STAGE20_SHIELD_DAMAGE_REDUCTION,
  STAGE20_SHIELD_RATIO,
  STAGE20_SHIELD_REFRESH_MS,
  STAGE20_SHIELD_SEGMENTS,
  STAGE20_SHIELDED_SPEED_RATIO,
  STAGE25_SPEED_RATIO,
  STAGE25_FIRST_REFORGE_DELAY_MS,
  STAGE25_REFORGE_CAST_MS,
  STAGE25_REFORGE_COOLDOWN_MS,
  STAGE25_REFORGE_TARGET_COUNT,
  STAGE30_FIRST_TELEPORT_DELAY_MS,
  STAGE30_MAGNETIC_FIELD_MS,
  STAGE30_MAGNETIC_RADIUS_TILES,
  STAGE30_MAGNETIC_STUN_MS,
  STAGE30_STONE_COUNT,
  STAGE30_STONE_HP_RATIO,
  STAGE30_TELEPORT_CAST_MS,
  STAGE30_TELEPORT_COOLDOWN_MS,
  STAGE30_WEAK_DAMAGE_MULTIPLIER,
  STAGE30_WEAK_DURATION_MS,
  UNIT_SELL_PRICES,
  UNIT_TYPES,
  UPGRADE_DAMAGE_PER_LEVEL,
  UPGRADE_DRAW_COST,
  WAVE_CLEAR_GOLD,
  WAVE_TIMEOUT_GOLD,
  WAVE_TIME_LIMIT_SEC,
  XP_PER_PURCHASE,
  XP_PURCHASE_COST,
} from "../games/rogueTd/constants";
import {
  getUpgradeLabel,
  getUpgradeLevels,
  rollDamageUpgrade,
} from "../games/rogueTd/upgrades";
import type { DamageUpgrade } from "../games/rogueTd/upgrades";
import type {
  CellData,
  Monster,
  MonsterCategory,
  Projectile,
  StorageUnit,
  SpecType,
  Unit,
  UnitClass,
  UnitTypeId,
} from "../games/rogueTd/types";

const SCS_LOGO = new URL("../images/scs-logo.png", import.meta.url).href;

const ALL_UNIT_TYPES: UnitTypeId[] = [
  "swordsman",
  "dual_swordsman",
  "magic_swordsman",
  "fire_mage",
  "ice_mage",
  "lightning_mage",
  "rifleman",
  "shotgunner",
  "sniper",
];
const DEBUG_ACCESS_CODE = "0427";
const ULTIMATE_FIRST_ROLL_MS = 20000;
const ULTIMATE_FAIL_COOLDOWN_MS = 15000;
const ULTIMATE_SUCCESS_COOLDOWN_MS = 60000;
const ULTIMATE_TRIGGER_CHANCE = 0.25;
const ULTIMATE_DAMAGE_MULTIPLIER: Record<UnitClass, number> = {
  warrior: 3,
  mage: 3,
  ranger: 1.75,
};
const ULTIMATE_UNIT_TYPES: Record<UnitClass, UnitTypeId[]> = {
  warrior: ["swordsman", "dual_swordsman", "magic_swordsman"],
  mage: ["fire_mage", "ice_mage", "lightning_mage"],
  ranger: ["rifleman", "shotgunner", "sniper"],
};
const ACTIVE_SKILL_INITIAL_COOLDOWN: Partial<Record<UnitTypeId, number>> = {
  swordsman: SWORDSMAN_COMBO_COOLDOWN_MS,
  ice_mage: FROZEN_ORB_COOLDOWN_MS,
  lightning_mage: CHAIN_LIGHTNING_COOLDOWN_MS,
  rifleman: RIFLE_ADRENALINE_READY_MS,
  shotgunner: SHOTGUN_BARRAGE_COOLDOWN_MS,
};
const TIER3_ACTIVE_SKILL_COOLDOWN: Partial<Record<UnitTypeId, number>> = {
  dual_swordsman: DUAL_BLOOD_FLURRY_COOLDOWN_MS,
  magic_swordsman: MAGIC_MARK_FIELD_COOLDOWN_MS,
  fire_mage: FIRE_PILLAR_COOLDOWN_MS,
  sniper: SNIPER_KILL_SHOT_COOLDOWN_MS,
};
interface UltimateContribution {
  unitId: number;
  typeId: UnitTypeId;
  damage: number;
}
interface UltimateJob {
  unitClass: UnitClass;
  unitTypeIds: UnitTypeId[];
  contributions: UltimateContribution[];
  previewOnly?: boolean;
}
interface UltimateSequence {
  job: UltimateJob;
  phase: "cutin" | "impact";
  token: number;
}
interface Tier3FirePillar {
  id: number;
  row: number;
  col: number;
  damageRowStart: number;
  damageColStart: number;
  sourceUnitId: number;
  baseDamage: number;
  specType: SpecType;
  nextTickMs: number;
  untilMs: number;
}
interface PendingHeavenlyStrike {
  id: number;
  targetId: number;
  sourceUnitId: number;
  baseDamage: number;
  specType: SpecType;
  impactAtMs: number;
}

const getDebugPresetStage = (preset: DebugStagePreset) => {
  if (preset === "normal-human") return 1;
  if (preset === "normal-land") return 2;
  if (preset === "normal-flying") return 3;
  if (preset === "normal-mixed") return 4;
  if (preset.startsWith("boss-")) return Number(preset.slice(5));
  return 36;
};

const getDebugPresetCategory = (preset: DebugStagePreset): MonsterCategory | "mixed" => {
  if (preset === "normal-land") return "land";
  if (preset === "normal-flying") return "flying";
  if (preset === "normal-mixed") return "mixed";
  return "human";
};

const getRandomUnitType = (): UnitTypeId => {
  const idx = Math.floor(Math.random() * ALL_UNIT_TYPES.length);
  return ALL_UNIT_TYPES[idx];
};

export default function RogueTdPage() {
  const initial = useMemo(() => generateMap(), []);
  const [grid, setGrid] = useState<CellData[]>(initial.grid);
  const [start, setStart] = useState(initial.start),
    [goal, setGoal] = useState(initial.goal);
  const [path, setPath] = useState(initial.path),
    [pathVisible, setPathVisible] = useState(true);
  const [gold, setGold] = useState(START_GOLD),
    [life, setLife] = useState(START_LIFE),
    [wave, setWave] = useState(1);
  const [playerLevel, setPlayerLevel] = useState(START_PLAYER_LEVEL);
  const [playerXp, setPlayerXp] = useState(0);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const [gameSpeed, setGameSpeed] = useState<1 | 2>(1);
  const [debugMode, setDebugMode] = useState(false);
  const [debugBrush, setDebugBrush] = useState<DebugBrush | null>(null);
  const [debugStagePreset, setDebugStagePreset] = useState<DebugStagePreset>("boss-5");
  const [debugCodePromptOpen, setDebugCodePromptOpen] = useState(false);
  const [debugCodeInput, setDebugCodeInput] = useState("");
  const [debugCodeError, setDebugCodeError] = useState(false);
  const [gameResult, setGameResult] = useState<"playing" | "won" | "lost">(
    "playing",
  );
  const [units, setUnits] = useState<Unit[]>([]),
    [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [selectedBossId, setSelectedBossId] = useState<number | null>(null);
  const [showStageBossInfo, setShowStageBossInfo] = useState(false);
  const [bossWarning, setBossWarning] = useState<{ stage: number; token: number } | null>(null);
  const bossWarningSequence = useRef(0);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const nextProjectile = useRef(1);
  const [toSpawn, setToSpawn] = useState(0),
    [status, setStatus] = useState("유닛을 구매한 뒤 자연벽에 배치해봐.");
  const nextUnit = useRef(1),
    nextMonster = useRef(1),
    lastSpawnGameMs = useRef(0),
    lastFrame = useRef(0);

  // 전투·상태이상·제한시간은 일시정지와 배속을 공유하는 게임 시간을 사용한다.
  const gameTimeMs = useRef(0);
  const waveTimeRemainingMs = useRef(WAVE_TIME_LIMIT_SEC * 1000);
  const boardShakeUntilMs = useRef(0);
  const [waveTimeRemainingSec, setWaveTimeRemainingSec] = useState(WAVE_TIME_LIMIT_SEC);

  // 창고(보관함 4x5 = 20칸) state
  const [storageSlots, setStorageSlots] = useState<(StorageUnit | null)[]>(
    Array(20).fill(null),
  );
  const gridRef = useRef(grid);
  const pathRef = useRef(path);
  const storageSlotsRef = useRef(storageSlots);
  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { pathRef.current = path; }, [path]);
  useEffect(() => { storageSlotsRef.current = storageSlots; }, [storageSlots]);
  const [selectedStorageIndex, setSelectedStorageIndex] = useState<
    number | null
  >(null);
  const [activeCellIndex, setActiveCellIndex] = useState<number | null>(null);
  const [activeStorageIndex, setActiveStorageIndex] = useState<number | null>(null);
  const [mapPlacementTarget, setMapPlacementTarget] = useState<number | null>(null);
  const [highlightMapPlacement, setHighlightMapPlacement] = useState(false);
  const [upgrades, setUpgrades] = useState<DamageUpgrade[]>([]);
  const [damageReportWave, setDamageReportWave] = useState<number | null>(null);
  const [waveDamageReport, setWaveDamageReport] = useState<WaveDamageEntry[]>([]);
  const [gameLogs, setGameLogs] = useState<GameLogEntry[]>([
    { id: 1, message: "새 게임을 시작했습니다." },
  ]);
  const nextLog = useRef(2);
  const waveDamageRef = useRef<Record<number, number>>({});
  const waveUnitsRef = useRef<Unit[]>([]);
  const [ultimateSequence, setUltimateSequence] = useState<UltimateSequence | null>(null);
  const ultimateActiveRef = useRef(false);
  const ultimateQueueRef = useRef<UltimateJob[]>([]);
  const pendingUltimateHitsRef = useRef<UltimateJob[]>([]);
  const ultimateSequenceToken = useRef(0);
  const ultimateNextRollAtRef = useRef<Record<UnitClass, number>>({
    warrior: Number.POSITIVE_INFINITY,
    mage: Number.POSITIVE_INFINITY,
    ranger: Number.POSITIVE_INFINITY,
  });

  const enqueueUltimate = useCallback((job: UltimateJob) => {
    if (ultimateActiveRef.current) {
      ultimateQueueRef.current.push(job);
      return;
    }
    ultimateActiveRef.current = true;
    ultimateSequenceToken.current += 1;
    setUltimateSequence({ job, phase: "cutin", token: ultimateSequenceToken.current });
  }, []);

  useEffect(() => {
    if (!ultimateSequence) return;
    if (ultimateSequence.phase === "cutin") {
      const timeout = window.setTimeout(() => {
        if (!ultimateSequence.job.previewOnly) pendingUltimateHitsRef.current.push(ultimateSequence.job);
        setUltimateSequence({ ...ultimateSequence, phase: "impact" });
      }, 2200);
      return () => window.clearTimeout(timeout);
    }

    const timeout = window.setTimeout(() => {
      const nextJob = ultimateQueueRef.current.shift();
      if (nextJob) {
        ultimateSequenceToken.current += 1;
        setUltimateSequence({ job: nextJob, phase: "cutin", token: ultimateSequenceToken.current });
      } else {
        ultimateActiveRef.current = false;
        setUltimateSequence(null);
        lastFrame.current = performance.now();
      }
    }, ultimateSequence.job.unitClass === "ranger"
      ? 6000
      : ultimateSequence.job.unitClass === "warrior"
        ? 4250
        : 5700);
    return () => window.clearTimeout(timeout);
  }, [ultimateSequence]);

  const triggerBossWarning = (stage: number) => {
    bossWarningSequence.current += 1;
    setBossWarning({ stage, token: bossWarningSequence.current });
  };

  const handleDebugPreviewUltimate = (unitClass: UnitClass) => {
    enqueueUltimate({
      unitClass,
      unitTypeIds: ULTIMATE_UNIT_TYPES[unitClass],
      contributions: [],
      previewOnly: true,
    });
  };

  useEffect(() => {
    if (!bossWarning) return;
    const timeout = window.setTimeout(() => setBossWarning(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [bossWarning]);

  const wallCount = grid.filter((c) => c.type === "player").length;
  const unitDeployLimit = getUnitDeployLimit(playerLevel);
  const synergy = useMemo(() => getSynergyState(units), [units]);
  const waveComposition = useMemo(() => {
    if (!debugMode) return getWaveComposition(wave);
    const presetCategory = getDebugPresetCategory(debugStagePreset);
    if (debugStagePreset.startsWith("normal-")) {
      if (presetCategory === "mixed") return { human: 1, land: 1, flying: 1 };
      return {
        human: presetCategory === "human" ? 1 : 0,
        land: presetCategory === "land" ? 1 : 0,
        flying: presetCategory === "flying" ? 1 : 0,
      };
    }
    return getWaveComposition(wave);
  }, [debugMode, debugStagePreset, wave]);
  const waveCompositionTotal = waveComposition.human + waveComposition.land + waveComposition.flying;
  const wavePercent = (count: number) => waveCompositionTotal > 0
    ? Math.round(count / waveCompositionTotal * 100)
    : 0;
  const waveMonsterTotal = isBossWave(wave) ? 1 : getWaveMonsterCount(wave);
  const waveTimeLimit = getWaveTimeLimit(wave);
  const remainingMonsterCount = running ? monsters.length + toSpawn : waveMonsterTotal;
  const requiredPlayerXp = playerLevel < MAX_PLAYER_LEVEL ? getRequiredXp(playerLevel) : 0;
  const playerXpPercent = playerLevel < MAX_PLAYER_LEVEL
    ? Math.min(100, playerXp / requiredPlayerXp * 100)
    : 100;
  const highestMonsterLaps = monsters.reduce(
    (highest, monster) => monster.isBoss ? highest : Math.max(highest, monster.laps),
    0,
  );

  const handleToggleDebug = () => {
    if (debugMode) {
      setDebugMode(false);
      setDebugBrush(null);
      return;
    }
    setDebugCodeInput("");
    setDebugCodeError(false);
    setDebugCodePromptOpen(true);
  };

  const submitDebugCode = () => {
    if (debugCodeInput !== DEBUG_ACCESS_CODE) {
      setDebugCodeError(true);
      setDebugCodeInput("");
      return;
    }
    setDebugMode(true);
    setDebugBrush(null);
    setDebugCodePromptOpen(false);
    setDebugCodeError(false);
    setStatus("🛠 디버그 모드를 활성화했습니다.");
  };
  const selectedDetailUnit = selectedUnitId !== null
    ? units.find((unit) => unit.id === selectedUnitId) ?? null
    : selectedStorageIndex !== null
      ? storageSlots[selectedStorageIndex]
      : null;
  const selectedBoss = selectedBossId !== null
    ? monsters.find((monster) => monster.id === selectedBossId && monster.isBoss) ?? null
    : null;
  const stageBossPreview = useMemo<Monster | null>(() => {
    if (!isBossWave(wave)) return null;
    const isFinalBoss = isFinalStage(wave);
    const rawHp = getBossHp(wave);
    const hp = isFinalBoss ? Math.max(1, Math.round(rawHp / 4)) : rawHp;
    const category = getBossCategory(wave);
    return {
      id: -wave,
      isBoss: true,
      bossStage: wave,
      isFinalBoss,
      finalBossPhase: isFinalBoss ? 4 : undefined,
      finalBossMode: isFinalBoss ? "combat" : undefined,
      category,
      hp,
      maxHp: hp,
      pathStep: 0,
      progress: 0,
      speedTilesPerSecond: MONSTER_STATS[category].speed * (wave === 25 ? STAGE25_SPEED_RATIO : 1),
      laps: 0,
      stage15State: wave === 15 ? "phoenix" : undefined,
      stage15ReviveCount: wave === 15 ? 0 : undefined,
      stage20State: wave === 20 ? "waiting" : undefined,
      stage30StoneCount: wave === 30 ? STAGE30_STONE_COUNT : undefined,
      stage30StoneMaxHp: wave === 30 ? Math.max(1, Math.round(hp * STAGE30_STONE_HP_RATIO)) : undefined,
      stage30StoneHp: wave === 30 ? Math.max(1, Math.round(hp * STAGE30_STONE_HP_RATIO)) : undefined,
    };
  }, [wave]);
  const bossDetailTarget = selectedBoss ?? (showStageBossInfo ? stageBossPreview : null);
  const addLog = useCallback((message: string) => {
    setGameLogs((current) => [...current.slice(-99), { id: nextLog.current++, message }]);
  }, []);

  // 3개 이상 모인 유닛 조합(승급 가능 키) 계산
  const combinableKeys = useMemo(() => {
    const counts: Record<string, number> = {};
    storageSlots.forEach((s) => {
      if (s && s.tier < 3) {
        const key = `${s.typeId}_${s.tier}`;
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    units.forEach((u) => {
      if (u.tier < 3) {
        const key = `${u.typeId}_${u.tier}`;
        counts[key] = (counts[key] || 0) + 1;
      }
    });

    const set = new Set<string>();
    Object.entries(counts).forEach(([key, cnt]) => {
      if (cnt >= 3) set.add(key);
    });
    return set;
  }, [storageSlots, units]);

  const resetMap = useCallback(() => {
    const m = generateMap();
    setGrid(m.grid);
    setStart(m.start);
    setGoal(m.goal);
    setPath(m.path);
    setGold(START_GOLD);
    setLife(START_LIFE);
    setWave(1);
    setBossWarning(null);
    setPlayerLevel(START_PLAYER_LEVEL);
    setPlayerXp(0);
    setUnits([]);
    setMonsters([]);
    setProjectiles([]);
    setStorageSlots(Array(20).fill(null));
    setSelectedStorageIndex(null);
    setActiveCellIndex(null);
    setActiveStorageIndex(null);
    setMapPlacementTarget(null);
    setHighlightMapPlacement(false);
    setUpgrades([]);
    setDamageReportWave(null);
    setWaveDamageReport([]);
    nextLog.current = 2;
    setGameLogs([{ id: 1, message: "새 게임을 시작했습니다." }]);
    waveDamageRef.current = {};
    waveUnitsRef.current = [];
    monstersRef.current = [];
    projectilesRef.current = [];
    tier3FirePillarsRef.current = [];
    unitsRef.current = [];
    setToSpawn(0);
    setRunning(false);
    setPaused(false);
    pausedRef.current = false;
    setGameSpeed(1);
    gameTimeMs.current = 0;
    boardShakeUntilMs.current = 0;
    ultimateActiveRef.current = false;
    ultimateQueueRef.current = [];
    pendingUltimateHitsRef.current = [];
    setUltimateSequence(null);
    ultimateNextRollAtRef.current = {
      warrior: Number.POSITIVE_INFINITY,
      mage: Number.POSITIVE_INFINITY,
      ranger: Number.POSITIVE_INFINITY,
    };
    waveTimeRemainingMs.current = WAVE_TIME_LIMIT_SEC * 1000;
    lastSpawnGameMs.current = 0;
    setGameResult("playing");
    setSelectedUnitId(null);
    setSelectedBossId(null);
    setWaveTimeRemainingSec(WAVE_TIME_LIMIT_SEC);
    setStatus("새 맵 생성 완료. 유닛을 구매한 뒤 자연벽에 배치해봐.");
  }, []);

  function recalc(next: CellData[]) {
    const p = findShortestPath(next, start, goal);
    if (p) setPath(p);
    return p;
  }

  // 상점에서 유닛 구매 -> 창고로 보관
  const handleBuyShopUnit = () => {
    if (gold < SHOP_DRAW_COST || running || gameResult !== "playing") return;

    const emptySlotIdx = storageSlots.findIndex((s) => s === null);
    if (emptySlotIdx === -1) {
      setStatus("⚠️ 창고가 가득 찼어! 맵에 유닛을 먼저 배치해줘.");
      return;
    }

    const typeId = getRandomUnitType();
    const newStorageUnitId = nextUnit.current++;

    setGold((g) => g - SHOP_DRAW_COST);
    setStorageSlots((slots) =>
      slots.map((s, idx) =>
        idx === emptySlotIdx
          ? { id: newStorageUnitId, typeId, tier: 1 }
          : s,
      ),
    );
    clearInteraction();
    setStatus(
      `🛒 [${UNIT_TYPES[typeId].name}] 구매 완료! 창고 📦${emptySlotIdx + 1}번 칸에 보관되었어.`,
    );
    addLog(`${UNIT_TYPES[typeId].name}을(를) 뽑았습니다.`);
  };

  const handleBuyUpgrade = () => {
    if (
      running ||
      gameResult !== "playing" ||
      gold < UPGRADE_DRAW_COST
    ) return;

    const upgrade = rollDamageUpgrade();
    setGold((g) => g - UPGRADE_DRAW_COST);
    setUpgrades((current) => [...current, upgrade]);
    setStatus(`✨ ${getUpgradeLabel(upgrade)} 획득! 피해량 +${upgrade.levels * UPGRADE_DAMAGE_PER_LEVEL * 100}%`);
    addLog(`${getUpgradeLabel(upgrade)}을(를) 획득했습니다.`);
  };

  const handleBuyXp = () => {
    if (running || gameResult !== "playing" || playerLevel >= MAX_PLAYER_LEVEL || gold < XP_PURCHASE_COST) return;

    let nextLevel = playerLevel;
    let nextXp = playerXp + XP_PER_PURCHASE;
    while (nextLevel < MAX_PLAYER_LEVEL && nextXp >= getRequiredXp(nextLevel)) {
      nextXp -= getRequiredXp(nextLevel);
      nextLevel += 1;
    }
    if (nextLevel >= MAX_PLAYER_LEVEL) nextXp = 0;

    setGold((g) => g - XP_PURCHASE_COST);
    setPlayerLevel(nextLevel);
    setPlayerXp(nextXp);
    setStatus(nextLevel > playerLevel
      ? `🎉 플레이어 Lv.${nextLevel}! 유닛 배치 한도가 ${getUnitDeployLimit(nextLevel)}기로 증가했어.`
      : `📘 경험치 +${XP_PER_PURCHASE} (${nextXp}/${getRequiredXp(nextLevel)})`);
    if (nextLevel > playerLevel) addLog(`플레이어가 Lv.${nextLevel}로 레벨업했습니다.`);
  };

  const handleSellStorageUnit = (index: number) => {
    if (running) return;
    const unit = storageSlots[index];
    if (!unit) return;
    const price = UNIT_SELL_PRICES[unit.tier as 1 | 2 | 3];
    setStorageSlots((slots) => slots.map((slot, idx) => idx === index ? null : slot));
    setGold((g) => g + price);
    if (selectedStorageIndex === index) setSelectedStorageIndex(null);
    setStatus(`💰 [${UNIT_TYPES[unit.typeId].name} ${"★".repeat(unit.tier)}] 판매 완료! +${price}G`);
    addLog(`${UNIT_TYPES[unit.typeId].name}을(를) 팔아서 ${price}골드를 획득했습니다.`);
  };

  // 수동 3성 승급 버튼 핸들러
  const handleCombineUnits = (typeId: UnitTypeId, tier: number, mapUnitId?: number) => {
    if (running || tier >= 3) return;

    let needed = 3;
    const newStorageSlots = [...storageSlots];
    const newUnits = [...units];
    const anchorUnit = mapUnitId === undefined
      ? null
      : newUnits.find((unit) => unit.id === mapUnitId) ?? null;
    let resultCell: number | null = anchorUnit?.cell ?? null;

    // 맵에서 승급을 누른 유닛은 먼저 재료로 사용하고 그 자리를 결과 위치로 고정한다.
    if (anchorUnit) {
      const anchorIndex = newUnits.findIndex((unit) => unit.id === anchorUnit.id);
      newUnits.splice(anchorIndex, 1);
      needed -= 1;
    }

    // 창고의 동일 유닛을 재료로 사용한다.
    for (let i = 0; i < newStorageSlots.length && needed > 0; i++) {
      const s = newStorageSlots[i];
      if (s && s.typeId === typeId && s.tier === tier) {
        newStorageSlots[i] = null;
        needed--;
      }
    }

    // 부족한 재료는 맵에 배치된 동일 유닛에서 사용한다.
    for (let i = newUnits.length - 1; i >= 0 && needed > 0; i--) {
      const u = newUnits[i];
      if (u.typeId === typeId && u.tier === tier) {
        if (resultCell === null) resultCell = u.cell;
        newUnits.splice(i, 1);
        needed--;
      }
    }

    if (needed > 0) {
      setStatus("⚠️ 승급에 필요한 동일 유닛 3개가 부족해!");
      return;
    }

    const upgradedId = nextUnit.current++;
    if (anchorUnit) {
      const def = UNIT_TYPES[typeId];
      newUnits.push({
        id: upgradedId,
        typeId,
        tier: tier + 1,
        cell: anchorUnit.cell,
        rangeTiles: def.rangeTiles,
        damage: def.damage,
        attackIntervalMs: def.attackIntervalMs,
        cooldownMs: 0,
        targetId: null,
        protected: anchorUnit.protected ?? true,
      });
    } else {
      const emptySlotIdx = newStorageSlots.findIndex((s) => s === null);
      if (emptySlotIdx !== -1) {
        newStorageSlots[emptySlotIdx] = {
          id: upgradedId,
          typeId,
          tier: tier + 1,
        };
      } else if (resultCell !== null) {
        const def = UNIT_TYPES[typeId];
        newUnits.push({
          id: upgradedId,
          typeId,
          tier: tier + 1,
          cell: resultCell,
          rangeTiles: def.rangeTiles,
          damage: def.damage,
          attackIntervalMs: def.attackIntervalMs,
          cooldownMs: 0,
          targetId: null,
          protected: true,
        });
      } else {
        setStatus("⚠️ 승급된 유닛을 보관할 공간이 부족해!");
        return;
      }
    }

    setStorageSlots(newStorageSlots);
    setUnits(newUnits);
    const targetDef = UNIT_TYPES[typeId];
    setStatus(
      `✨ [${targetDef.name}] ${tier}성 유닛 3개로 ${tier + 1}성 승급 완료! (${"★".repeat(tier + 1)})${anchorUnit ? " 기존 위치 유지" : ""}`,
    );
    addLog(`${targetDef.name}이(가) ${tier + 1}성 승급에 성공했습니다.`);
  };

  const clearInteraction = () => {
    setSelectedUnitId(null);
    setSelectedBossId(null);
    setSelectedStorageIndex(null);
    setActiveCellIndex(null);
    setActiveStorageIndex(null);
    setMapPlacementTarget(null);
    setHighlightMapPlacement(false);
  };

  const handleBossClick = (monsterId: number) => {
    setSelectedBossId((current) => current === monsterId ? null : monsterId);
    setShowStageBossInfo(false);
    setSelectedUnitId(null);
    setSelectedStorageIndex(null);
    setActiveCellIndex(null);
    setActiveStorageIndex(null);
    setMapPlacementTarget(null);
    setHighlightMapPlacement(false);
  };

  const clearDebugCombat = () => {
    setRunning(false);
    setPaused(false);
    pausedRef.current = false;
    ultimateActiveRef.current = false;
    ultimateQueueRef.current = [];
    pendingUltimateHitsRef.current = [];
    setUltimateSequence(null);
    setToSpawn(0);
    setMonsters([]);
    setProjectiles([]);
    monstersRef.current = [];
    projectilesRef.current = [];
    tier3FirePillarsRef.current = [];
    const restedUnits = unitsRef.current.map((unit) => ({
      ...unit,
      cooldownMs: 0,
      targetId: null,
      lastAttackTimeMs: undefined,
      stunnedUntilMs: undefined,
    }));
    unitsRef.current = restedUnits;
    setUnits(restedUnits);
  };

  const handleDebugClearMap = () => {
    const nextGrid: CellData[] = Array.from({ length: CELL_COUNT }, () => ({ type: "empty" }));
    clearDebugCombat();
    clearInteraction();
    setGrid(nextGrid);
    setPath(findShortestPath(nextGrid, start, goal) ?? [start, goal]);
    setUnits([]);
    unitsRef.current = [];
    setStatus("🛠 디버그: 빈 맵으로 초기화했습니다.");
  };

  const handleDebugCellClick = (cellIndex: number) => {
    if (!debugBrush) return;
    if (debugBrush === "start" && cellIndex === goal) {
      setStatus("⚠️ 시작점과 골 지점은 같은 칸에 둘 수 없습니다.");
      return;
    }
    if (debugBrush === "goal" && cellIndex === start) {
      setStatus("⚠️ 시작점과 골 지점은 같은 칸에 둘 수 없습니다.");
      return;
    }

    const nextGrid = grid.map((cell) => ({ ...cell }));
    let nextStart = start;
    let nextGoal = goal;
    if (debugBrush === "start") {
      nextStart = cellIndex;
      nextGrid[cellIndex] = { type: "empty" };
    } else if (debugBrush === "goal") {
      nextGoal = cellIndex;
      nextGrid[cellIndex] = { type: "empty" };
    } else {
      if (cellIndex === start || cellIndex === goal) {
        setStatus("⚠️ 시작점과 골 지점에는 벽을 놓을 수 없습니다.");
        return;
      }
      nextGrid[cellIndex] = debugBrush === "player"
        ? { type: "player", cost: 0, bornWave: wave - 1 }
        : { type: debugBrush };
    }

    const nextPath = findShortestPath(nextGrid, nextStart, nextGoal);
    if (!nextPath) {
      setStatus("⚠️ 경로가 완전히 막히는 설정은 적용할 수 없습니다.");
      return;
    }
    clearDebugCombat();
    clearInteraction();
    setGrid(nextGrid);
    setStart(nextStart);
    setGoal(nextGoal);
    setPath(nextPath);
    if (debugBrush === "empty" || debugBrush === "permanent") {
      setUnits((current) => current.filter((unit) => unit.cell !== cellIndex));
    }
    setStatus(`🛠 디버그 맵 도구 적용: ${debugBrush}`);
  };

  const handleDebugAddUnit = (typeId: UnitTypeId, tier: 1 | 2 | 3) => {
    const emptyIndex = storageSlots.findIndex((slot) => slot === null);
    if (emptyIndex < 0) {
      setStatus("⚠️ 창고가 가득 찼습니다.");
      return;
    }
    const unit = { id: nextUnit.current++, typeId, tier };
    setStorageSlots((slots) => slots.map((slot, index) => index === emptyIndex ? unit : slot));
    setStatus(`🛠 디버그: ${UNIT_TYPES[typeId].name} ${tier}성을 창고에 추가했습니다.`);
  };

  const handleDebugApplyStage = (preset: DebugStagePreset) => {
    const stage = getDebugPresetStage(preset);
    const timeLimit = getWaveTimeLimit(stage);
    clearDebugCombat();
    clearInteraction();
    setDebugStagePreset(preset);
    setWave(stage);
    setGameResult("playing");
    setShowStageBossInfo(false);
    gameTimeMs.current = 0;
    ultimateNextRollAtRef.current = {
      warrior: ULTIMATE_FIRST_ROLL_MS,
      mage: ULTIMATE_FIRST_ROLL_MS,
      ranger: ULTIMATE_FIRST_ROLL_MS,
    };
    waveTimeRemainingMs.current = timeLimit * 1000;
    setWaveTimeRemainingSec(timeLimit);
    setStatus(`🛠 디버그: ${stage === 36 ? "FINAL STAGE" : `${stage}스테이지`} 설정을 적용했습니다.`);
  };

  const handleDebugSpawnMonsters = (
    category: MonsterCategory,
    requestedCount: number,
    bossStage?: number,
    requestedFinalPhase?: 1 | 2 | 3 | 4,
    requestedFinalAutoPhase = false,
    mixed = false,
  ) => {
    if (path.length < 2) {
      setStatus("⚠️ 유효한 경로를 먼저 만들어 주세요.");
      return;
    }
    const count = bossStage === undefined
      ? Math.min(100, Math.max(1, Math.floor(requestedCount || 1)))
      : 1;
    const boss = bossStage !== undefined;
    const isFinalBoss = bossStage === 36;
    const finalBossPhase = isFinalBoss ? requestedFinalAutoPhase ? 4 : requestedFinalPhase ?? 1 : undefined;
    const fixedSpawnCategory = boss
      ? isFinalBoss
        ? finalBossPhase === 1 ? "human" : finalBossPhase === 2 ? "land" : "flying"
        : getBossCategory(bossStage)
      : category;
    const mixedCategories: MonsterCategory[] = ["human", "land", "flying"];
    const created: Monster[] = Array.from({ length: count }, (_, index) => {
      const spawnCategory = !boss && mixed ? mixedCategories[index % mixedCategories.length] : fixedSpawnCategory;
      const maxHp = boss ? getBossHp(bossStage) : getMonsterHp(spawnCategory, wave);
      const hp = isFinalBoss ? Math.max(1, Math.round(maxHp / 4)) : maxHp;
      return {
        id: nextMonster.current++,
        isBoss: boss,
        bossStage,
        isFinalBoss,
        finalBossPhase,
        finalBossTargetPhase: isFinalBoss && requestedFinalAutoPhase ? 1 : finalBossPhase,
        finalBossMode: isFinalBoss ? requestedFinalAutoPhase ? "intro" : "combat" : undefined,
        finalBossTransitionEndsAtMs: isFinalBoss && requestedFinalAutoPhase
          ? gameTimeMs.current + 1000
          : undefined,
        finalBossDebugAutoPhase: isFinalBoss ? requestedFinalAutoPhase : undefined,
        category: spawnCategory,
        hp,
        maxHp,
        pathStep: 0,
        progress: -index * 0.35,
        speedTilesPerSecond: MONSTER_STATS[spawnCategory].speed * (
          bossStage === 25 ? STAGE25_SPEED_RATIO : 1
        ),
        laps: 0,
        stage05NextSummonAtMs: bossStage === 5 ? gameTimeMs.current + STAGE05_FIRST_SUMMON_DELAY_MS : undefined,
        stage10NextStompAtMs: bossStage === 10 ? gameTimeMs.current + STAGE10_FIRST_STOMP_DELAY_MS : undefined,
        stage15State: bossStage === 15 ? "phoenix" as const : undefined,
        stage15ReviveCount: bossStage === 15 ? 0 : undefined,
        stage20State: bossStage === 20 ? "waiting" as const : undefined,
        stage20NextShieldAtMs: bossStage === 20 ? gameTimeMs.current + STAGE20_FIRST_SHIELD_DELAY_MS : undefined,
        stage25NextReforgeAtMs: bossStage === 25 ? gameTimeMs.current + STAGE25_FIRST_REFORGE_DELAY_MS : undefined,
        stage30StoneCount: bossStage === 30 ? STAGE30_STONE_COUNT : undefined,
        stage30StoneMaxHp: bossStage === 30 ? Math.max(1, Math.round(hp * STAGE30_STONE_HP_RATIO)) : undefined,
        stage30StoneHp: bossStage === 30 ? Math.max(1, Math.round(hp * STAGE30_STONE_HP_RATIO)) : undefined,
        stage30NextTeleportAtMs: bossStage === 30 ? gameTimeMs.current + STAGE30_FIRST_TELEPORT_DELAY_MS : undefined,
      };
    });
    const nextMonsters = running ? [...monstersRef.current, ...created] : created;
    monstersRef.current = nextMonsters;
    setMonsters([...nextMonsters]);
    setProjectiles([]);
    projectilesRef.current = [];
    tier3FirePillarsRef.current = [];
    setToSpawn(0);
    setGameResult("playing");
    setPaused(false);
    pausedRef.current = false;
    if (!running) {
      waveDamageRef.current = {};
      waveUnitsRef.current = units.map((unit) => ({ ...unit }));
      if (!Number.isFinite(ultimateNextRollAtRef.current.warrior)) {
        ultimateNextRollAtRef.current = {
          warrior: gameTimeMs.current + ULTIMATE_FIRST_ROLL_MS,
          mage: gameTimeMs.current + ULTIMATE_FIRST_ROLL_MS,
          ranger: gameTimeMs.current + ULTIMATE_FIRST_ROLL_MS,
        };
      }
      if (waveTimeRemainingMs.current <= 0) {
        waveTimeRemainingMs.current = waveTimeLimit * 1000;
        setWaveTimeRemainingSec(waveTimeLimit);
      }
    }
    setRunning(true);
    lastFrame.current = performance.now();
    const monsterLabel = isFinalBoss
      ? requestedFinalAutoPhase ? "FINAL BOSS 기믹 자동 테스트" : `FINAL BOSS ${finalBossPhase}단계`
      : boss
        ? `${bossStage}스테이지 보스`
        : mixed ? "인간·마수·비행 혼합 몬스터" : `${fixedSpawnCategory} 몬스터`;
    setStatus(`🛠 디버그: ${monsterLabel} ${count}마리를 소환했습니다.`);
  };

  const handleDebugSpawnStage = (requestedCount: number) => {
    if (debugStagePreset.startsWith("normal-")) {
      const category = getDebugPresetCategory(debugStagePreset);
      handleDebugSpawnMonsters(category === "mixed" ? "human" : category, requestedCount, undefined, undefined, false, category === "mixed");
      return;
    }
    if (debugStagePreset.startsWith("boss-")) {
      handleDebugSpawnMonsters("human", 1, getDebugPresetStage(debugStagePreset));
      return;
    }
    const phaseText = debugStagePreset.slice(6);
    handleDebugSpawnMonsters(
      "human",
      1,
      36,
      phaseText !== "auto" ? Number(phaseText) as 1 | 2 | 3 | 4 : undefined,
      phaseText === "auto",
    );
  };

  const handleDebugStartCustomWave = (entries: DebugMonsterEntry[], requestedHp: number) => {
    if (path.length < 2) {
      setStatus("⚠️ 유효한 경로를 먼저 만들어 주세요.");
      return;
    }
    const categories = entries.flatMap((entry) =>
      Array.from(
        { length: Math.min(100, Math.max(1, Math.floor(entry.count || 1))) },
        () => entry.category,
      ),
    ).slice(0, 100);
    if (categories.length === 0) {
      setStatus("⚠️ 시작할 몬스터를 먼저 추가해 주세요.");
      return;
    }
    const hp = Math.min(99_999_999, Math.max(1, Math.floor(requestedHp || 1)));
    clearDebugCombat();
    clearInteraction();
    const created: Monster[] = categories.map((category, index) => ({
      id: nextMonster.current++,
      isBoss: false,
      category,
      hp,
      maxHp: hp,
      pathStep: 0,
      progress: -index * 0.35,
      speedTilesPerSecond: MONSTER_STATS[category].speed,
      laps: 0,
    }));
    monstersRef.current = created;
    setMonsters(created);
    setProjectiles([]);
    projectilesRef.current = [];
    tier3FirePillarsRef.current = [];
    setToSpawn(0);
    setWave(1);
    setGameResult("playing");
    setShowStageBossInfo(false);
    gameTimeMs.current = 0;
    const timeLimit = getWaveTimeLimit(1);
    waveTimeRemainingMs.current = timeLimit * 1000;
    setWaveTimeRemainingSec(timeLimit);
    waveDamageRef.current = {};
    const restedUnits = units.map((unit) => ({
      ...unit,
      cooldownMs: 0,
      targetId: null,
      lastAttackTimeMs: undefined,
      stunnedUntilMs: undefined,
      activeSkillCooldownMs: unit.tier >= 2
        ? ACTIVE_SKILL_INITIAL_COOLDOWN[unit.typeId] === undefined &&
          !(unit.tier >= 3 && TIER3_ACTIVE_SKILL_COOLDOWN[unit.typeId] !== undefined)
          ? undefined
          : 0
        : undefined,
      skillEffectUntilMs: undefined,
        tier3AreaKind: undefined,
        tier3RangerEffectUntilMs: undefined,
        tier3RangerEffectKind: undefined,
        tier3RangerEffectRow: undefined,
        tier3RangerEffectCol: undefined,
        tier3RangerEffectAngleDeg: undefined,
      swordsmanWaveUntilMs: undefined,
      adrenalinePhase: undefined,
      adrenalinePhaseUntilMs: undefined,
      frozenOrbCell: undefined,
      frozenOrbPathPosition: undefined,
      frozenOrbTrailCells: undefined,
      frozenOrbUntilMs: undefined,
      frozenOrbNextTickMs: undefined,
      frozenOrbExplosionCell: undefined,
      frozenOrbExplosionUntilMs: undefined,
      heavenlyJudgmentNextAtMs: undefined,
      swordsmanAttackCount: 0,
      shotgunAttackCount: 0,
    }));
    unitsRef.current = restedUnits;
    setUnits(restedUnits);
    waveUnitsRef.current = restedUnits.map((unit) => ({ ...unit }));
    ultimateNextRollAtRef.current = {
      warrior: ULTIMATE_FIRST_ROLL_MS,
      mage: ULTIMATE_FIRST_ROLL_MS,
      ranger: ULTIMATE_FIRST_ROLL_MS,
    };
    setPaused(false);
    pausedRef.current = false;
    setRunning(true);
    lastFrame.current = performance.now();
    setStatus(`🛠 디버그: 체력 ${hp.toLocaleString()}의 일반 몬스터 ${created.length}마리로 웨이브를 시작했습니다.`);
  };

  const handleDebugSetTimer = (seconds: number) => {
    const safeSeconds = Math.min(9999, Math.max(1, Math.floor(seconds || 1)));
    waveTimeRemainingMs.current = safeSeconds * 1000;
    setWaveTimeRemainingSec(safeSeconds);
    setStatus(`🛠 디버그: 제한시간을 ${safeSeconds}초로 설정했습니다.`);
  };

  const handleDebugClearMonsters = () => {
    clearDebugCombat();
    waveDamageRef.current = {};
    setStatus("🛠 디버그: 소환된 몬스터를 모두 초기화했습니다.");
  };

  const storageToMapUnit = (storageUnit: StorageUnit, cell: number): Unit => {
    const def = UNIT_TYPES[storageUnit.typeId];
    return {
      id: storageUnit.id,
      typeId: storageUnit.typeId,
      tier: storageUnit.tier,
      cell,
      rangeTiles: def.rangeTiles,
      damage: def.damage,
      attackIntervalMs: def.attackIntervalMs,
      cooldownMs: 0,
      targetId: null,
      protected: true,
    };
  };

  const mapToStorageUnit = (unit: Unit): StorageUnit => ({
    id: unit.id,
    typeId: unit.typeId,
    tier: unit.tier,
  });

  const recallMapUnit = (unitId: number) => {
    const unit = units.find((item) => item.id === unitId);
    const emptyIndex = storageSlots.findIndex((slot) => slot === null);
    if (!unit || emptyIndex < 0) {
      setStatus("⚠️ 창고가 가득 차서 회수할 수 없어!");
      return;
    }
    setUnits((current) => current.filter((item) => item.id !== unitId));
    setStorageSlots((slots) => slots.map((slot, index) =>
      index === emptyIndex ? mapToStorageUnit(unit) : slot));
    setStatus(`📥 [${UNIT_TYPES[unit.typeId].name}] 창고 회수 완료.`);
    clearInteraction();
  };

  const sellMapUnit = (unitId: number) => {
    const unit = units.find((item) => item.id === unitId);
    if (!unit) return;
    if (unit.protected) {
      setStatus(`🔒 [${UNIT_TYPES[unit.typeId].name}] 보호를 해제한 뒤 판매할 수 있어.`);
      return;
    }
    const price = UNIT_SELL_PRICES[unit.tier as 1 | 2 | 3];
    setUnits((current) => current.filter((item) => item.id !== unitId));
    setGold((current) => current + price);
    setStatus(`💰 [${UNIT_TYPES[unit.typeId].name}] 판매 완료! +${price}G`);
    addLog(`${UNIT_TYPES[unit.typeId].name}을(를) 팔아서 ${price}골드를 획득했습니다.`);
    clearInteraction();
  };

  const toggleMapUnitProtection = (unitId: number) => {
    const unit = units.find((item) => item.id === unitId);
    if (!unit) return;
    const nextProtected = !unit.protected;
    setUnits((current) => current.map((item) =>
      item.id === unitId ? { ...item, protected: nextProtected } : item));
    setStatus(`🔒 [${UNIT_TYPES[unit.typeId].name}] 보호를 ${nextProtected ? "설정" : "해제"}했습니다.`);
  };

  const handleSelectStorageSlot = (index: number) => {
    if (running) {
      const clicked = storageSlots[index];
      if (!clicked) return;
      const deselecting = selectedStorageIndex === index && selectedUnitId === null;
      setSelectedStorageIndex(deselecting ? null : index);
      setSelectedUnitId(null);
      setSelectedBossId(null);
      setShowStageBossInfo(false);
      setActiveStorageIndex(null);
      setActiveCellIndex(null);
      setMapPlacementTarget(null);
      setHighlightMapPlacement(false);
      setStatus(deselecting
        ? "선택을 해제했어."
        : `📦 [${UNIT_TYPES[clicked.typeId].name}] 상세정보 확인 중.`);
      return;
    }
    if (activeStorageIndex === index) {
      clearInteraction();
      setStatus("선택을 해제했어.");
      return;
    }
    const clicked = storageSlots[index];

    if (mapPlacementTarget !== null && clicked) {
      if (units.length >= unitDeployLimit) {
        setStatus(`⚠️ 현재 배치 한도는 ${unitDeployLimit}기야.`);
        return;
      }
      setUnits((current) => [...current, storageToMapUnit(clicked, mapPlacementTarget)]);
      setStorageSlots((slots) => slots.map((slot, slotIndex) => slotIndex === index ? null : slot));
      setStatus(`✅ [${UNIT_TYPES[clicked.typeId].name}] 배치 완료.`);
      clearInteraction();
      return;
    }

    const selectedMapUnit = units.find((unit) => unit.id === selectedUnitId);
    if (selectedMapUnit) {
      if (clicked) {
        const replacement = storageToMapUnit(clicked, selectedMapUnit.cell);
        setUnits((current) => current.map((unit) => unit.id === selectedMapUnit.id ? replacement : unit));
        setStorageSlots((slots) => slots.map((slot, slotIndex) =>
          slotIndex === index ? mapToStorageUnit(selectedMapUnit) : slot));
        setStatus("🔄 맵 유닛과 창고 유닛의 자리를 교환했어.");
      } else {
        setUnits((current) => current.filter((unit) => unit.id !== selectedMapUnit.id));
        setStorageSlots((slots) => slots.map((slot, slotIndex) =>
          slotIndex === index ? mapToStorageUnit(selectedMapUnit) : slot));
        setStatus("📥 유닛을 선택한 창고 칸으로 옮겼어.");
      }
      clearInteraction();
      return;
    }

    if (selectedStorageIndex !== null && selectedStorageIndex !== index) {
      setStorageSlots((slots) => {
        const next = [...slots];
        [next[selectedStorageIndex], next[index]] = [next[index], next[selectedStorageIndex]];
        return next;
      });
      setStatus("🔄 창고 유닛의 자리를 교환했어.");
      clearInteraction();
      return;
    }

    if (clicked) {
      setSelectedStorageIndex(index);
      setSelectedUnitId(null);
      setActiveStorageIndex(index);
      setActiveCellIndex(null);
      setHighlightMapPlacement(false);
      setStatus(`📦 [${UNIT_TYPES[clicked.typeId].name}] 선택됨.`);
    } else {
      clearInteraction();
    }
  };

  const installWall = (cellIndex: number) => {
    if (gold < PLAYER_WALL_COST || wallCount >= PLAYER_WALL_LIMIT) return;
    const next = grid.map((cell) => ({ ...cell }));
    next[cellIndex] = { type: "player", bornWave: wave, cost: PLAYER_WALL_COST };
    const nextPath = findShortestPath(next, start, goal);
    if (!nextPath) {
      setStatus("🚫 출발점과 도착점을 완전히 막을 수 없어.");
      return;
    }
    setGrid(next);
    setPath(nextPath);
    setGold((current) => current - PLAYER_WALL_COST);
    setStatus(`🧱 벽 설치 완료. -${PLAYER_WALL_COST}G`);
    clearInteraction();
  };

  const removeWall = (cellIndex: number) => {
    const cell = grid[cellIndex];
    if (units.some((unit) => unit.cell === cellIndex)) return;
    const next = grid.map((item) => ({ ...item }));
    next[cellIndex] = { type: "empty" };
    if (cell.type === "natural") {
      if (gold < NATURAL_DESTROY_COST) return;
      setGold((current) => current - NATURAL_DESTROY_COST);
      setStatus(`🔨 자연벽 제거 완료. -${NATURAL_DESTROY_COST}G`);
    } else if (cell.type === "player") {
      const refund = cell.bornWave === wave
        ? (cell.cost ?? PLAYER_WALL_COST)
        : Math.floor((cell.cost ?? PLAYER_WALL_COST) * PLAYER_WALL_REFUND_RATE);
      setGold((current) => current + refund);
      setStatus(`🔨 벽 제거 완료. +${refund}G`);
    }
    setGrid(next);
    recalc(next);
    clearInteraction();
  };

  function onCellClick(cellIndex: number) {
    if (debugMode && debugBrush) {
      handleDebugCellClick(cellIndex);
      return;
    }
    if (running) {
      const clickedUnit = units.find((unit) => unit.cell === cellIndex);
      if (!clickedUnit) return;
      const deselecting = selectedUnitId === clickedUnit.id && selectedStorageIndex === null;
      setSelectedUnitId(deselecting ? null : clickedUnit.id);
      setSelectedStorageIndex(null);
      setSelectedBossId(null);
      setShowStageBossInfo(false);
      setActiveCellIndex(null);
      setActiveStorageIndex(null);
      setMapPlacementTarget(null);
      setHighlightMapPlacement(false);
      setStatus(deselecting
        ? "선택을 해제했어."
        : `⚔️ [${UNIT_TYPES[clickedUnit.typeId].name}] 상세정보 확인 중.`);
      return;
    }
    if (activeCellIndex === cellIndex) {
      clearInteraction();
      setStatus("선택을 해제했어.");
      return;
    }
    const cell = grid[cellIndex];
    if (cellIndex === start || cellIndex === goal || cell.type === "permanent") {
      clearInteraction();
      return;
    }

    const clickedUnit = units.find((unit) => unit.cell === cellIndex);
    const validUnitCell = cell.type === "player" || cell.type === "natural";
    const selectedStorage = selectedStorageIndex === null
      ? null
      : storageSlots[selectedStorageIndex];

    if (selectedStorage && validUnitCell) {
      if (clickedUnit) {
        const replacementUnit = storageToMapUnit(selectedStorage, cellIndex);
        setUnits((current) => current.map((unit) =>
          unit.id === clickedUnit.id ? replacementUnit : unit));
        setStorageSlots((slots) => slots.map((slot, index) =>
          index === selectedStorageIndex ? mapToStorageUnit(clickedUnit) : slot));
        setStatus("🔄 맵 유닛과 창고 유닛의 자리를 교환했어.");
      } else {
        if (units.length >= unitDeployLimit) {
          setStatus(`⚠️ 현재 배치 한도는 ${unitDeployLimit}기야.`);
          return;
        }
        setUnits((current) => [
          ...current,
          storageToMapUnit(selectedStorage, cellIndex),
        ]);
        setStorageSlots((slots) => slots.map((slot, index) =>
          index === selectedStorageIndex ? null : slot));
        setStatus(`✅ [${UNIT_TYPES[selectedStorage.typeId].name}] 배치 완료.`);
      }
      clearInteraction();
      return;
    }

    const selectedMapUnit = units.find((unit) => unit.id === selectedUnitId);
    if (selectedMapUnit && selectedMapUnit.cell !== cellIndex && validUnitCell) {
      if (clickedUnit) {
        setUnits((current) => current.map((unit) =>
          unit.id === selectedMapUnit.id
            ? { ...unit, cell: cellIndex }
            : unit.id === clickedUnit.id
              ? { ...unit, cell: selectedMapUnit.cell }
              : unit));
        setStatus("🔄 두 유닛의 위치를 교환했어.");
      } else {
        setUnits((current) => current.map((unit) =>
          unit.id === selectedMapUnit.id ? { ...unit, cell: cellIndex } : unit));
        setStatus("✅ 유닛 위치를 옮겼어.");
      }
      clearInteraction();
      return;
    }

    setMapPlacementTarget(null);
    setHighlightMapPlacement(false);
    setActiveStorageIndex(null);
    setSelectedStorageIndex(null);
    setActiveCellIndex(cellIndex);
    if (clickedUnit) {
      setSelectedUnitId(clickedUnit.id);
      setStatus(`⚔️ [${UNIT_TYPES[clickedUnit.typeId].name}] 선택됨. 메뉴를 누르거나 다른 유닛과 자리를 바꿀 수 있어.`);
    } else {
      setSelectedUnitId(null);
    }
  }

  function startWave() {
    if (running || gameResult !== "playing") return;
    setPaused(false);
    pausedRef.current = false;
    setGrid((g) =>
      g.map((c) =>
        c.type === "player" && c.bornWave === wave
          ? { ...c, bornWave: wave - 1 }
          : c,
      ),
    );
    clearInteraction();
    setMonsters([]);
    setProjectiles([]);
    const restedUnits = units.map((unit) => ({
      ...unit,
      cooldownMs: 0,
      targetId: null,
      lastAttackTimeMs: undefined,
      stunnedUntilMs: undefined,
      activeSkillCooldownMs: unit.tier >= 2
        ? ACTIVE_SKILL_INITIAL_COOLDOWN[unit.typeId] === undefined &&
          !(unit.tier >= 3 && TIER3_ACTIVE_SKILL_COOLDOWN[unit.typeId] !== undefined)
          ? undefined
          : 0
        : undefined,
      skillEffectUntilMs: undefined,
      adrenalinePhase: undefined,
      adrenalinePhaseUntilMs: undefined,
      frozenOrbCell: undefined,
      frozenOrbPathPosition: undefined,
      frozenOrbTrailCells: undefined,
      frozenOrbUntilMs: undefined,
      frozenOrbNextTickMs: undefined,
      frozenOrbExplosionCell: undefined,
      frozenOrbExplosionUntilMs: undefined,
      heavenlyJudgmentNextAtMs: undefined,
      swordsmanAttackCount: 0,
      shotgunAttackCount: 0,
    }));
    unitsRef.current = restedUnits;
    setUnits(restedUnits);
    waveDamageRef.current = {};
    waveUnitsRef.current = restedUnits.map((unit) => ({ ...unit }));
    monstersRef.current = [];
    projectilesRef.current = [];
    tier3FirePillarsRef.current = [];
    pendingHeavenlyStrikesRef.current = [];
    setToSpawn(isBossWave(wave) ? 1 : getWaveMonsterCount(wave));
    gameTimeMs.current = 0;
    boardShakeUntilMs.current = 0;
    ultimateActiveRef.current = false;
    ultimateQueueRef.current = [];
    pendingUltimateHitsRef.current = [];
    setUltimateSequence(null);
    ultimateNextRollAtRef.current = {
      warrior: ULTIMATE_FIRST_ROLL_MS,
      mage: ULTIMATE_FIRST_ROLL_MS,
      ranger: ULTIMATE_FIRST_ROLL_MS,
    };
    waveTimeRemainingMs.current = waveTimeLimit * 1000;
    lastSpawnGameMs.current = 0;
    setWaveTimeRemainingSec(waveTimeLimit);
    setRunning(true);
    lastFrame.current = performance.now();
    setStatus(
      isFinalStage(wave)
        ? `👑 FINAL STAGE 시작! ${waveTimeLimit}초 안에 최종 보스를 처치해!`
        : isBossWave(wave)
          ? `👹 보스 웨이브 ${wave} 시작! ${waveTimeLimit}초 안에 보스를 처치해!`
          : `🌊 웨이브 ${wave} 시작! (제한시간 ${waveTimeLimit}초)`,
    );
    addLog(`${wave}스테이지가 시작되었습니다.`);
  }

  function resumeWave() {
    if (!running || !paused || document.visibilityState === "hidden") return;
    const now = performance.now();
    lastFrame.current = now;
    pausedRef.current = false;
    setPaused(false);
  }

  function togglePause() {
    if (!running) return;
    if (paused) {
      resumeWave();
      return;
    }
    pausedRef.current = true;
    setPaused(true);
  }

  const monstersRef = useRef<Monster[]>([]);
  const unitsRef = useRef<Unit[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const tier3FirePillarsRef = useRef<Tier3FirePillar[]>([]);
  const [tier3FirePillars, setTier3FirePillars] = useState<Tier3FirePillar[]>([]);
  const nextTier3AreaId = useRef(1);
  const pendingHeavenlyStrikesRef = useRef<PendingHeavenlyStrike[]>([]);
  const nextHeavenlyStrikeId = useRef(1);

  useEffect(() => {
    unitsRef.current = units;
  }, [units]);

  useEffect(() => {
    if (running) return;
    pausedRef.current = false;
    setPaused(false);
  }, [running]);

  useEffect(() => {
    if (!running) return;

    const pauseWave = () => {
      pausedRef.current = true;
      setPaused(true);
    };
    const pauseIfHidden = () => {
      if (document.visibilityState === "hidden") pauseWave();
    };

    document.addEventListener("visibilitychange", pauseIfHidden);
    window.addEventListener("blur", pauseWave);
    pauseIfHidden();
    return () => {
      document.removeEventListener("visibilitychange", pauseIfHidden);
      window.removeEventListener("blur", pauseWave);
    };
  }, [running]);

  // 통합 단일 RAF 게임 루프
  useEffect(() => {
    if (!running || paused) return;
    let raf = 0;

    const frame = (now: number) => {
      if (pausedRef.current) return;
      if (ultimateActiveRef.current) {
        lastFrame.current = now;
        raf = requestAnimationFrame(frame);
        return;
      }
      const realDt = Math.min(40, Math.max(0, now - lastFrame.current));
      lastFrame.current = now;
      if (waveTimeRemainingMs.current <= 0) return;
      const finalBossTransitionActive = isFinalStage(wave) && monstersRef.current.some(
        (monster) => monster.isFinalBoss && monster.hp > 0 && monster.finalBossMode !== "combat",
      );
      const dt = finalBossTransitionActive
        ? realDt * gameSpeed
        : Math.min(realDt * gameSpeed, waveTimeRemainingMs.current);
      gameTimeMs.current += dt;
      if (!finalBossTransitionActive) waveTimeRemainingMs.current -= dt;
      const gameNow = gameTimeMs.current;

      setWaveTimeRemainingSec(Math.ceil(waveTimeRemainingMs.current / 1000));

      // 직업별 3성 유닛 3종이 모두 배치되면 보이지 않는 독립 판정을 수행한다.
      (["warrior", "mage", "ranger"] as UnitClass[]).forEach((unitClass) => {
        if (gameNow < ultimateNextRollAtRef.current[unitClass]) return;
        const requiredTypes = ULTIMATE_UNIT_TYPES[unitClass];
        const trio = requiredTypes.map((typeId) =>
          unitsRef.current.find((unit) => unit.typeId === typeId && unit.tier === 3),
        );
        if (trio.some((unit) => !unit)) return;

        if (Math.random() < ULTIMATE_TRIGGER_CHANCE) {
          const contributions = trio.map((unit) => {
            const deployedUnit = unit!;
            const definition = UNIT_TYPES[deployedUnit.typeId];
            const upgradeLevels = getUpgradeLevels(upgrades, deployedUnit.typeId);
            return {
              unitId: deployedUnit.id,
              typeId: deployedUnit.typeId,
              damage: Math.max(1, Math.round(
                definition.damage * (
                  getUnitTierDamageMultiplier(deployedUnit.tier, definition.unitClass) +
                  getUnitUpgradeDamageMultiplier(deployedUnit.typeId, upgradeLevels)
                ) * ULTIMATE_DAMAGE_MULTIPLIER[unitClass],
              )),
            };
          });
          enqueueUltimate({ unitClass, unitTypeIds: requiredTypes, contributions });
          ultimateNextRollAtRef.current[unitClass] = gameNow + ULTIMATE_SUCCESS_COOLDOWN_MS;
        } else {
          ultimateNextRollAtRef.current[unitClass] = gameNow + ULTIMATE_FAIL_COOLDOWN_MS;
        }
      });

      // 1. 일반 웨이브는 유형별 비율대로, 5의 배수 웨이브는 보스 1마리 스폰
      if (toSpawn > 0 && gameNow - lastSpawnGameMs.current >= MONSTER_SPAWN_MS) {
        lastSpawnGameMs.current = gameNow;
        setToSpawn((n) => n - 1);

        const isBoss = isBossWave(wave);
        const category = isBoss
          ? getBossCategory(wave)
          : getWaveMonsterCategory(wave, getWaveMonsterCount(wave) - toSpawn);
        const rawHp = isBoss ? getBossHp(wave) : getMonsterHp(category, wave);
        const isFinalBoss = isFinalStage(wave);
        const hp = isFinalBoss ? Math.max(1, Math.round(rawHp / 4)) : rawHp;
        const lateWaveSpeedMultiplier = wave === 31 ? 1.08 : wave === 32 ? 1.15 : 1;

        monstersRef.current.push({
          id: nextMonster.current++,
          isBoss,
          bossStage: isBoss ? wave : undefined,
          isFinalBoss,
          finalBossPhase: isFinalBoss ? 4 : undefined,
          finalBossTargetPhase: isFinalBoss ? 1 : undefined,
          finalBossMode: isFinalBoss ? "intro" : undefined,
          finalBossTransitionEndsAtMs: isFinalBoss ? gameNow + 1000 : undefined,
          category,
          hp,
          maxHp: hp,
          pathStep: 0,
          progress: 0,
          speedTilesPerSecond: MONSTER_STATS[category].speed * lateWaveSpeedMultiplier * (
            wave === 25 ? STAGE25_SPEED_RATIO : 1
          ),
          laps: 0,
          stage05NextSummonAtMs: wave === 5
            ? gameNow + STAGE05_FIRST_SUMMON_DELAY_MS
            : undefined,
          stage10NextStompAtMs: wave === 10
            ? gameNow + STAGE10_FIRST_STOMP_DELAY_MS
            : undefined,
          stage15State: wave === 15 ? "phoenix" : undefined,
          stage15ReviveCount: wave === 15 ? 0 : undefined,
          stage20State: wave === 20 ? "waiting" : undefined,
          stage20NextShieldAtMs: wave === 20
            ? gameNow + STAGE20_FIRST_SHIELD_DELAY_MS
            : undefined,
          stage25NextReforgeAtMs: wave === 25
            ? gameNow + STAGE25_FIRST_REFORGE_DELAY_MS
            : undefined,
          stage30StoneCount: wave === 30 ? STAGE30_STONE_COUNT : undefined,
          stage30StoneMaxHp: wave === 30 ? Math.max(1, Math.round(hp * STAGE30_STONE_HP_RATIO)) : undefined,
          stage30StoneHp: wave === 30 ? Math.max(1, Math.round(hp * STAGE30_STONE_HP_RATIO)) : undefined,
          stage30NextTeleportAtMs: wave === 30
            ? gameNow + STAGE30_FIRST_TELEPORT_DELAY_MS
            : undefined,
        });
      }

      // 5스테이지 보스: 주기적으로 스켈레톤을 소환하고 전멸 전까지 무적.
      // 제한시간 안에 남은 소환수는 보스가 HP를 흡수한 뒤 제거한다.
      const stage05Bosses = monstersRef.current.filter(
        (monster) => monster.hp > 0 && monster.isBoss && monster.bossStage === 5,
      );
      for (const boss of stage05Bosses) {
        const summons = monstersRef.current.filter(
          (monster) => monster.hp > 0 && monster.summonedByBossId === boss.id,
        );

        if (
          boss.stage05SummoningUntilMs !== undefined &&
          gameNow >= boss.stage05SummoningUntilMs
        ) {
          const skeletonHp = Math.max(
            1,
            Math.round(getMonsterHp("human", 5) * STAGE05_SKELETON_HP_RATIO),
          );
          const bossRoute = boss.route ?? path;
          const bossPathDistance = boss.pathStep + boss.progress;
          const skeletons: Monster[] = Array.from(
            { length: STAGE05_SUMMON_COUNT },
            (_, index) => {
              const spawnDistance = Math.max(0, bossPathDistance - (index + 1) * 0.45);
              const spawnPathStep = Math.min(
                bossRoute.length - 2,
                Math.floor(spawnDistance),
              );
              return {
                id: nextMonster.current++,
                isBoss: false,
                category: "human",
                hp: skeletonHp,
                maxHp: skeletonHp,
                pathStep: spawnPathStep,
                progress: spawnDistance - spawnPathStep,
                speedTilesPerSecond:
                  MONSTER_STATS.human.speed * STAGE05_SKELETON_SPEED_RATIO,
                laps: 0,
                summonedByBossId: boss.id,
                noKillGold: true,
                route: boss.route ? [...boss.route] : undefined,
              };
            },
          );
          monstersRef.current.push(...skeletons);
          boss.stage05SummoningUntilMs = undefined;
          boss.stage05ShieldActive = true;
          boss.stage05AbsorbAtMs = gameNow + STAGE05_SUMMON_CYCLE_MS;
          setStatus("☠️ 리치가 스켈레톤 5마리를 소환하고 보호막을 펼쳤습니다!");
          addLog("리치가 스켈레톤 5마리를 소환했습니다. 15초 안에 처치해야 합니다.");
        } else if (boss.stage05ShieldActive) {
          if (
            boss.stage05AbsorbingUntilMs !== undefined &&
            gameNow >= boss.stage05AbsorbingUntilMs
          ) {
            const healedHp = Math.min(
              boss.stage05PendingHeal ?? 0,
              boss.maxHp - boss.hp,
            );
            boss.hp += healedHp;
            const summonIds = new Set(summons.map((skeleton) => skeleton.id));
            monstersRef.current = monstersRef.current.filter(
              (monster) => !summonIds.has(monster.id),
            );
            projectilesRef.current = projectilesRef.current.filter(
              (projectile) => !summonIds.has(projectile.targetId),
            );
            boss.stage05ShieldActive = false;
            boss.stage05AbsorbAtMs = undefined;
            boss.stage05AbsorbingUntilMs = undefined;
            boss.stage05PendingHeal = undefined;
            boss.stage05NextSummonAtMs = gameNow + STAGE05_SUMMON_CYCLE_MS;
            setStatus(`🩸 리치가 스켈레톤의 체력을 흡수해 ${healedHp} HP를 회복했습니다!`);
            addLog(`리치가 남은 스켈레톤 ${summons.length}마리를 흡수해 ${healedHp} HP를 회복했습니다.`);
          } else if (boss.stage05AbsorbingUntilMs !== undefined) {
            // 흡수 연출이 끝날 때까지 보스와 소환수를 유지한다.
          } else if (summons.length === 0) {
            boss.stage05ShieldActive = false;
            boss.stage05AbsorbAtMs = undefined;
            boss.stage05NextSummonAtMs = gameNow + STAGE05_SUMMON_CYCLE_MS;
            setStatus("💀 스켈레톤을 모두 처치해 보스의 보호막이 해제되었습니다!");
            addLog("스켈레톤을 모두 처치해 리치의 보호막이 해제되었습니다.");
          } else if (
            boss.stage05AbsorbAtMs !== undefined &&
            gameNow >= boss.stage05AbsorbAtMs
          ) {
            const absorbedHp = summons.reduce((total, skeleton) => total + skeleton.hp, 0);
            boss.stage05AbsorbingUntilMs = gameNow + STAGE05_ABSORB_CAST_MS;
            boss.stage05PendingHeal = absorbedHp;
            summons.forEach((skeleton) => {
              skeleton.stage05BeingAbsorbed = true;
            });
            setStatus("🟣 리치가 남은 스켈레톤의 생명력을 흡수합니다!");
            addLog("리치가 남은 스켈레톤의 생명력 흡수를 시작했습니다.");
          }
        } else if (
          boss.stage05SummoningUntilMs === undefined &&
          boss.stage05NextSummonAtMs !== undefined &&
          gameNow >= boss.stage05NextSummonAtMs
        ) {
          boss.stage05NextSummonAtMs = undefined;
          boss.stage05SummoningUntilMs = gameNow + STAGE05_SUMMON_CAST_MS;
          setStatus("🔮 리치가 이동을 멈추고 스켈레톤 소환을 시작합니다!");
        }
      }

      // 10스테이지 보스: 3칸 범위를 예고한 뒤 지면을 강타해 유닛을 기절시킨다.
      const stage10Bosses = monstersRef.current.filter(
        (monster) => monster.hp > 0 && monster.isBoss && monster.bossStage === 10,
      );
      for (const boss of stage10Bosses) {
        if (
          boss.stage10StompImpactAtMs !== undefined &&
          gameNow >= boss.stage10StompImpactAtMs
        ) {
          const bossRoute = boss.route ?? path;
          const bossPathCell =
            bossRoute[Math.min(boss.pathStep, bossRoute.length - 1)] ?? start;
          const nextBossPathCell =
            bossRoute[Math.min(boss.pathStep + 1, bossRoute.length - 1)] ?? bossPathCell;
          const [bossFromRow, bossFromCol] = toRC(bossPathCell);
          const [bossToRow, bossToCol] = toRC(nextBossPathCell);
          const bossRow = bossFromRow + (bossToRow - bossFromRow) * boss.progress;
          const bossCol = bossFromCol + (bossToCol - bossFromCol) * boss.progress;
          let stunnedCount = 0;

          for (const unit of unitsRef.current) {
            const [unitRow, unitCol] = toRC(unit.cell);
            if (
              Math.hypot(unitRow - bossRow, unitCol - bossCol) <=
              STAGE10_STOMP_RADIUS_TILES
            ) {
              unit.stunnedUntilMs = gameNow + STAGE10_STOMP_STUN_MS;
              stunnedCount += 1;
            }
          }

          boss.stage10StompImpactAtMs = undefined;
          boss.stage10NextStompAtMs = gameNow + STAGE10_STOMP_COOLDOWN_MS;
          boardShakeUntilMs.current = gameNow + 450;
          setUnits([...unitsRef.current]);
          setStatus(`💥 대지 강타! 범위 안의 유닛 ${stunnedCount}기가 3초간 기절했습니다.`);
          addLog(`10스테이지 보스가 대지 강타로 유닛 ${stunnedCount}기를 기절시켰습니다.`);
        } else if (
          boss.stage10StompImpactAtMs === undefined &&
          boss.stage10NextStompAtMs !== undefined &&
          gameNow >= boss.stage10NextStompAtMs
        ) {
          boss.stage10NextStompAtMs = undefined;
          boss.stage10StompImpactAtMs = gameNow + STAGE10_STOMP_WARNING_MS;
          setStatus("⚠️ 육지형 보스가 대지 강타를 준비합니다!");
        }
      }

      // 15스테이지 보스: 사망하면 알로 변해 15초 동안 부활을 준비한다.
      // 알을 파괴하지 못하면 최대 체력의 50%로 되살아나며 이 과정은 반복된다.
      const stage15Bosses = monstersRef.current.filter(
        (monster) => monster.hp > 0 && monster.isBoss && monster.bossStage === 15,
      );
      for (const boss of stage15Bosses) {
        if (
          boss.stage15State === "transforming" &&
          boss.stage15PhaseEndsAtMs !== undefined &&
          gameNow >= boss.stage15PhaseEndsAtMs
        ) {
          boss.stage15State = "egg";
          boss.stage15PhaseEndsAtMs = undefined;
          boss.stage15ReviveAtMs = gameNow + STAGE15_EGG_HATCH_DELAY_MS;
          setStatus("🥚 불사조의 알이 부활을 준비합니다. 15초 안에 파괴하세요!");
          addLog("영겁의 불사조가 알로 변했습니다. 부활 전에 파괴해야 합니다.");
        } else if (
          boss.stage15State === "egg" &&
          boss.stage15ReviveAtMs !== undefined &&
          gameNow >= boss.stage15ReviveAtMs
        ) {
          boss.stage15State = "hatching";
          boss.stage15ReviveAtMs = undefined;
          boss.stage15PhaseEndsAtMs = gameNow + STAGE15_HATCH_MS;
          setStatus("🔥 알이 갈라지며 불사조가 다시 태어납니다!");
        } else if (
          boss.stage15State === "hatching" &&
          boss.stage15PhaseEndsAtMs !== undefined &&
          gameNow >= boss.stage15PhaseEndsAtMs
        ) {
          boss.stage15State = "phoenix";
          boss.stage15ReviveCount = (boss.stage15ReviveCount ?? 0) + 1;
          boss.stage15PhaseEndsAtMs = undefined;
          boss.hp = Math.max(1, Math.round(boss.maxHp * STAGE15_REVIVE_HP_RATIO));
          boss.slowUntilMs = undefined;
          boss.paralyzeUntilMs = undefined;
          boss.statusImmunityUntilMs = gameNow + 1000;
          setStatus("🪽 영겁의 불사조가 최대 체력의 50%로 부활했습니다!");
          addLog("영겁의 불사조가 불길 속에서 부활했습니다.");
        }
      }

      // 20스테이지 보스: 보호막을 주기적으로 충전한다. 제한 시간 안에
      // 파괴하면 보스가 기절하고, 기절 중에는 두 배의 피해를 받는다.
      const stage20Bosses = monstersRef.current.filter(
        (monster) => monster.hp > 0 && monster.isBoss && monster.bossStage === 20,
      );
      for (const boss of stage20Bosses) {
        if (
          boss.stage20State === "charging" &&
          boss.stage20CastEndsAtMs !== undefined &&
          gameNow >= boss.stage20CastEndsAtMs
        ) {
          const currentShieldHp = boss.stage20ShieldHp ?? 0;
          const isPartialRecharge = currentShieldHp > 0 && boss.stage20ShieldMaxHp !== undefined;
          const shieldMaxHp = isPartialRecharge
            ? boss.stage20ShieldMaxHp!
            : Math.max(1, Math.round(boss.hp * STAGE20_SHIELD_RATIO));
          const nextShieldSegment = Math.min(
            STAGE20_SHIELD_SEGMENTS,
            Math.floor((currentShieldHp * STAGE20_SHIELD_SEGMENTS) / shieldMaxHp) + 1,
          );
          const rechargedShieldHp = isPartialRecharge
            ? Math.round((shieldMaxHp * nextShieldSegment) / STAGE20_SHIELD_SEGMENTS)
            : shieldMaxHp;
          boss.stage20State = "shielded";
          boss.stage20CastEndsAtMs = undefined;
          boss.stage20ShieldMaxHp = shieldMaxHp;
          boss.stage20ShieldHp = Math.round(rechargedShieldHp);
          boss.stage20NextShieldAtMs = gameNow + STAGE20_SHIELD_REFRESH_MS;
          setStatus(isPartialRecharge
            ? "🛡️ 성채기사가 보호막을 다음 구간까지 회복했습니다!"
            : "🛡️ 성채기사가 현재 체력의 70%에 해당하는 보호막을 펼쳤습니다!");
          addLog(isPartialRecharge
            ? "20스테이지 보스가 보호막 한 구간을 재충전했습니다."
            : "20스테이지 보스가 보라색 성채 보호막을 전개했습니다.");
        } else if (
          boss.stage20State === "stunned" &&
          boss.stage20StunnedUntilMs !== undefined &&
          gameNow >= boss.stage20StunnedUntilMs
        ) {
          boss.stage20State = "waiting";
          boss.stage20StunnedUntilMs = undefined;
          setStatus("⚔️ 성채기사가 기절에서 회복했습니다.");
        } else if (
          boss.stage20State !== "charging" &&
          boss.stage20State !== "stunned" &&
          boss.stage20NextShieldAtMs !== undefined &&
          gameNow >= boss.stage20NextShieldAtMs
        ) {
          boss.stage20State = "charging";
          boss.stage20CastEndsAtMs = gameNow + STAGE20_SHIELD_CAST_MS;
          boss.stage20NextShieldAtMs = undefined;
          setStatus("🔮 성채기사가 이동을 멈추고 보호막을 충전합니다!");
        }
      }

      // 25스테이지 보스: 현재 길을 포함한 지형 5칸을 예고한 뒤 뒤집는다.
      // 빈 칸은 자연벽이 되고 모든 종류의 벽은 제거된다. 새 벽은 전체 경로가
      // 유지되는 경우에만 확정하며, 이동 중인 몬스터의 현재 구간은 보존한다.
      const stage25Bosses = monstersRef.current.filter(
        (monster) => monster.hp > 0 && monster.isBoss && monster.bossStage === 25,
      );
      for (const boss of stage25Bosses) {
        if (
          boss.stage25CastEndsAtMs !== undefined &&
          gameNow >= boss.stage25CastEndsAtMs
        ) {
          const nextGrid = gridRef.current.map((cell) => ({ ...cell }));
          const targets = boss.stage25TargetCells ?? [];
          const returnedUnitIds = new Set<number>();
          const nextStorage = [...storageSlotsRef.current];
          let createdWalls = 0;
          let destroyedWalls = 0;

          for (const cellIndex of targets) {
            if (cellIndex === start || cellIndex === goal) continue;
            const cell = nextGrid[cellIndex];
            if (!cell) continue;

            if (cell.type === "empty") {
              const previous = nextGrid[cellIndex];
              nextGrid[cellIndex] = { type: "natural" };
              if (findShortestPath(nextGrid, start, goal)) {
                createdWalls += 1;
              } else {
                nextGrid[cellIndex] = previous;
              }
            } else {
              const unit = unitsRef.current.find((candidate) => candidate.cell === cellIndex);
              if (unit) {
                const emptySlot = nextStorage.findIndex((slot) => slot === null);
                if (emptySlot < 0) continue;
                nextStorage[emptySlot] = mapToStorageUnit(unit);
                returnedUnitIds.add(unit.id);
              }
              nextGrid[cellIndex] = { type: "empty" };
              destroyedWalls += 1;
            }
          }

          if (returnedUnitIds.size > 0) {
            unitsRef.current = unitsRef.current.filter((unit) => !returnedUnitIds.has(unit.id));
            storageSlotsRef.current = nextStorage;
            setUnits([...unitsRef.current]);
            setStorageSlots(nextStorage);
          }

          const oldGlobalPath = pathRef.current;
          const nextGlobalPath = findShortestPath(nextGrid, start, goal);
          if (nextGlobalPath) {
            for (const monster of monstersRef.current) {
              const oldRoute = monster.route ?? oldGlobalPath;
              const from = oldRoute[Math.min(monster.pathStep, oldRoute.length - 1)] ?? start;
              const to = oldRoute[Math.min(monster.pathStep + 1, oldRoute.length - 1)] ?? from;
              const tail = findShortestPath(nextGrid, to, goal);
              if (tail) {
                monster.route = from === to ? tail : [from, ...tail];
                monster.pathStep = 0;
              }
            }
            gridRef.current = nextGrid;
            pathRef.current = nextGlobalPath;
            setGrid(nextGrid);
            setPath(nextGlobalPath);
          }

          boss.stage25CastEndsAtMs = undefined;
          boss.stage25TargetCells = undefined;
          boss.stage25NextReforgeAtMs = gameNow + STAGE25_REFORGE_COOLDOWN_MS;
          const returnText = returnedUnitIds.size > 0
            ? ` 유닛 ${returnedUnitIds.size}기는 창고로 회수되었습니다.`
            : "";
          setStatus(`🌿 모르가론이 자연벽 ${createdWalls}개를 생성하고 벽 ${destroyedWalls}개를 파괴했습니다.${returnText}`);
          addLog(`산맥거북 모르가론이 대지를 재편했습니다. 자연벽 ${createdWalls}개 생성, 벽 ${destroyedWalls}개 파괴.${returnText}`);
        } else if (
          boss.stage25CastEndsAtMs === undefined &&
          boss.stage25NextReforgeAtMs !== undefined &&
          gameNow >= boss.stage25NextReforgeAtMs
        ) {
          const protectedCells = new Set<number>();
          for (const monster of monstersRef.current) {
            const monsterRoute = monster.route ?? pathRef.current;
            protectedCells.add(monsterRoute[Math.min(monster.pathStep, monsterRoute.length - 1)] ?? start);
            protectedCells.add(monsterRoute[Math.min(monster.pathStep + 1, monsterRoute.length - 1)] ?? start);
          }

          const freeStorageCount = storageSlotsRef.current.filter((slot) => slot === null).length;
          let reservedStorageCount = 0;
          const tentativeGrid = gridRef.current.map((cell) => ({ ...cell }));
          const candidates = Array.from({ length: CELL_COUNT }, (_, index) => index)
            .filter((index) => index !== start && index !== goal)
            .sort(() => Math.random() - 0.5);
          const targets: number[] = [];

          for (const cellIndex of candidates) {
            if (targets.length >= STAGE25_REFORGE_TARGET_COUNT) break;
            const cell = tentativeGrid[cellIndex];
            if (!cell) continue;

            if (cell.type === "empty") {
              if (protectedCells.has(cellIndex)) continue;
              tentativeGrid[cellIndex] = { type: "natural" };
              if (findShortestPath(tentativeGrid, start, goal)) {
                targets.push(cellIndex);
              } else {
                tentativeGrid[cellIndex] = { type: "empty" };
              }
            } else {
              const hasUnit = unitsRef.current.some((unit) => unit.cell === cellIndex);
              if (hasUnit && reservedStorageCount >= freeStorageCount) continue;
              if (hasUnit) reservedStorageCount += 1;
              tentativeGrid[cellIndex] = { type: "empty" };
              targets.push(cellIndex);
            }
          }

          if (targets.length > 0) {
            boss.stage25TargetCells = targets;
            boss.stage25CastEndsAtMs = gameNow + STAGE25_REFORGE_CAST_MS;
            boss.stage25NextReforgeAtMs = undefined;
            setStatus(`⚠️ 모르가론이 대지의 기운을 모읍니다. 붉게 빛나는 ${targets.length}칸이 곧 바뀝니다!`);
            addLog(`산맥거북 모르가론이 대지 재편을 준비합니다. 대상 ${targets.length}칸.`);
          } else {
            boss.stage25NextReforgeAtMs = gameNow + STAGE25_REFORGE_COOLDOWN_MS;
          }
        }
      }

      // 30스테이지 보스: 부유석이 방어력을 제공하며, 남은 부유석을 이용해
      // 경로의 무작위 지점으로 도약한 뒤 주변 유닛을 기절시킨다.
      const stage30Bosses = monstersRef.current.filter(
        (monster) => monster.hp > 0 && monster.isBoss && monster.bossStage === 30,
      );
      for (const boss of stage30Bosses) {
        if (
          boss.stage30MagneticFieldUntilMs !== undefined &&
          gameNow >= boss.stage30MagneticFieldUntilMs
        ) {
          boss.stage30MagneticFieldUntilMs = undefined;
          boss.stage30MagneticFieldCell = undefined;
        }
        if (boss.stage30WeakUntilMs !== undefined && gameNow >= boss.stage30WeakUntilMs) {
          boss.stage30WeakUntilMs = undefined;
          boss.stage30StoneCount = STAGE30_STONE_COUNT;
          boss.stage30StoneHp = boss.stage30StoneMaxHp;
          boss.stage30NextTeleportAtMs = gameNow + STAGE30_FIRST_TELEPORT_DELAY_MS;
          setStatus("💠 아스트라온의 궤도 부유석이 재생성되었습니다!");
          addLog("천공요새 아스트라온이 궤도 방위체계를 복구했습니다.");
        }

        if (
          boss.stage30TeleportEndsAtMs !== undefined &&
          gameNow >= boss.stage30TeleportEndsAtMs
        ) {
          const bossRoute = boss.route ?? path;
          const targetStep = Math.min(
            bossRoute.length - 2,
            Math.max(1, boss.stage30TeleportTargetStep ?? 1),
          );
          boss.pathStep = targetStep;
          boss.progress = 0;
          boss.stage30TeleportEndsAtMs = undefined;
          boss.stage30TeleportTargetStep = undefined;
          boss.stage30MagneticFieldUntilMs = gameNow + STAGE30_MAGNETIC_FIELD_MS;
          boss.stage30NextTeleportAtMs = gameNow + STAGE30_TELEPORT_COOLDOWN_MS;
          const targetCell = bossRoute[targetStep] ?? start;
          boss.stage30MagneticFieldCell = targetCell;
          const [targetRow, targetCol] = toRC(targetCell);
          let stunnedCount = 0;
          for (const unit of unitsRef.current) {
            const [unitRow, unitCol] = toRC(unit.cell);
            if (Math.hypot(unitRow - targetRow, unitCol - targetCol) <= STAGE30_MAGNETIC_RADIUS_TILES) {
              unit.stunnedUntilMs = Math.max(
                unit.stunnedUntilMs ?? 0,
                gameNow + STAGE30_MAGNETIC_STUN_MS,
              );
              stunnedCount += 1;
            }
          }
          setUnits([...unitsRef.current]);
          setStatus(`🧲 자력 도약! 자기장에 닿은 유닛 ${stunnedCount}기가 3초간 기절했습니다.`);
          addLog(`아스트라온이 무작위 경로로 순간이동해 유닛 ${stunnedCount}기를 기절시켰습니다.`);
        } else if (
          (boss.stage30StoneCount ?? 0) > 0 &&
          boss.stage30WeakUntilMs === undefined &&
          boss.stage30TeleportEndsAtMs === undefined &&
          boss.stage30NextTeleportAtMs !== undefined &&
          gameNow >= boss.stage30NextTeleportAtMs
        ) {
          const bossRoute = boss.route ?? path;
          if (bossRoute.length > 2) {
            boss.stage30TeleportTargetStep = 1 + Math.floor(Math.random() * (bossRoute.length - 2));
            boss.stage30TeleportEndsAtMs = gameNow + STAGE30_TELEPORT_CAST_MS;
            boss.stage30NextTeleportAtMs = undefined;
            setStatus("⚡ 아스트라온의 부유석이 빛나며 자력 도약을 준비합니다!");
          }
        }
      }

      // 2. 몬스터 이동 & 완주(laps) 순환 이동 처리
      let instantGameOver = false;

      for (const m of monstersRef.current) {
        if (
          m.isFinalBoss &&
          m.finalBossDebugAutoPhase &&
          m.finalBossMode === "combat" &&
          m.finalBossDebugPhaseEndsAtMs !== undefined &&
          gameNow >= m.finalBossDebugPhaseEndsAtMs
        ) {
          const completedPhase = m.finalBossPhase ?? 4;
          m.finalBossTargetPhase = completedPhase === 4
            ? 1
            : (completedPhase + 1) as 2 | 3 | 4;
          m.finalBossMode = "releasing";
          m.finalBossTransitionEndsAtMs = gameNow + 1867;
          m.finalBossDebugPhaseEndsAtMs = undefined;
          m.hp = m.maxHp;
          m.slowUntilMs = undefined;
          m.paralyzeUntilMs = undefined;
          setStatus(`🛠 FINAL ${completedPhase}페이즈 5초 테스트 종료 · 다음 페이즈 전환`);
        }
        if (m.isFinalBoss && m.finalBossMode !== "combat") {
          if (m.finalBossTransitionEndsAtMs !== undefined && gameNow >= m.finalBossTransitionEndsAtMs) {
            if (m.finalBossMode === "intro") {
              m.finalBossMode = "absorbing";
              m.finalBossTransitionEndsAtMs = gameNow + 1867;
              setStatus("⚪ 맵의 빛이 최종 보스의 핵으로 빨려 들어갑니다!");
            } else if (m.finalBossMode === "releasing") {
              m.finalBossMode = "flash";
              m.finalBossFlashNext = m.finalBossEnding ? "remove" : "absorbing";
              m.finalBossTransitionEndsAtMs = gameNow + 420;
              setStatus("⚪ 빛의 방출이 끝나며 최종 보스의 형태가 무너집니다!");
            } else if (m.finalBossMode === "flash") {
              if (m.finalBossFlashNext === "remove") {
                m.hp = 0;
                m.finalBossTransitionEndsAtMs = undefined;
                setStatus("👑 최종 보스의 핵이 소멸했습니다!");
              } else if (m.finalBossFlashNext === "combat") {
                const nextPhase = m.finalBossTargetPhase ?? 1;
                m.finalBossPhase = nextPhase;
                m.finalBossMode = "combat";
                m.finalBossTransitionEndsAtMs = undefined;
                m.finalBossFlashNext = undefined;
                m.category = nextPhase === 1 ? "human" : nextPhase === 2 ? "land" : "flying";
                m.speedTilesPerSecond = MONSTER_STATS[m.category].speed;
                m.hp = m.maxHp;
                m.finalBossDebugPhaseEndsAtMs = m.finalBossDebugAutoPhase
                  ? gameNow + 5000
                  : undefined;
                m.statusImmunityUntilMs = gameNow + 800;
                const phaseName = nextPhase === 1 ? "인간형" : nextPhase === 2 ? "육지형" : nextPhase === 3 ? "조류형" : "???";
                setStatus(`👑 최종 보스 ${nextPhase}페이즈 · ${phaseName} 전투가 시작됩니다!`);
                addLog(`FINAL BOSS ${nextPhase}페이즈가 시작되었습니다.`);
              } else {
                m.finalBossPhase = 4;
                m.finalBossMode = "absorbing";
                m.finalBossFlashNext = undefined;
                m.finalBossTransitionEndsAtMs = gameNow + 1867;
                setStatus("⚪ 최종 보스가 핵으로 변환되어 다시 빛을 흡수합니다!");
              }
            } else if (m.finalBossMode === "absorbing") {
              m.finalBossMode = "flash";
              m.finalBossFlashNext = "combat";
              m.finalBossTransitionEndsAtMs = gameNow + 420;
              setStatus("⚪ 흡수된 빛이 폭발하며 최종 보스의 형태가 바뀝니다!");
            }
          }
          continue;
        }
        // 둔화/마비 속도 적용
        let currentSpeed = m.speedTilesPerSecond;
        if (
          m.stage05BeingAbsorbed ||
          (m.stage05AbsorbingUntilMs !== undefined &&
            gameNow < m.stage05AbsorbingUntilMs) ||
          m.stage05SummoningUntilMs !== undefined &&
          gameNow < m.stage05SummoningUntilMs
          || (
            m.stage10StompImpactAtMs !== undefined &&
            gameNow < m.stage10StompImpactAtMs
          )
          || (m.bossStage === 15 && (m.stage15State ?? "phoenix") !== "phoenix")
          || (m.bossStage === 20 && (
            m.stage20State === "charging" || m.stage20State === "stunned"
          ))
          || (m.bossStage === 25 && m.stage25CastEndsAtMs !== undefined && gameNow < m.stage25CastEndsAtMs)
          || (m.bossStage === 30 && m.stage30TeleportEndsAtMs !== undefined && gameNow < m.stage30TeleportEndsAtMs)
        ) {
          currentSpeed = 0;
        } else if (m.bossStage === 20 && m.stage20State === "shielded") {
          currentSpeed *= STAGE20_SHIELDED_SPEED_RATIO;
        } else if (m.paralyzeUntilMs && gameNow < m.paralyzeUntilMs) {
          currentSpeed = 0; // 마비: 0% 속도
        } else if (m.slowUntilMs && gameNow < m.slowUntilMs) {
          currentSpeed *= 0.5; // 둔화: 50% 속도
        }

        const monsterRoute = m.route ?? path;
        m.progress += currentSpeed * (dt / 1000);
        while (m.progress >= 1) {
          m.progress -= 1;
          m.pathStep++;

          // 도착 지점(G) 도착 시 -> 몬스터 삭제 안 하고 laps + 1 후 S로 재입장!
          if (m.pathStep >= monsterRoute.length - 1) {
            m.laps += 1;
            m.route = undefined;
            m.pathStep = 0;
            m.progress = 0;

            // 5회 완주 즉시 게임 오버 규칙!
            if (!m.isBoss && m.laps >= MAX_MONSTER_LAPS) {
              instantGameOver = true;
            }
          }
        }
      }

      if (instantGameOver) {
        setRunning(false);
        projectilesRef.current = [];
    tier3FirePillarsRef.current = [];
        setProjectiles([]);
        setGameResult("lost");
        setDamageReportWave(wave);
        setWaveDamageReport(waveUnitsRef.current.map((unit) => ({
          unitId: unit.id,
          typeId: unit.typeId,
          tier: unit.tier,
          damage: waveDamageRef.current[unit.id] ?? 0,
        })));
        setStatus("💀 몬스터 5회 완주! 즉시 게임 오버!");
        addLog("몬스터가 5바퀴를 완주해 게임이 종료되었습니다.");
        return;
      }

      // 3. 투사체 이동 & 명중 판정 (상성 데미지 + 9종 유닛 스킬 + 1초 상태이상 공통 면역)
      const remainingProjectiles: Projectile[] = [];
      let killGold = 0;

      const getMonsterPos = (m: Monster) => {
        const monsterRoute = m.route ?? path;
        const a = monsterRoute[Math.min(m.pathStep, monsterRoute.length - 1)] ?? start;
        const b = monsterRoute[Math.min(m.pathStep + 1, monsterRoute.length - 1)] ?? a;
        const [ar, ac] = toRC(a);
        const [br, bc] = toRC(b);
        return [ar + (br - ar) * m.progress, ac + (bc - ac) * m.progress];
      };

      const getMonDist = (m1: Monster, m2: Monster) => {
        const [r1, c1] = getMonsterPos(m1);
        const [r2, c2] = getMonsterPos(m2);
        return Math.hypot(r1 - r2, c1 - c2);
      };

      const getSourceDist = (p: Projectile, m: Monster) => {
        const [sourceRow, sourceCol] = toRC(p.fromCell);
        const [monsterRow, monsterCol] = getMonsterPos(m);
        return Math.hypot(monsterRow - sourceRow, monsterCol - sourceCol);
      };

      const getAreaDamage = (p: Projectile, m: Monster, distanceFactor = 1) =>
        Math.max(1, Math.round(
          p.baseDamage *
          DAMAGE_MULTIPLIERS[p.specType][m.category] *
          getSpecSynergyDamageMultiplier(p.specType, m.category, synergy) *
          distanceFactor,
        ));

      const dealDamage = (m: Monster, damage: number, sourceUnitId: number, ignoreMagicMark = false) => {
        const stage15State = m.stage15State ?? "phoenix";
        if (
          m.hp <= 0 ||
          damage <= 0 ||
          (m.isFinalBoss && m.finalBossMode !== "combat") ||
          m.stage05ShieldActive ||
          m.stage05BeingAbsorbed ||
          (m.bossStage === 15 && (stage15State === "transforming" || stage15State === "hatching"))
        ) return 0;
        if (
          m.bossStage === 20 &&
          (m.stage20ShieldHp ?? 0) > 0 &&
          (m.stage20State === "shielded" || m.stage20State === "charging")
        ) {
          const shieldDamage = Math.max(
            1,
            Math.round(damage * (1 - STAGE20_SHIELD_DAMAGE_REDUCTION)),
          );
          const actualShieldDamage = Math.min(m.stage20ShieldHp ?? 0, shieldDamage);
          m.stage20ShieldHp = Math.max(0, (m.stage20ShieldHp ?? 0) - actualShieldDamage);
          m.stage20ShieldHitUntilMs = gameNow + 180;
          waveDamageRef.current[sourceUnitId] =
            (waveDamageRef.current[sourceUnitId] ?? 0) + actualShieldDamage;
          m.lastHitTime = gameNow;

          if (m.stage20ShieldHp <= 0) {
            m.stage20State = "stunned";
            m.stage20ShieldHp = 0;
            m.stage20CastEndsAtMs = undefined;
            m.stage20NextShieldAtMs = gameNow + STAGE20_BREAK_COOLDOWN_MS;
            m.stage20StunnedUntilMs = gameNow + STAGE20_BREAK_STUN_MS;
            m.stage20ShieldBreakUntilMs = gameNow + 700;
            m.slowUntilMs = undefined;
            m.paralyzeUntilMs = undefined;
            setStatus("💥 보호막 파괴! 성채기사가 5초간 기절하고 받는 피해가 두 배가 됩니다!");
            addLog("20스테이지 보스의 보호막을 파괴했습니다. 약점 노출 시간이 시작됩니다.");
          }
          return actualShieldDamage;
        }
        if (m.bossStage === 30 && (m.stage30StoneCount ?? 0) > 0) {
          const stoneCount = Math.min(STAGE30_STONE_COUNT, m.stage30StoneCount ?? 0);
          const reductionByCount = [0, 0.15, 0.3, 0.4, 0.5];
          const reduction = reductionByCount[stoneCount] ?? 0;
          const stoneDamage = Math.max(1, Math.round(damage * reduction));
          const actualStoneDamage = Math.min(m.stage30StoneHp ?? 0, stoneDamage);
          m.stage30StoneHp = Math.max(0, (m.stage30StoneHp ?? 0) - actualStoneDamage);
          waveDamageRef.current[sourceUnitId] =
            (waveDamageRef.current[sourceUnitId] ?? 0) + actualStoneDamage;
          damage = Math.max(1, damage - stoneDamage);
          m.lastHitTime = gameNow;

          if ((m.stage30StoneHp ?? 0) <= 0) {
            m.stage30StoneCount = Math.max(0, stoneCount - 1);
            if ((m.stage30StoneCount ?? 0) > 0) {
              m.stage30StoneHp = m.stage30StoneMaxHp;
              setStatus(`💥 궤도 부유석 파괴! 남은 부유석 ${m.stage30StoneCount}개`);
            } else {
              m.stage30StoneHp = 0;
              m.stage30WeakUntilMs = gameNow + STAGE30_WEAK_DURATION_MS;
              m.stage30NextTeleportAtMs = undefined;
              m.stage30TeleportEndsAtMs = undefined;
              m.stage30TeleportTargetStep = undefined;
              setStatus("💎 모든 부유석 파괴! 아스트라온의 동력핵이 5초간 노출됩니다!");
              addLog("아스트라온의 궤도 방위체계를 파괴해 동력핵 약점이 노출되었습니다.");
            }
          }
        }
        if (!ignoreMagicMark && m.magicMarkUntilMs !== undefined && gameNow < m.magicMarkUntilMs) {
          const markMultiplier = (m.magicMarkTier ?? 2) >= 3
            ? (m.isBoss ? 1.14 : 1.3)
            : (m.isBoss ? 1.1 : 1.2);
          damage = Math.max(1, Math.round(damage * markMultiplier));
        }
        const reducedDamage = m.bossStage === 15 && stage15State === "egg"
          ? Math.max(1, Math.round(damage * (1 - STAGE15_EGG_DAMAGE_REDUCTION)))
          : m.bossStage === 20 && m.stage20State === "stunned"
            ? Math.max(1, Math.round(damage * STAGE20_BREAK_DAMAGE_MULTIPLIER))
            : m.bossStage === 30 && m.stage30WeakUntilMs !== undefined && gameNow < m.stage30WeakUntilMs
              ? Math.max(1, Math.round(damage * STAGE30_WEAK_DAMAGE_MULTIPLIER))
            : damage;
        const actualDamage = Math.min(m.hp, reducedDamage);
        m.hp -= actualDamage;
        waveDamageRef.current[sourceUnitId] =
          (waveDamageRef.current[sourceUnitId] ?? 0) + actualDamage;
        m.lastHitTime = gameNow;
        if (m.hp <= 0) {
          if (m.isFinalBoss && (m.finalBossPhase ?? 4) < 4) {
            const completedPhase = m.finalBossPhase ?? 1;
            m.finalBossTargetPhase = (completedPhase + 1) as 2 | 3 | 4;
            m.finalBossMode = "releasing";
            m.finalBossTransitionEndsAtMs = gameNow + 1867;
            m.hp = 1;
            m.slowUntilMs = undefined;
            m.paralyzeUntilMs = undefined;
            m.statusImmunityUntilMs = undefined;
            setStatus(`⚪ ${completedPhase}페이즈 종료! 핵에서 빛이 맵 끝으로 퍼져나갑니다.`);
            addLog(`FINAL BOSS ${completedPhase}페이즈가 종료되었습니다.`);
          } else if (m.isFinalBoss && (m.finalBossPhase ?? 4) === 4) {
            m.finalBossMode = "releasing";
            m.finalBossEnding = !m.finalBossDebugAutoPhase;
            m.finalBossTargetPhase = m.finalBossDebugAutoPhase ? 1 : undefined;
            m.finalBossTransitionEndsAtMs = gameNow + 1867;
            m.hp = 1;
            m.slowUntilMs = undefined;
            m.paralyzeUntilMs = undefined;
            m.statusImmunityUntilMs = undefined;
            setStatus("⚪ 최종 핵이 마지막 빛을 맵 전체로 방출합니다!");
            addLog("FINAL BOSS 4페이즈가 종료되었습니다.");
          } else if (m.bossStage === 15 && stage15State === "phoenix") {
            const eggHpRatio = (m.stage15ReviveCount ?? 0) >= 1
              ? STAGE15_REPEAT_EGG_HP_RATIO
              : STAGE15_EGG_HP_RATIO;
            const eggHp = Math.max(1, Math.round(m.maxHp * eggHpRatio));
            m.stage15State = "transforming";
            m.stage15EggMaxHp = eggHp;
            m.stage15PhaseEndsAtMs = gameNow + STAGE15_TRANSFORM_MS;
            m.stage15ReviveAtMs = undefined;
            m.hp = eggHp;
            m.slowUntilMs = undefined;
            m.paralyzeUntilMs = undefined;
            m.statusImmunityUntilMs = undefined;
            setStatus("🔥 영겁의 불사조가 불길에 휩싸이며 알로 변합니다!");
            addLog("영겁의 불사조가 소멸하지 않고 불타는 알로 변하기 시작했습니다.");
          } else if (!m.noKillGold) {
            killGold += m.isBoss ? BOSS_KILL_GOLD : MONSTER_KILL_GOLD;
          }
        }
        return actualDamage;
      };

      monstersRef.current.forEach((monster) => {
        if (
          monster.hp <= 0 ||
          monster.bleedUntilMs === undefined ||
          monster.bleedNextTickMs === undefined ||
          monster.bleedSourceUnitId === undefined
        ) return;
        if (gameNow >= monster.bleedUntilMs) {
          monster.bleedUntilMs = undefined;
          monster.bleedNextTickMs = undefined;
          monster.bleedSourceUnitId = undefined;
          return;
        }
        while (gameNow >= monster.bleedNextTickMs && monster.hp > 0) {
          const bleedDamage = Math.min(
            DUAL_BLEED_MAX_TICK_DAMAGE,
            Math.max(1, Math.round(monster.maxHp * 0.04)),
          );
          dealDamage(monster, bleedDamage, monster.bleedSourceUnitId, true);
          monster.bleedNextTickMs += DUAL_BLEED_TICK_MS;
        }
      });

      tier3FirePillarsRef.current = tier3FirePillarsRef.current.filter((pillar) => {
        if (gameNow >= pillar.untilMs) return false;
        while (gameNow >= pillar.nextTickMs) {
          monstersRef.current.forEach((monster) => {
            if (monster.hp <= 0) return;
            const [monsterRow, monsterCol] = getMonsterPos(monster);
            if (
              monsterCol < pillar.damageColStart || monsterCol >= pillar.damageColStart + 3 ||
              monsterRow < pillar.damageRowStart || monsterRow >= pillar.damageRowStart + 2
            ) return;
            const fireMultiplier = DAMAGE_MULTIPLIERS[pillar.specType][monster.category] *
              getSpecSynergyDamageMultiplier(pillar.specType, monster.category, synergy);
            dealDamage(
              monster,
              Math.max(1, Math.round(pillar.baseDamage * 0.2 * fireMultiplier)),
              pillar.sourceUnitId,
            );
          });
          pillar.nextTickMs += 500;
        }
        return true;
      });

      pendingHeavenlyStrikesRef.current = pendingHeavenlyStrikesRef.current.filter((strike) => {
        if (gameNow < strike.impactAtMs) return true;
        const primary = monstersRef.current.find((monster) => monster.id === strike.targetId && monster.hp > 0);
        if (!primary) return false;
        const getStrikeDamage = (monster: Monster, ratio: number) => {
          const lightPenalty = monster.isFinalBoss && monster.finalBossMode === "combat" && (
            monster.finalBossPhase === 4 ||
            (monster.finalBossPhase === 1 && strike.specType === "balance") ||
            (monster.finalBossPhase === 2 && strike.specType === "land_spec") ||
            (monster.finalBossPhase === 3 && strike.specType === "air_spec")
          ) ? 0.5 : 1;
          const typeMultiplier = monster.isFinalBoss && monster.finalBossPhase === 4
            ? 1
            : DAMAGE_MULTIPLIERS[strike.specType][monster.category] *
              getSpecSynergyDamageMultiplier(strike.specType, monster.category, synergy);
          return Math.max(1, Math.round(strike.baseDamage * ratio * lightPenalty * typeMultiplier));
        };
        dealDamage(primary, getStrikeDamage(primary, 1.25), strike.sourceUnitId);
        primary.tier3MageEffectKind = "lightning";
        primary.tier3MageEffectUntilMs = gameNow + 620;
        monstersRef.current.forEach((monster) => {
          if (monster.hp <= 0 || monster.id === primary.id || getMonDist(primary, monster) > 1.5) return;
          dealDamage(monster, getStrikeDamage(monster, 0.6), strike.sourceUnitId);
        });
        return false;
      });

      if (pendingUltimateHitsRef.current.length > 0) {
        const ultimateJobs = pendingUltimateHitsRef.current.splice(0);
        ultimateJobs.forEach((job) => {
          [...monstersRef.current].forEach((monster) => {
            if (monster.hp <= 0) return;
            job.contributions.forEach((contribution) => {
              const definition = UNIT_TYPES[contribution.typeId];
              const losesLight = monster.isFinalBoss && monster.finalBossMode === "combat" && (
                monster.finalBossPhase === 4 ||
                (monster.finalBossPhase === 1 && definition.specType === "balance") ||
                (monster.finalBossPhase === 2 && definition.specType === "land_spec") ||
                (monster.finalBossPhase === 3 && definition.specType === "air_spec")
              );
              dealDamage(
                monster,
                Math.max(1, Math.round(contribution.damage * (losesLight ? 0.5 : 1))),
                contribution.unitId,
              );
            });
          });
          const skillName = job.unitClass === "warrior"
            ? "천검난무"
            : job.unitClass === "mage"
              ? "종말대마법"
              : "궤도섬멸포격";
          setStatus(`필살기 · ${skillName}가 맵 전체를 타격했습니다!`);
          addLog(`${skillName}가 발동해 모든 적을 공격했습니다.`);
        });
      }

      for (const p of projectilesRef.current) {
        if (p.delayMs > 0) {
          p.delayMs = Math.max(0, p.delayMs - dt);
          remainingProjectiles.push(p);
          continue;
        }
        p.progress += dt / p.durationMs;
        if (p.progress >= 1) {
          const targetMon = monstersRef.current.find(
            (m) => m.id === p.targetId,
          );
          if (targetMon && targetMon.hp > 0) {
            const sourceUnit = unitsRef.current.find((unit) => unit.id === p.sourceUnitId);
            // 주 대상 명중 시점 위치 주변 1.5타일 몬스터 그룹
            const nearbyMonsters = monstersRef.current.filter(
              (m) => m.hp > 0 && getMonDist(targetMon, m) <= 1.5,
            );

            // 🔮 마검사: 주 대상 + 주변 1.5타일 이내 최대 2마리 (총 3마리) 범위 피해
            if (p.effectType === "magic_swordsman") {
              const splashList = [
                targetMon,
                ...nearbyMonsters.filter((m) => m.id !== targetMon.id),
              ].slice(0, 3);
              splashList.forEach((m) => {
                dealDamage(m, getAreaDamage(p, m), p.sourceUnitId);
              });
              if (sourceUnit?.tier && sourceUnit.tier >= 2) {
                const markChance = sourceUnit.tier >= 3 ? 0.25 : MAGIC_MARK_CHANCE;
                if (Math.random() < markChance) {
                  targetMon.magicMarkUntilMs = gameNow + (sourceUnit.tier >= 3 ? 8000 : MAGIC_MARK_DURATION_MS);
                  targetMon.magicMarkTier = sourceUnit.tier;
                }
              }
            }
            // 화염술사: 확률 발동 시 주 대상 주변 1.5칸 범위 피해
            else if (p.effectType === "fire") {
              dealDamage(targetMon, p.damage, p.sourceUnitId);
              const splashRatio = sourceUnit?.tier && sourceUnit.tier >= 3 ? 0.3 : FIRE_SPLASH_RATIO;
              nearbyMonsters
                .filter((monster) => monster.id !== targetMon.id)
                .forEach((monster) => {
                  dealDamage(
                    monster,
                    Math.max(1, Math.round(getAreaDamage(p, monster) * splashRatio)),
                    p.sourceUnitId,
                  );
                });
            }
            // 💥 산탄총병: 적마다 사수와의 거리·상성을 따로 적용
            else if (p.effectType === "shotgun") {
              const shotgunRadius = p.shotgunDoubleBarrel ? 1.8 : 1.5;
              monstersRef.current
                .filter((monster) => monster.hp > 0 && getMonDist(targetMon, monster) <= shotgunRadius)
                .forEach((m) => {
                const distance = getSourceDist(p, m);
                if (m.id !== targetMon.id && distance > p.rangeTiles) return;
                const ratio = Math.min(1, distance / p.rangeTiles);
                dealDamage(m, getAreaDamage(p, m, 1 - ratio * 0.5), p.sourceUnitId);
              });
            }
            // 일반 타격 / 얼음술사 / 번개술사 / 저격병
            else {
              if (p.effectType === "sniper") {
                if (targetMon.isBoss) {
                  targetMon.sniperImpactUntilMs = gameNow + 480;
                  dealDamage(targetMon, p.damage * BOSS_SNIPER_DAMAGE_MULTIPLIER, p.sourceUnitId);
                  setStatus(`🎯 [저격] 보스에게 중대 피해!`);
                } else {
                  dealDamage(targetMon, targetMon.hp, p.sourceUnitId);
                  setStatus(`🎯 [저격] 몬스터 #${targetMon.id} 헤드샷 즉사!`);
                }
              } else {
                dealDamage(targetMon, p.damage, p.sourceUnitId);
              }

              if (sourceUnit?.tier && sourceUnit.tier >= 2 && p.sourceTypeId === "fire_mage") {
                const splashRatio = sourceUnit.tier >= 3 ? 0.3 : FIRE_SPLASH_RATIO;
                nearbyMonsters
                  .filter((monster) => monster.id !== targetMon.id)
                  .forEach((monster) => {
                    dealDamage(
                      monster,
                      Math.max(1, Math.round(getAreaDamage(p, monster) * splashRatio)),
                      p.sourceUnitId,
                    );
                  });
              }

              if (p.swordsmanWave && sourceUnit) {
                targetMon.tier3EffectUntilMs = gameNow + 600;
                targetMon.tier3EffectKind = "swordsman";
                const [sourceRow, sourceCol] = toRC(sourceUnit.cell);
                const [targetRow, targetCol] = getMonsterPos(targetMon);
                const rawDirectionRow = targetRow - sourceRow;
                const rawDirectionCol = targetCol - sourceCol;
                const directionRow = Math.abs(rawDirectionRow) < 0.35 ? 0 : Math.sign(rawDirectionRow);
                const directionCol = Math.abs(rawDirectionCol) < 0.35 ? 0 : Math.sign(rawDirectionCol);
                const directionLength = Math.max(1, Math.hypot(directionRow, directionCol));
                const waveLength = directionRow !== 0 && directionCol !== 0 ? 2 : 3;
                sourceUnit.swordsmanWaveUntilMs = gameNow + 950;
                sourceUnit.swordsmanWaveOriginRow = targetRow;
                sourceUnit.swordsmanWaveOriginCol = targetCol;
                sourceUnit.swordsmanWaveDirectionRow = directionRow;
                sourceUnit.swordsmanWaveDirectionCol = directionCol;
                sourceUnit.swordsmanWaveLength = waveLength;
                monstersRef.current.forEach((monster) => {
                  if (monster.hp <= 0 || monster.id === targetMon.id) return;
                  const [monsterRow, monsterCol] = getMonsterPos(monster);
                  const relativeRow = monsterRow - targetRow;
                  const relativeCol = monsterCol - targetCol;
                  const forward = (relativeRow * directionRow + relativeCol * directionCol) / directionLength;
                  const side = Math.abs(relativeRow * directionCol - relativeCol * directionRow) / directionLength;
                  if (forward <= 0 || forward > waveLength - 1 || side > 0.62) return;
                  dealDamage(monster, Math.max(1, Math.round(getAreaDamage(p, monster) * 1.6)), p.sourceUnitId);
                  monster.tier3EffectUntilMs = gameNow + 600;
                  monster.tier3EffectKind = "swordsman";
                });
              }

              if (p.appliesBleed && targetMon.hp > 0) {
                targetMon.bleedUntilMs = gameNow + (
                  sourceUnit?.tier && sourceUnit.tier >= 3
                    ? TIER3_DUAL_BLEED_DURATION_MS
                    : DUAL_BLEED_DURATION_MS
                );
                targetMon.bleedNextTickMs = gameNow + DUAL_BLEED_TICK_MS;
                targetMon.bleedSourceUnitId = p.sourceUnitId;
              }

              // ❄️ 얼음술사 둔화: 주 대상 주변 1.5타일 안의 모든 몬스터에게 1초 50% 둔화 적용!
              if (p.effectType === "ice") {
                nearbyMonsters.forEach((m) => {
                  const isImmune =
                    m.statusImmunityUntilMs && gameNow < m.statusImmunityUntilMs;
                  if (m.hp > 0 && !isImmune) {
                    m.slowUntilMs = gameNow + 1000;
                    m.statusImmunityUntilMs = gameNow + 1000; // 1초 면역
                  }
                });
              }

              // ⚡ 번개술사 마비: 단일 1초 마비
              if (p.effectType === "lightning") {
                const isImmune =
                  targetMon.statusImmunityUntilMs &&
                  gameNow < targetMon.statusImmunityUntilMs;
                if (targetMon.hp > 0 && !isImmune) {
                  targetMon.paralyzeUntilMs = gameNow + 1000;
                  targetMon.statusImmunityUntilMs = gameNow + 1000; // 1초 면역
                }
              }

            }
          }
        } else {
          remainingProjectiles.push(p);
        }
      }

      // 사망 몬스터 제거 & 골드 지급
      monstersRef.current = monstersRef.current.filter((m) => m.hp > 0);
      if (killGold > 0) {
        setGold((g) => g + killGold);
      }
      projectilesRef.current = remainingProjectiles;

      // 4. 유닛 사격 및 투사체 생성 (9종 유닛 스킬 개별 동작)
      for (const unit of unitsRef.current) {
        const uDef = UNIT_TYPES[unit.typeId];
        unit.cooldownMs = Math.max(0, unit.cooldownMs - dt);
        if (unit.activeSkillCooldownMs !== undefined) {
          unit.activeSkillCooldownMs = Math.max(0, unit.activeSkillCooldownMs - dt);
        }
        if (unit.adrenalinePhase && unit.adrenalinePhaseUntilMs !== undefined && gameNow >= unit.adrenalinePhaseUntilMs) {
          if (unit.adrenalinePhase === "boost") {
            unit.adrenalinePhase = "fatigue";
            unit.adrenalinePhaseUntilMs = gameNow + (unit.tier >= 3 ? 1500 : RIFLE_ADRENALINE_FATIGUE_MS);
          } else {
            unit.adrenalinePhase = undefined;
            unit.adrenalinePhaseUntilMs = undefined;
          }
        }

        if (
          unit.frozenOrbCell !== undefined &&
          unit.frozenOrbUntilMs !== undefined &&
          unit.frozenOrbNextTickMs !== undefined
        ) {
          if (unit.tier >= 3 && unit.frozenOrbPathPosition !== undefined) {
            unit.frozenOrbTrailCells = (unit.frozenOrbTrailCells ?? []).filter(
              (trail) => gameNow < trail.untilMs,
            );
            const previousOrbCell = unit.frozenOrbCell;
            unit.frozenOrbPathPosition = Math.min(
              path.length - 1,
              unit.frozenOrbPathPosition + (dt / 1000) * TIER3_FROZEN_ORB_MOVE_TILES_PER_SEC,
            );
            unit.frozenOrbCell = path[Math.round(unit.frozenOrbPathPosition)] ?? previousOrbCell;
            if (unit.frozenOrbCell !== previousOrbCell) {
              unit.frozenOrbTrailCells = [
                ...(unit.frozenOrbTrailCells ?? []),
                { cell: previousOrbCell, untilMs: gameNow + 1500 },
              ];
            }
          }
          if (gameNow >= unit.frozenOrbUntilMs) {
            if (unit.tier >= 3) {
              unit.frozenOrbExplosionCell = unit.frozenOrbCell;
              unit.frozenOrbExplosionUntilMs = gameNow + 760;
              const [orbRow, orbCol] = toRC(unit.frozenOrbCell);
              const upgradeLevels = getUpgradeLevels(upgrades, unit.typeId);
              const orbBaseDamage = uDef.damage * (
                getUnitTierDamageMultiplier(unit.tier, uDef.unitClass) +
                getUnitUpgradeDamageMultiplier(unit.typeId, upgradeLevels)
              );
              monstersRef.current.forEach((monster) => {
                if (monster.hp <= 0) return;
                const [monsterRow, monsterCol] = getMonsterPos(monster);
                if (Math.hypot(monsterRow - orbRow, monsterCol - orbCol) > TIER3_FROZEN_ORB_RADIUS_TILES) return;
                const controlled =
                  (monster.slowUntilMs !== undefined && gameNow < monster.slowUntilMs) ||
                  (monster.paralyzeUntilMs !== undefined && gameNow < monster.paralyzeUntilMs);
                const explosionMultiplier = DAMAGE_MULTIPLIERS[uDef.specType][monster.category] *
                  getSpecSynergyDamageMultiplier(uDef.specType, monster.category, synergy);
                dealDamage(
                  monster,
                  Math.max(1, Math.round(orbBaseDamage * (controlled ? 3.3 : 2.5) * explosionMultiplier)),
                  unit.id,
                );
                monster.tier3EffectUntilMs = gameNow + 700;
                const immune = monster.statusImmunityUntilMs !== undefined && gameNow < monster.statusImmunityUntilMs;
                if (!immune && monster.hp > 0) {
                  monster.slowUntilMs = gameNow + 1500;
                  monster.statusImmunityUntilMs = gameNow + 1000;
                }
              });
            }
            unit.frozenOrbCell = undefined;
            unit.frozenOrbPathPosition = undefined;
            unit.frozenOrbTrailCells = undefined;
            unit.frozenOrbUntilMs = undefined;
            unit.frozenOrbNextTickMs = undefined;
          } else if (gameNow >= unit.frozenOrbNextTickMs) {
            const [orbRow, orbCol] = toRC(unit.frozenOrbCell);
            const upgradeLevels = getUpgradeLevels(upgrades, unit.typeId);
            const orbBaseDamage = uDef.damage * (
              getUnitTierDamageMultiplier(unit.tier, uDef.unitClass) +
              getUnitUpgradeDamageMultiplier(unit.typeId, upgradeLevels)
            );
            monstersRef.current.forEach((monster) => {
              if (monster.hp <= 0) return;
              const [monsterRow, monsterCol] = getMonsterPos(monster);
              const orbRadius = unit.tier >= 3 ? TIER3_FROZEN_ORB_RADIUS_TILES : 1.5;
              if (Math.hypot(monsterRow - orbRow, monsterCol - orbCol) > orbRadius) return;
              const controlled =
                (monster.slowUntilMs !== undefined && gameNow < monster.slowUntilMs) ||
                (monster.paralyzeUntilMs !== undefined && gameNow < monster.paralyzeUntilMs);
              const damage = Math.max(1, Math.round(
                orbBaseDamage *
                (unit.tier >= 3 ? (controlled ? 0.55 : 0.25) : (controlled ? 0.5 : 0.2)) *
                DAMAGE_MULTIPLIERS[uDef.specType][monster.category] *
                getSpecSynergyDamageMultiplier(uDef.specType, monster.category, synergy),
              ));
              dealDamage(monster, damage, unit.id);
              if (unit.tier >= 3 && Math.random() < 0.2) {
                const immune = monster.statusImmunityUntilMs !== undefined && gameNow < monster.statusImmunityUntilMs;
                if (!immune && monster.hp > 0) {
                  monster.slowUntilMs = gameNow + 1000;
                  monster.statusImmunityUntilMs = gameNow + 1000;
                }
              }
            });
            if (unit.tier >= 3 && (unit.frozenOrbTrailCells?.length ?? 0) > 0) {
              monstersRef.current.forEach((monster) => {
                if (monster.hp <= 0) return;
                const [monsterRow, monsterCol] = getMonsterPos(monster);
                const touchesTrail = unit.frozenOrbTrailCells!.some((trail) => {
                  const [trailRow, trailCol] = toRC(trail.cell);
                  return Math.hypot(monsterRow - trailRow, monsterCol - trailCol) <= 0.65;
                });
                if (!touchesTrail) return;
                const trailMultiplier = DAMAGE_MULTIPLIERS[uDef.specType][monster.category] *
                  getSpecSynergyDamageMultiplier(uDef.specType, monster.category, synergy);
                dealDamage(monster, Math.max(1, Math.round(orbBaseDamage * 0.12 * trailMultiplier)), unit.id);
                const immune = monster.statusImmunityUntilMs !== undefined && gameNow < monster.statusImmunityUntilMs;
                if (!immune && monster.hp > 0) monster.slowUntilMs = gameNow + 700;
              });
            }
            unit.frozenOrbNextTickMs += FROZEN_ORB_TICK_MS;
          }
        }
        if (unit.tier >= 3 && unit.typeId === "lightning_mage") {
          if (unit.heavenlyJudgmentNextAtMs === undefined) {
            unit.heavenlyJudgmentNextAtMs = gameNow + 5000;
          }
          if (gameNow >= unit.heavenlyJudgmentNextAtMs) {
            const eligibleTargets = monstersRef.current.filter(
              (monster) =>
                monster.hp > 0 &&
                !monster.stage05ShieldActive &&
                !monster.stage05BeingAbsorbed &&
                !(monster.isFinalBoss && monster.finalBossMode !== "combat") &&
                !(monster.bossStage === 15 && (monster.stage15State === "transforming" || monster.stage15State === "hatching")),
            );
            if (eligibleTargets.length > 0) {
              const chosenTargets = [...eligibleTargets]
                .sort(() => Math.random() - 0.5)
                .slice(0, 4);
              const upgradeLevels = getUpgradeLevels(upgrades, unit.typeId);
              const heavenlyBaseDamage = uDef.damage * (
                getUnitTierDamageMultiplier(unit.tier, uDef.unitClass) +
                getUnitUpgradeDamageMultiplier(unit.typeId, upgradeLevels)
              );
              chosenTargets.forEach((primary) => {
                primary.heavenlyWarningUntilMs = gameNow + 360;
                pendingHeavenlyStrikesRef.current.push({
                  id: nextHeavenlyStrikeId.current++,
                  targetId: primary.id,
                  sourceUnitId: unit.id,
                  baseDamage: heavenlyBaseDamage,
                  specType: uDef.specType,
                  impactAtMs: gameNow + 360,
                });
              });
              unit.heavenlyJudgmentNextAtMs += 5000;
            }
          }
        }
        if (unit.stunnedUntilMs && gameNow < unit.stunnedUntilMs) continue;
        if (unit.cooldownMs > 0) continue;
        const rangeTiles = unit.rangeTiles + (
          uDef.unitClass === "ranger"
            ? RANGER_RANGE_BONUS_TILES[synergy.classTiers.ranger] + getUnitTierRangeBonus(unit.tier, uDef.unitClass)
            : 0
        );
        const [unitRow, unitCol] = toRC(unit.cell);

        const getDistance = (monster: Monster) => {
          const monsterRoute = monster.route ?? path;
          const a = monsterRoute[Math.min(monster.pathStep, monsterRoute.length - 1)] ?? start;
          const b = monsterRoute[Math.min(monster.pathStep + 1, monsterRoute.length - 1)] ?? a;
          const [ar, ac] = toRC(a);
          const [br, bc] = toRC(b);
          const monsterRow = ar + (br - ar) * monster.progress;
          const monsterCol = ac + (bc - ac) * monster.progress;
          return Math.hypot(monsterRow - unitRow, monsterCol - unitCol);
        };

        const inRange = monstersRef.current.filter(
          (m) =>
            m.hp > 0 &&
            !m.stage05ShieldActive &&
            !m.stage05BeingAbsorbed &&
            !(m.isFinalBoss && m.finalBossMode !== "combat") &&
            !(m.bossStage === 15 && (m.stage15State === "transforming" || m.stage15State === "hatching")) &&
            getDistance(m) <= rangeTiles,
        );

        let target = inRange.find((m) => m.id === unit.targetId);
        if (!target) {
          target = [...inRange].sort(
            (a, b) => getDistance(a) - getDistance(b),
          )[0];
        }

        if (!target) {
          unit.targetId = null;
          continue;
        }

        if (unit.tier >= 2 && (unit.activeSkillCooldownMs ?? 1) <= 0) {
          if (unit.typeId === "rifleman") {
            unit.adrenalinePhase = "boost";
            unit.adrenalinePhaseUntilMs = gameNow + (unit.tier >= 3 ? 5000 : RIFLE_ADRENALINE_BOOST_MS);
            unit.activeSkillCooldownMs = RIFLE_ADRENALINE_CYCLE_MS;
          } else if (unit.typeId === "ice_mage") {
            const targetRouteForOrb = target.route ?? path;
            const targetCellOffset = target.progress >= 0.5 ? 1 : 0;
            unit.frozenOrbCell = targetRouteForOrb[
              Math.min(target.pathStep + targetCellOffset, targetRouteForOrb.length - 1)
            ] ?? start;
            if (unit.tier >= 3) {
              const directPathIndex = path.indexOf(unit.frozenOrbCell);
              unit.frozenOrbPathPosition = directPathIndex >= 0
                ? directPathIndex
                : path.reduce((closestIndex, pathCell, pathIndex) => {
                    const [pathRow, pathCol] = toRC(pathCell);
                    const [orbRow, orbCol] = toRC(unit.frozenOrbCell!);
                    const [closestRow, closestCol] = toRC(path[closestIndex] ?? start);
                    return Math.hypot(pathRow - orbRow, pathCol - orbCol) <
                      Math.hypot(closestRow - orbRow, closestCol - orbCol)
                      ? pathIndex
                      : closestIndex;
                  }, 0);
            } else {
              unit.frozenOrbPathPosition = undefined;
            }
            unit.frozenOrbTrailCells = unit.tier >= 3 ? [] : undefined;
            unit.frozenOrbUntilMs = gameNow + FROZEN_ORB_DURATION_MS;
            unit.frozenOrbNextTickMs = gameNow;
            unit.activeSkillCooldownMs = FROZEN_ORB_COOLDOWN_MS;
            unit.skillEffectUntilMs = gameNow + 500;
          }
        }

        const targetRoute = target.route ?? path;
        const targetPathCell = targetRoute[Math.min(target.pathStep, targetRoute.length - 1)] ?? start;
        const nextTargetPathCell = targetRoute[Math.min(target.pathStep + 1, targetRoute.length - 1)] ?? targetPathCell;
        const [, targetCol] = toRC(targetPathCell);
        const [, nextTargetCol] = toRC(nextTargetPathCell);
        const interpolatedTargetCol = targetCol + (nextTargetCol - targetCol) * target.progress;
        if (interpolatedTargetCol !== unitCol) {
          unit.facing = interpolatedTargetCol < unitCol ? "left" : "right";
        }
        unit.targetId = target.id;
        const adrenalineAttackSpeed = unit.adrenalinePhase === "boost"
          ? 3
          : unit.adrenalinePhase === "fatigue"
            ? 0.5
            : 1;
        unit.cooldownMs = uDef.unitClass === "warrior"
          ? unit.attackIntervalMs / (
              1 +
              WARRIOR_ATTACK_SPEED_BONUS[synergy.classTiers.warrior] +
              getUnitTierAttackSpeedBonus(unit.tier, uDef.unitClass)
            )
          : unit.attackIntervalMs / adrenalineAttackSpeed;
        unit.lastAttackTimeMs = gameNow;

        // 상성 배율 계산
        const finalBossLightPenalty = target.isFinalBoss && target.finalBossMode === "combat" && (
          target.finalBossPhase === 4 ||
          (target.finalBossPhase === 1 && uDef.specType === "balance") ||
          (target.finalBossPhase === 2 && uDef.specType === "land_spec") ||
          (target.finalBossPhase === 3 && uDef.specType === "air_spec")
        ) ? 0.5 : 1;
        const multiplier = target.isFinalBoss && target.finalBossPhase === 4
          ? 1
          : DAMAGE_MULTIPLIERS[uDef.specType][target.category] *
            getSpecSynergyDamageMultiplier(uDef.specType, target.category, synergy);
        const upgradeLevels = getUpgradeLevels(upgrades, unit.typeId);
        const baseDmg = uDef.damage * (
          getUnitTierDamageMultiplier(unit.tier, uDef.unitClass) +
          getUnitUpgradeDamageMultiplier(unit.typeId, upgradeLevels)
        );
        const penalizedBaseDmg = baseDmg * finalBossLightPenalty;
        let calculatedDamage = Math.max(1, Math.round(penalizedBaseDmg * multiplier));

        if (unit.tier >= 3 && (unit.activeSkillCooldownMs ?? 1) <= 0) {
          if (unit.typeId === "dual_swordsman") {
            monstersRef.current.forEach((monster) => {
              if (monster.hp <= 0 || getDistance(monster) > 2) return;
              const bloodRatio = monster.bleedUntilMs !== undefined && gameNow < monster.bleedUntilMs ? 6 : 5;
              const areaDamage = getAreaDamage({
                id: -1,
                sourceUnitId: unit.id,
                sourceTypeId: unit.typeId,
                fromCell: unit.cell,
                targetId: monster.id,
                damage: calculatedDamage,
                baseDamage: penalizedBaseDmg,
                specType: uDef.specType,
                rangeTiles,
                progress: 1,
                delayMs: 0,
                durationMs: 1,
              }, monster, bloodRatio);
              dealDamage(monster, Math.max(1, Math.round(areaDamage)), unit.id);
              monster.tier3EffectUntilMs = gameNow + 650;
              monster.tier3EffectKind = "dual_swordsman";
            });
            unit.skillEffectUntilMs = gameNow + 650;
            unit.tier3AreaKind = "dual_swordsman";
            unit.activeSkillCooldownMs = DUAL_BLOOD_FLURRY_COOLDOWN_MS;
            continue;
          }
          if (unit.typeId === "magic_swordsman") {
            monstersRef.current.forEach((monster) => {
              if (monster.hp <= 0 || getDistance(monster) > 1.8) return;
              dealDamage(monster, Math.max(1, Math.round(getAreaDamage({
                id: -1,
                sourceUnitId: unit.id,
                sourceTypeId: unit.typeId,
                fromCell: unit.cell,
                targetId: monster.id,
                damage: calculatedDamage,
                baseDamage: penalizedBaseDmg,
                specType: uDef.specType,
                rangeTiles,
                progress: 1,
                delayMs: 0,
                durationMs: 1,
              }, monster) * 3)), unit.id);
              if (monster.hp > 0) {
                monster.magicMarkUntilMs = gameNow + 8000;
                monster.magicMarkTier = 3;
                monster.tier3EffectUntilMs = gameNow + 650;
                monster.tier3EffectKind = "magic_swordsman";
              }
            });
            unit.skillEffectUntilMs = gameNow + 650;
            unit.tier3AreaKind = "magic_swordsman";
            unit.activeSkillCooldownMs = MAGIC_MARK_FIELD_COOLDOWN_MS;
            continue;
          }
          if (unit.typeId === "fire_mage") {
            const pillarTarget = [...inRange].sort((a, b) => {
              const aroundA = monstersRef.current.filter((monster) => monster.hp > 0 && getMonDist(a, monster) <= 1.5).length;
              const aroundB = monstersRef.current.filter((monster) => monster.hp > 0 && getMonDist(b, monster) <= 1.5).length;
              return aroundB - aroundA;
            })[0] ?? target;
            const pillarRoute = pillarTarget.route ?? path;
            const pillarPathIndex = Math.min(
              pillarTarget.pathStep + (pillarTarget.progress >= 0.5 ? 1 : 0),
              pillarRoute.length - 1,
            );
            const pillarCell = pillarRoute[pillarPathIndex] ?? start;
            const [pillarRow, pillarCol] = toRC(pillarCell);
            const damageRowStart = pillarRow - 1;
            const damageColStart = pillarCol - 1;
            monstersRef.current.forEach((monster) => {
              if (monster.hp <= 0) return;
              const [monsterRow, monsterCol] = getMonsterPos(monster);
              if (
                monsterCol < damageColStart || monsterCol >= damageColStart + 3 ||
                monsterRow < damageRowStart || monsterRow >= damageRowStart + 2
              ) return;
              const fireMultiplier = DAMAGE_MULTIPLIERS[uDef.specType][monster.category] *
                getSpecSynergyDamageMultiplier(uDef.specType, monster.category, synergy);
              dealDamage(monster, Math.max(1, Math.round(penalizedBaseDmg * 1.5 * fireMultiplier)), unit.id);
              if (monster.hp > 0) monster.tier3EffectUntilMs = gameNow + 700;
            });
            tier3FirePillarsRef.current.push({
              id: nextTier3AreaId.current++,
              row: pillarRow,
              col: pillarCol,
              damageRowStart,
              damageColStart,
              sourceUnitId: unit.id,
              baseDamage: penalizedBaseDmg,
              specType: uDef.specType,
              nextTickMs: gameNow + 500,
              untilMs: gameNow + 3000,
            });
            unit.activeSkillCooldownMs = FIRE_PILLAR_COOLDOWN_MS;
            continue;
          }
          if (unit.typeId === "sniper") {
            const killShotTarget = [...inRange].sort((a, b) => b.hp - a.hp)[0] ?? target;
            const killShotMultiplier = killShotTarget.isFinalBoss && killShotTarget.finalBossPhase === 4
              ? 1
              : DAMAGE_MULTIPLIERS[uDef.specType][killShotTarget.category] *
                getSpecSynergyDamageMultiplier(uDef.specType, killShotTarget.category, synergy);
            dealDamage(
              killShotTarget,
              Math.max(1, Math.round(penalizedBaseDmg * TIER3_SNIPER_KILL_SHOT_DAMAGE_RATIO * killShotMultiplier)),
              unit.id,
            );
            if (!killShotTarget.isBoss && killShotTarget.hp > 0 && killShotTarget.hp / killShotTarget.maxHp <= 0.2) {
              dealDamage(killShotTarget, killShotTarget.hp, unit.id);
            }
            killShotTarget.sniperImpactUntilMs = gameNow + 600;
            killShotTarget.tier3EffectUntilMs = gameNow + 600;
            const [killShotRow, killShotCol] = getMonsterPos(killShotTarget);
            unit.tier3RangerEffectUntilMs = gameNow + 900;
            unit.tier3RangerEffectKind = "sniper";
            unit.tier3RangerEffectRow = killShotRow;
            unit.tier3RangerEffectCol = killShotCol;
            unit.activeSkillCooldownMs = SNIPER_KILL_SHOT_COOLDOWN_MS;
            continue;
          }
        }

        if (unit.tier >= 2 && unit.typeId === "sniper" && getDistance(target) >= (unit.tier >= 3 ? 2.2 : 2.5)) {
          calculatedDamage = Math.max(1, Math.round(calculatedDamage * (unit.tier >= 3 ? TIER3_SNIPER_HAWK_EYE_DAMAGE_RATIO : 1.2)));
        }

        let swordsmanWave = false;
        if (unit.tier >= 3 && unit.typeId === "swordsman") {
          unit.swordsmanAttackCount = (unit.swordsmanAttackCount ?? 0) + 1;
          if (unit.swordsmanAttackCount >= 4) {
            unit.swordsmanAttackCount = 0;
            swordsmanWave = true;
            calculatedDamage = Math.max(calculatedDamage, Math.round(penalizedBaseDmg * multiplier * 3.2));
          }
        }

        if (unit.tier >= 3 && unit.typeId === "rifleman" && Math.random() < TIER3_RIFLE_CRIT_CHANCE) {
          calculatedDamage = Math.max(1, Math.round(calculatedDamage * TIER3_RIFLE_CRIT_DAMAGE_RATIO));
          target.tier3EffectUntilMs = gameNow + 350;
          const [criticalRow, criticalCol] = getMonsterPos(target);
          unit.tier3RangerEffectUntilMs = gameNow + 720;
          unit.tier3RangerEffectKind = "rifleman";
          unit.tier3RangerEffectRow = criticalRow;
          unit.tier3RangerEffectCol = criticalCol;
        }

        let swordsmanCombo = false;
        if (
          unit.tier >= 2 &&
          unit.typeId === "swordsman" &&
          (unit.activeSkillCooldownMs ?? 1) <= 0
        ) {
          const comboDamageRatio = unit.tier >= 3
            ? TIER3_SWORDSMAN_COMBO_DAMAGE_RATIO
            : SWORDSMAN_COMBO_DAMAGE_RATIO;
          calculatedDamage = Math.max(
            calculatedDamage,
            Math.max(1, Math.round(penalizedBaseDmg * multiplier * comboDamageRatio)),
          );
          unit.activeSkillCooldownMs = unit.tier >= 3
            ? TIER3_SWORDSMAN_COMBO_COOLDOWN_MS
            : SWORDSMAN_COMBO_COOLDOWN_MS;
          target.swordsmanComboHitUntilMs = gameNow + 500;
          swordsmanCombo = true;
        }

        if (
          unit.tier >= 2 &&
          unit.typeId === "lightning_mage" &&
          (unit.activeSkillCooldownMs ?? 1) <= 0
        ) {
          const chainTargets: Monster[] = [target];
          const chainTargetLimit = unit.tier >= 3 ? TIER3_CHAIN_MAX_TARGETS : 6;
          while (chainTargets.length < chainTargetLimit) {
            const previous = chainTargets[chainTargets.length - 1];
            const next = monstersRef.current
              .filter((monster) => monster.hp > 0 && !chainTargets.some((hit) => hit.id === monster.id))
              .map((monster) => ({ monster, distance: getMonDist(previous, monster) }))
              .filter((candidate) => candidate.distance <= (unit.tier >= 3 ? 3 : 2.5))
              .sort((a, b) => a.distance - b.distance)[0]?.monster;
            if (!next) break;
            chainTargets.push(next);
          }
          const ratios = [1.5, 1, 0.7, 0.5, 0.5, 0.5, 0.5, 0.5];
          if (chainTargets.length <= (unit.tier >= 3 ? 5 : 3)) {
            ratios[chainTargets.length - 1] = unit.tier >= 3 ? 3 : 2.5;
          }
          chainTargets.forEach((monster, index) => {
            const losesLight = monster.isFinalBoss && monster.finalBossMode === "combat" && (
              monster.finalBossPhase === 4 || monster.finalBossPhase === 3
            );
            const chainMultiplier = monster.isFinalBoss && monster.finalBossPhase === 4
              ? 1
              : DAMAGE_MULTIPLIERS[uDef.specType][monster.category] *
                getSpecSynergyDamageMultiplier(uDef.specType, monster.category, synergy);
            dealDamage(
              monster,
              Math.max(1, Math.round(baseDmg * (losesLight ? 0.5 : 1) * chainMultiplier * ratios[index])),
              unit.id,
            );
            monster.chainHitUntilMs = gameNow + 450;
            if (Math.random() < LIGHTNING_PARALYZE_CHANCE + MAGE_STATUS_CHANCE_BONUS[synergy.classTiers.mage]) {
              const immune = monster.statusImmunityUntilMs !== undefined && gameNow < monster.statusImmunityUntilMs;
              if (!immune && monster.hp > 0) {
                monster.paralyzeUntilMs = gameNow + 1000;
                monster.statusImmunityUntilMs = gameNow + 1000;
              }
            }
          });
          unit.activeSkillCooldownMs = CHAIN_LIGHTNING_COOLDOWN_MS;
          unit.skillEffectUntilMs = gameNow + 500;
          continue;
        }

        if (
          unit.tier >= 2 &&
          unit.typeId === "shotgunner" &&
          (unit.activeSkillCooldownMs ?? 1) <= 0 &&
          (inRange.length >= (unit.tier >= 3 ? 4 : 5) || inRange.some((monster) => monster.isBoss))
        ) {
          monstersRef.current.forEach((monster) => {
            if (monster.hp <= 0) return;
            const distance = getDistance(monster);
            const barrageRadius = unit.tier >= 3
              ? TIER3_SHOTGUN_BARRAGE_RADIUS_TILES
              : SHOTGUN_BARRAGE_RADIUS_TILES;
            if (distance > barrageRadius) return;
            const ratio = 1 - Math.min(1, distance / barrageRadius) * 0.5;
            const shotMultiplier = DAMAGE_MULTIPLIERS[uDef.specType][monster.category] *
              getSpecSynergyDamageMultiplier(uDef.specType, monster.category, synergy);
            dealDamage(monster, Math.max(1, Math.round(baseDmg * shotMultiplier * ratio)), unit.id);
          });
          unit.activeSkillCooldownMs = SHOTGUN_BARRAGE_COOLDOWN_MS;
          unit.skillEffectUntilMs = gameNow + 520;
          continue;
        }

        // 유닛별 투사체 이펙트 및 발사 개수 분기
        if (unit.typeId === "dual_swordsman") {
          const appliesBleed = unit.tier >= 2 && Math.random() < (
            unit.tier >= 3 ? TIER3_DUAL_BLEED_CHANCE : DUAL_BLEED_CHANCE
          );
          // 쌍검사: 두 타격의 합이 최종 피해량과 같도록 분배
          const firstHitDamage = Math.ceil(calculatedDamage / 2);
          const secondHitDamage = Math.floor(calculatedDamage / 2);
          projectilesRef.current.push({
            id: nextProjectile.current++,
            sourceUnitId: unit.id,
            sourceTypeId: unit.typeId,
            fromCell: unit.cell,
            targetId: target.id,
            damage: firstHitDamage,
            baseDamage: penalizedBaseDmg,
            specType: uDef.specType,
            rangeTiles,
            progress: 0,
            delayMs: 180,
            durationMs: 140,
            effectType: "normal",
            appliesBleed,
          });
          projectilesRef.current.push({
            id: nextProjectile.current++,
            sourceUnitId: unit.id,
            sourceTypeId: unit.typeId,
            fromCell: unit.cell,
            targetId: target.id,
            damage: secondHitDamage,
            baseDamage: penalizedBaseDmg,
            specType: uDef.specType,
            rangeTiles,
            progress: 0,
            delayMs: 180,
            durationMs: 200,
            effectType: "normal",
          });
        } else {
          let effectType: Projectile["effectType"] = "normal";

          if (
            unit.typeId === "fire_mage" &&
            Math.random() < FIRE_AREA_CHANCE + MAGE_STATUS_CHANCE_BONUS[synergy.classTiers.mage]
          ) {
            effectType = "fire";
          } else if (unit.typeId === "magic_swordsman") {
            effectType = "magic_swordsman";
          } else if (
            unit.typeId === "ice_mage" &&
            Math.random() < ICE_SLOW_CHANCE + MAGE_STATUS_CHANCE_BONUS[synergy.classTiers.mage]
          ) {
            effectType = "ice";
          } else if (
            unit.typeId === "lightning_mage" &&
            Math.random() < LIGHTNING_PARALYZE_CHANCE + MAGE_STATUS_CHANCE_BONUS[synergy.classTiers.mage]
          ) {
            effectType = "lightning";
          } else if (unit.typeId === "shotgunner") {
            effectType = "shotgun"; // 산탄 범위
          } else if (unit.typeId === "sniper" && Math.random() < SNIPER_EXECUTE_CHANCE) {
            effectType = "sniper";
          }

          projectilesRef.current.push({
            id: nextProjectile.current++,
            sourceUnitId: unit.id,
            sourceTypeId: unit.typeId,
            fromCell: unit.cell,
            targetId: target.id,
            damage: calculatedDamage,
            baseDamage: penalizedBaseDmg,
            specType: uDef.specType,
            rangeTiles,
            progress: 0,
            delayMs: 180,
            durationMs: 180,
            effectType,
            skillAttack: swordsmanCombo,
            swordsmanWave,
          });
          if (unit.tier >= 3 && unit.typeId === "shotgunner") {
            unit.shotgunAttackCount = (unit.shotgunAttackCount ?? 0) + 1;
            if (unit.shotgunAttackCount >= 3) {
              unit.shotgunAttackCount = 0;
              const [shotgunTargetRow, shotgunTargetCol] = getMonsterPos(target);
              unit.tier3RangerEffectUntilMs = gameNow + 520;
              unit.tier3RangerEffectKind = "shotgunner";
              unit.tier3RangerEffectRow = undefined;
              unit.tier3RangerEffectCol = undefined;
              unit.tier3RangerEffectAngleDeg = Math.atan2(
                shotgunTargetRow - unitRow,
                shotgunTargetCol - unitCol,
              ) * 180 / Math.PI;
              projectilesRef.current.push({
                id: nextProjectile.current++,
                sourceUnitId: unit.id,
                sourceTypeId: unit.typeId,
                fromCell: unit.cell,
                targetId: target.id,
                damage: Math.max(1, Math.round(calculatedDamage * 0.8)),
                baseDamage: penalizedBaseDmg,
                specType: uDef.specType,
                rangeTiles,
                progress: 0,
                delayMs: 290,
                durationMs: 180,
                effectType: "shotgun",
                shotgunDoubleBarrel: true,
              });
            }
          }
        }
      }

      // 5. State 일괄 갱신
      setMonsters([...monstersRef.current]);
      setProjectiles([...projectilesRef.current]);
      setTier3FirePillars([...tier3FirePillarsRef.current]);

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [running, paused, gameSpeed, path, start, toSpawn, upgrades, synergy, wave]);

  // 제한시간 종료 또는 몬스터 소멸 시 웨이브 완료 체크
  useEffect(() => {
    if (!running) return;

    if (life <= 0) {
      setRunning(false);
      projectilesRef.current = [];
    tier3FirePillarsRef.current = [];
      setProjectiles([]);
      setGameResult("lost");
      setStatus("💀 생명력 0 이하! 게임 오버");
      addLog("라이프가 0이 되어 게임이 종료되었습니다.");
      return;
    }

    const allSpawned = toSpawn === 0;
    const allCleared = monsters.length === 0;
    const timeExpired = waveTimeRemainingSec <= 0;

    if (allSpawned && (allCleared || timeExpired)) {
      setRunning(false);
      projectilesRef.current = [];
    tier3FirePillarsRef.current = [];
      setProjectiles([]);
      const restedUnits = unitsRef.current.map((unit) => ({
        ...unit,
        cooldownMs: 0,
        targetId: null,
        lastAttackTimeMs: undefined,
        stunnedUntilMs: undefined,
        activeSkillCooldownMs: undefined,
        skillEffectUntilMs: undefined,
        tier3RangerEffectUntilMs: undefined,
        tier3RangerEffectKind: undefined,
        tier3RangerEffectRow: undefined,
        tier3RangerEffectCol: undefined,
        tier3RangerEffectAngleDeg: undefined,
        adrenalinePhase: undefined,
        adrenalinePhaseUntilMs: undefined,
        frozenOrbCell: undefined,
        frozenOrbPathPosition: undefined,
        frozenOrbTrailCells: undefined,
        frozenOrbUntilMs: undefined,
        frozenOrbNextTickMs: undefined,
        frozenOrbExplosionCell: undefined,
        frozenOrbExplosionUntilMs: undefined,
        heavenlyJudgmentNextAtMs: undefined,
        swordsmanAttackCount: 0,
        shotgunAttackCount: 0,
      }));
      unitsRef.current = restedUnits;
      setUnits(restedUnits);
      setDamageReportWave(wave);
      setWaveDamageReport(waveUnitsRef.current.map((unit) => ({
        unitId: unit.id,
        typeId: unit.typeId,
        tier: unit.tier,
        damage: waveDamageRef.current[unit.id] ?? 0,
      })));

      if (timeExpired && monsters.some((monster) => monster.isBoss)) {
        setGameResult("lost");
        setStatus("💀 제한시간 안에 보스를 처치하지 못해 게임 오버!");
        addLog(`${wave}스테이지 보스를 제한시간 안에 처치하지 못했습니다.`);
        return;
      }

      // 제한시간 초과 시 남아있는 몬스터 수만큼 Life 차감
      if (timeExpired && monsters.length > 0) {
        const remainingCount = monsters.length;
        const remainingLife = Math.max(0, life - remainingCount);
        setLife(remainingLife);
        addLog(`라이프가 ${remainingCount} 감소했습니다. (${remainingLife}/${START_LIFE})`);
        if (remainingLife === 0) {
          setGameResult("lost");
          setStatus(
            `💀 제한시간 종료! 남아있는 몬스터 ${remainingCount}마리로 Life가 0이 되어 게임 오버!`,
          );
          return;
        }
        setStatus(
          `⏱️ 제한시간 종료! 남아있는 몬스터 ${remainingCount}마리로 인해 Life -${remainingCount}`,
        );
      }

      const clearGold = isBossWave(wave)
        ? getBossClearGold(wave)
        : monsters.length > 0
          ? WAVE_TIMEOUT_GOLD
          : WAVE_CLEAR_GOLD;
      setGold((g) => g + clearGold);
      addLog(`${wave}스테이지가 종료되었습니다. 보상 ${clearGold}골드를 획득했습니다.`);

      if (wave >= PROTOTYPE_WAVES) {
        setGameResult("won");
        setStatus("🎉 FINAL BOSS를 처치했습니다! 게임 클리어!");
        addLog("FINAL STAGE를 클리어해 게임을 완료했습니다.");
      } else {
        const nextWave = wave + 1;
        setWave(nextWave);
        setShowStageBossInfo(false);
        waveTimeRemainingMs.current = getWaveTimeLimit(nextWave) * 1000;
        setWaveTimeRemainingSec(getWaveTimeLimit(nextWave));
        if (isBossWave(nextWave)) triggerBossWarning(nextWave);
      }
    }
  }, [monsters.length, toSpawn, running, life, wave, waveTimeRemainingSec]);

  const renderCellMenu = (cellIndex: number) => {
    const cell = grid[cellIndex];
    const unit = units.find((item) => item.cell === cellIndex);

    if (unit) {
      const comboKey = `${unit.typeId}_${unit.tier}`;
      const canCombine = unit.tier < 3 && combinableKeys.has(comboKey);
      const sellPrice = UNIT_SELL_PRICES[unit.tier as 1 | 2 | 3];
      return (
        <ContextActionMenu actions={{
          top: {
            label: unit.protected ? "보호 해제" : "보호",
            onClick: () => toggleMapUnitProtection(unit.id),
          },
          left: { label: "회수", onClick: () => recallMapUnit(unit.id) },
          right: {
            label: `판매 ${sellPrice}G`,
            disabled: unit.protected,
            onClick: () => sellMapUnit(unit.id),
          },
          bottom: {
            label: "승급",
            disabled: !canCombine,
            onClick: () => {
              handleCombineUnits(unit.typeId, unit.tier, unit.id);
              clearInteraction();
            },
          },
        }} />
      );
    }

    if (cell.type === "empty") {
      return (
        <ContextActionMenu actions={{
          top: {
            label: `벽 ${PLAYER_WALL_COST}G`,
            disabled: gold < PLAYER_WALL_COST || wallCount >= PLAYER_WALL_LIMIT,
            onClick: () => installWall(cellIndex),
          },
        }} />
      );
    }

    const hasStorageUnit = storageSlots.some((slot) => slot !== null);
    const refund = cell.type === "player"
      ? (cell.bornWave === wave
        ? (cell.cost ?? PLAYER_WALL_COST)
        : Math.floor((cell.cost ?? PLAYER_WALL_COST) * PLAYER_WALL_REFUND_RATE))
      : 0;
    const removeLabel = cell.type === "natural"
      ? `제거 ${NATURAL_DESTROY_COST}G`
      : `제거 +${refund}G`;

    return (
      <ContextActionMenu actions={{
        top: {
          label: removeLabel,
          disabled: cell.type === "natural" && gold < NATURAL_DESTROY_COST,
          onClick: () => removeWall(cellIndex),
        },
        left: {
          label: "유닛 배치",
          disabled: !hasStorageUnit || units.length >= unitDeployLimit,
          onClick: () => {
            setMapPlacementTarget(cellIndex);
            setActiveCellIndex(null);
            setSelectedUnitId(null);
            setSelectedStorageIndex(null);
            setHighlightMapPlacement(false);
            setStatus("📦 배치할 창고 유닛을 선택해줘.");
          },
        },
      }} />
    );
  };

  const renderSlotMenu = (index: number) => {
    const unit = storageSlots[index];
    if (!unit) return null;
    const comboKey = `${unit.typeId}_${unit.tier}`;
    const canCombine = unit.tier < 3 && combinableKeys.has(comboKey);
    const sellPrice = UNIT_SELL_PRICES[unit.tier as 1 | 2 | 3];
    return (
      <ContextActionMenu actions={{
        top: {
          label: "유닛 배치",
          disabled: units.length >= unitDeployLimit,
          onClick: () => {
            setSelectedStorageIndex(index);
            setSelectedUnitId(null);
            setActiveStorageIndex(null);
            setHighlightMapPlacement(true);
            setStatus("✨ 금색으로 표시된 맵 칸을 선택해줘.");
          },
        },
        left: {
          label: "승급",
          disabled: !canCombine,
          onClick: () => {
            handleCombineUnits(unit.typeId, unit.tier);
            clearInteraction();
          },
        },
        right: {
          label: `판매 ${sellPrice}G`,
          onClick: () => {
            handleSellStorageUnit(index);
            clearInteraction();
          },
        },
      }} />
    );
  };

  return (
    <main className={`gamePage ${ultimateSequence ? `ultimateSequenceActive ultimate-${ultimateSequence.phase} ultimate-${ultimateSequence.job.unitClass}` : ""}`}>
      {debugCodePromptOpen && (
        <div className="confirmOverlay" role="presentation">
          <form
            className="confirmDialog debugAccessDialog"
            onSubmit={(event) => { event.preventDefault(); submitDebugCode(); }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setDebugCodePromptOpen(false);
                setDebugCodeError(false);
              }
            }}
          >
            <strong>디버그 모드 인증</strong>
            <p>디버그 모드를 활성화하려면 접근 번호를 입력하세요.</p>
            <input
              className="debugAccessInput"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              value={debugCodeInput}
              onChange={(event) => {
                setDebugCodeInput(event.target.value.replace(/\D/g, "").slice(0, 4));
                setDebugCodeError(false);
              }}
              aria-label="디버그 접근 번호"
              autoFocus
            />
            {debugCodeError && <span className="debugAccessError">접근 번호가 올바르지 않습니다.</span>}
            <div className="confirmActions">
              <button type="button" onClick={() => { setDebugCodePromptOpen(false); setDebugCodeError(false); }}>취소</button>
              <button type="submit">확인</button>
            </div>
          </form>
        </div>
      )}
      {debugMode && (
        <DebugPanel
          brush={debugBrush}
          onBrushChange={setDebugBrush}
          onClearMap={handleDebugClearMap}
          onSetGold={(value) => setGold(Math.max(0, Math.floor(value || 0)))}
          onSetPlayerLevel={(value) => { setPlayerLevel(Math.min(MAX_PLAYER_LEVEL, Math.max(1, Math.floor(value || 1)))); setPlayerXp(0); }}
          onAddUnit={handleDebugAddUnit}
          onApplyStage={handleDebugApplyStage}
          onSpawnStage={handleDebugSpawnStage}
          onStartCustomWave={handleDebugStartCustomWave}
          onClearMonsters={handleDebugClearMonsters}
          onSetTimer={handleDebugSetTimer}
          onPreviewUltimate={handleDebugPreviewUltimate}
          onClose={() => { setDebugMode(false); setDebugBrush(null); }}
        />
      )}
      <div className="gameLayout">
        <aside className="leftRail">
          <section className="brandPanel panelBox">
            <div className="brandLogo" role="img" aria-label="Rogue Path Defense" />
          </section>
          <SynergyHud synergy={synergy} />
          <a
            className="scsReturnButton"
            href="https://scspace.duckdns.org/"
            aria-label="SCS로 돌아가기"
            title="SCS로 돌아가기"
          >
            <span className="scsReturnMark" aria-hidden="true">
              <img src={SCS_LOGO} alt="" />
            </span>
            <span className="scsReturnText">SCS로 돌아가기</span>
          </a>
          <GameLog entries={gameLogs} />
        </aside>

        <section className="centerStage">
          <header className="topHud panelBox">
            <div className="stageSummary topStage">
              <strong className={isFinalStage(wave) ? "finalStageTitle" : ""}>
                {isFinalStage(wave) ? "FINAL STAGE" : `${isBossWave(wave) ? "BOSS " : ""}STAGE ${wave}`}
              </strong>
            </div>
            {isBossWave(wave) && (
              <div className="bossInfoSlot">
                <button
                  type="button"
                  className={`bossInfoButton ${showStageBossInfo ? "active" : ""}`}
                  onClick={() => {
                    setShowStageBossInfo((current) => !current);
                    setSelectedBossId(null);
                    setSelectedUnitId(null);
                    setSelectedStorageIndex(null);
                  }}
                >보스 설명 보기</button>
              </div>
            )}
            <div className={`waveTimer ${running && waveTimeRemainingSec <= 10 ? "danger" : ""}`}>
              <span>TIME</span>
              <strong>{running ? waveTimeRemainingSec : waveTimeLimit}</strong>
            </div>
            <div className="lapSummary">
              <span>최고 바퀴 수</span>
              <strong className={highestMonsterLaps >= MAX_MONSTER_LAPS ? "allDanger" : ""}>
                <em className={highestMonsterLaps >= 4 ? "danger" : ""}>{highestMonsterLaps}</em>/{MAX_MONSTER_LAPS}
              </strong>
            </div>
            <div className="topWaveSummary">
              <div><strong>현재 웨이브 정보</strong><span>남은 몹 {remainingMonsterCount}/{waveMonsterTotal}</span></div>
              <p>👨 {wavePercent(waveComposition.human)}%　🐺 {wavePercent(waveComposition.land)}%　🦅 {wavePercent(waveComposition.flying)}%</p>
            </div>
          </header>

          <GameBoard
            grid={grid}
            start={start}
            goal={goal}
            path={path}
            pathVisible={pathVisible}
            units={units}
            monsters={monsters}
            selectedUnitId={selectedUnitId}
            selectedBossId={selectedBossId}
            rangerRangeBonusTiles={RANGER_RANGE_BONUS_TILES[synergy.classTiers.ranger]}
            warriorAttackSpeedBonus={WARRIOR_ATTACK_SPEED_BONUS[synergy.classTiers.warrior]}
            upgrades={upgrades}
            onCellClick={onCellClick}
            onBossClick={handleBossClick}
            projectiles={projectiles}
            tier3FirePillars={tier3FirePillars}
            gameNowMs={gameTimeMs.current}
            animationPaused={!running || paused || ultimateSequence !== null}
            animationSpeed={gameSpeed}
            boardShaking={gameTimeMs.current < boardShakeUntilMs.current}
            bossWarning={bossWarning}
            activeCellIndex={activeCellIndex}
            highlightedPlacementCells={highlightMapPlacement}
            renderCellMenu={renderCellMenu}
            ultimateOverlay={ultimateSequence ? (
              <UltimateCutIn
                key={`${ultimateSequence.token}-${ultimateSequence.phase}`}
                unitClass={ultimateSequence.job.unitClass}
                unitTypeIds={ultimateSequence.job.unitTypeIds}
                phase={ultimateSequence.phase}
              />
            ) : null}
          />

          <UpgradeStrip upgrades={upgrades} />
          <div className="centerWorkspace">
            {bossDetailTarget ? (
              <BossDetailPanel boss={bossDetailTarget} gameNowMs={gameTimeMs.current} />
            ) : (
              <UnitDetailPanel unit={selectedDetailUnit} upgrades={upgrades} synergy={synergy} emptyMessage={status} />
            )}
            <StorageBoard
              slots={storageSlots}
              selectedIndex={selectedStorageIndex}
              running={running}
              onSelectSlot={handleSelectStorageSlot}
              combinableKeys={combinableKeys}
              activeIndex={activeStorageIndex}
              placementSelectionActive={mapPlacementTarget !== null}
              renderSlotMenu={renderSlotMenu}
              upgrades={upgrades}
              warriorAttackSpeedBonus={WARRIOR_ATTACK_SPEED_BONUS[synergy.classTiers.warrior]}
              rangerRangeBonusTiles={RANGER_RANGE_BONUS_TILES[synergy.classTiers.ranger]}
            />
          </div>
        </section>

        <aside className="rightRail">
          <DamageReport wave={damageReportWave} entries={waveDamageReport} />
          <section className="playerResourcePanel panelBox">
            <div className="playerLevelRow">
              <strong>LV. {playerLevel}</strong>
              <span>{playerLevel >= MAX_PLAYER_LEVEL ? "최고 레벨" : `EXP ${playerXp}/${requiredPlayerXp}`}</span>
            </div>
            <div className="xpTrack"><span style={{ width: `${playerXpPercent}%` }} /></div>
            <div className="resourceRow">
              <span>❤️ LIFE <b>{life}/{START_LIFE}</b></span>
              <span>💰 GOLD <b>{gold}</b></span>
            </div>
            <div className="capacityRow">
              <span>⚔️ 배치 <b>{units.length}/{unitDeployLimit}</b></span>
              <span>🧱 벽 <b>{wallCount}/{PLAYER_WALL_LIMIT}</b></span>
            </div>
          </section>
          <CommandPanel
            gold={gold}
            running={running}
            gameEnded={gameResult !== "playing"}
            storageFull={storageSlots.every((slot) => slot !== null)}
            playerLevel={playerLevel}
            pathVisible={pathVisible}
            gameSpeed={gameSpeed}
            paused={paused}
            onBuyUnit={handleBuyShopUnit}
            onBuyUpgrade={handleBuyUpgrade}
            onBuyXp={handleBuyXp}
            onTogglePath={() => setPathVisible((visible) => !visible)}
            onToggleSpeed={() => setGameSpeed((speed) => speed === 1 ? 2 : 1)}
            onTogglePause={togglePause}
            onStartWave={startWave}
            onNewMap={resetMap}
            debugMode={debugMode}
            finalStage={isFinalStage(wave)}
            onToggleDebug={handleToggleDebug}
          />
        </aside>
      </div>
    </main>
  );
}


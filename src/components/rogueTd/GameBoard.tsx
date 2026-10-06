import type {
  CellData,
  Monster,
  MonsterCategory,
  Projectile,
  Unit,
} from "../../games/rogueTd/types";
import {
  COLS,
  ROWS,
  STAGE05_ABSORB_CAST_MS,
  STAGE05_SUMMON_CAST_MS,
  STAGE10_STOMP_RADIUS_TILES,
  STAGE10_STOMP_WARNING_MS,
  STAGE20_SHIELD_CAST_MS,
  STAGE25_REFORGE_CAST_MS,
  STAGE30_MAGNETIC_RADIUS_TILES,
  STAGE30_TELEPORT_CAST_MS,
  UNIT_TYPES,
} from "../../games/rogueTd/constants";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import type { DamageUpgrade } from "../../games/rogueTd/upgrades";
import { getUpgradeLevels } from "../../games/rogueTd/upgrades";
import { UNIT_EFFECT_CLASSES, UNIT_SPRITE_CLASSES } from "../../games/rogueTd/unitSprites";
import UnitTooltip from "./UnitTooltip";

const START_POINT_IMAGE = new URL("../../images/start-point.png", import.meta.url).href;
const END_POINT_IMAGE = new URL("../../images/end-point.png", import.meta.url).href;
const NATURAL_WALL_IMAGE = new URL("../../images/natural-wall.png", import.meta.url).href;
const PERMANENT_WALL_IMAGE = new URL("../../images/permanent-wall.png", import.meta.url).href;
const PLAYER_WALL_IMAGE = new URL("../../images/player-wall.png", import.meta.url).href;
const ROAD_GRASS_IMAGE = new URL("../../images/road-grass.png", import.meta.url).href;
const ROAD_STRAIGHT_IMAGE = new URL("../../images/road-straight.png", import.meta.url).href;
const ROAD_CORNER_IMAGE = new URL("../../images/road-corner.png", import.meta.url).href;
const ROAD_THREEWAY_IMAGE = new URL("../../images/road-threeway.png", import.meta.url).href;
const ROAD_FOURWAY_IMAGE = new URL("../../images/road-fourway.png", import.meta.url).href;

function getRoadTile(cellIndex: number, pathCells: Set<number>) {
  if (!pathCells.has(cellIndex)) return { src: ROAD_GRASS_IMAGE, rotation: 0 };

  const row = Math.floor(cellIndex / COLS);
  const col = cellIndex % COLS;
  const up = row > 0 && pathCells.has(cellIndex - COLS);
  const right = col < COLS - 1 && pathCells.has(cellIndex + 1);
  const down = row < ROWS - 1 && pathCells.has(cellIndex + COLS);
  const left = col > 0 && pathCells.has(cellIndex - 1);
  const count = Number(up) + Number(right) + Number(down) + Number(left);

  if (count === 4) return { src: ROAD_FOURWAY_IMAGE, rotation: 0 };
  if (count === 3) {
    const rotation = !up ? 0 : !right ? 90 : !down ? 180 : 270;
    return { src: ROAD_THREEWAY_IMAGE, rotation };
  }
  if (count === 2) {
    if (up && down) return { src: ROAD_STRAIGHT_IMAGE, rotation: 0 };
    if (left && right) return { src: ROAD_STRAIGHT_IMAGE, rotation: 90 };
    const rotation = up && left ? 0 : up && right ? 90 : right && down ? 180 : 270;
    return { src: ROAD_CORNER_IMAGE, rotation };
  }
  if (count === 1) {
    return { src: ROAD_STRAIGHT_IMAGE, rotation: left || right ? 90 : 0 };
  }
  return { src: ROAD_GRASS_IMAGE, rotation: 0 };
}

interface Props {
  grid: CellData[];
  start: number;
  goal: number;
  path: number[];
  pathVisible: boolean;
  units: Unit[];
  monsters: Monster[];
  selectedUnitId: number | null;
  selectedBossId: number | null;
  rangerRangeBonusTiles: number;
  warriorAttackSpeedBonus: number;
  upgrades: DamageUpgrade[];
  onCellClick: (i: number) => void;
  onBossClick: (monsterId: number) => void;
  projectiles: Projectile[];
  gameNowMs: number;
  animationPaused: boolean;
  animationSpeed: 1 | 2;
  boardShaking: boolean;
  bossWarning: { stage: number; token: number } | null;
  activeCellIndex: number | null;
  highlightedPlacementCells: boolean;
  renderCellMenu: (cellIndex: number) => ReactNode;
}

interface FinalBossBolt {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  duration: number;
}

function FinalBossLightning({ paused, speed }: { paused: boolean; speed: 1 | 2 }) {
  const [bolts, setBolts] = useState<FinalBossBolt[]>([]);

  useEffect(() => {
    if (paused) {
      setBolts([]);
      return;
    }

    setBolts([]);
    let cancelled = false;
    let nextId = 0;
    const timers = new Set<number>();

    const schedule = () => {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        if (cancelled) return;

        const count = Math.random() < 0.42 ? 2 + Math.floor(Math.random() * 2) : 1;
        const created = Array.from({ length: count }, () => {
          const sizeTier = Math.floor(Math.random() * 3);
          const size = sizeTier === 0
            ? { width: 14 + Math.random() * 3, height: 28 + Math.random() * 6 }
            : sizeTier === 1
              ? { width: 20 + Math.random() * 4, height: 40 + Math.random() * 8 }
              : { width: 27 + Math.random() * 5, height: 54 + Math.random() * 10 };
          const availableX = 56 - size.width / 2;
          const availableY = 56 - size.height / 2;
          return {
            id: nextId++,
            x: (Math.random() * 2 - 1) * availableX,
            y: (Math.random() * 2 - 1) * availableY,
            width: size.width,
            height: size.height,
            rotation: -24 + Math.random() * 48,
            duration: (253 + Math.random() * 180) / speed,
          };
        });

        setBolts((current) => [...current, ...created]);
        created.forEach((bolt) => {
          const removeTimer = window.setTimeout(() => {
            timers.delete(removeTimer);
            setBolts((current) => current.filter((item) => item.id !== bolt.id));
          }, bolt.duration + 80);
          timers.add(removeTimer);
        });
        schedule();
      }, (200 + Math.random() * 467) / speed);
      timers.add(timer);
    };

    schedule();
    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [paused, speed]);

  return bolts.map((bolt) => (
    <span
      key={bolt.id}
      className="finalBossArcSpark"
      style={{
        left: `calc(50% + ${bolt.x}px)`,
        top: `calc(50% - 28px + ${bolt.y}px)`,
        width: `${bolt.width}px`,
        height: `${bolt.height}px`,
        animationDuration: `${bolt.duration}ms`,
        "--arc-r": `${bolt.rotation}deg`,
      } as CSSProperties}
      aria-hidden="true"
    />
  ));
}

const MONSTER_SPRITE_CLASSES: Record<MonsterCategory, string> = {
  human: "enemyHumanSprite",
  land: "enemyLandSprite",
  flying: "enemyFlySprite",
};
const BOSS_SPRITE_CLASSES: Partial<Record<number, string>> = {
  5: "bossStage05Sprite",
  10: "bossStage10Sprite",
  15: "bossStage15Sprite",
  20: "bossStage20Sprite",
  25: "bossStage25Sprite",
  30: "bossStage30Sprite",
};
const FINAL_BOSS_SPRITE_CLASSES: Record<1 | 2 | 3 | 4, string> = {
  1: "finalBossPhase1Sprite",
  2: "finalBossPhase2Sprite",
  3: "finalBossPhase3Sprite",
  4: "finalBossPhase4Sprite",
};
const BOSS_NAMES: Record<MonsterCategory, string> = {
  human: "밸런스형",
  land: "육지형",
  flying: "조류형",
};

export default function GameBoard(p: Props) {
  const [pathPulseStart, setPathPulseStart] = useState(0);
  const visiblePath = p.path.slice(1, -1);
  const pathCells = new Set(p.path);
  const pathIndexByCell = new Map(visiblePath.map((cellIndex, index) => [cellIndex, index]));
  const unitByCell = new Map(p.units.map((u) => [u.cell, u]));
  const selectedUnit = p.units.find((u) => u.id === p.selectedUnitId) ?? null;
  const selectedUnitRange = selectedUnit
    ? selectedUnit.rangeTiles + (UNIT_TYPES[selectedUnit.typeId].unitClass === "ranger"
      ? p.rangerRangeBonusTiles
      : 0)
    : 0;
  const now = p.gameNowMs;
  const finalBoss = p.monsters.find((monster) => monster.isFinalBoss);
  const finalBossMode = finalBoss?.finalBossMode;
  const drainedPhase = finalBossMode === "absorbing"
    ? finalBoss?.finalBossTargetPhase
    : finalBossMode === "flash" && finalBoss?.finalBossFlashNext === "combat"
      ? finalBoss?.finalBossTargetPhase
    : finalBossMode === "combat"
      ? finalBoss?.finalBossPhase
      : undefined;
  const isUnitLightDrained = (unit: Unit) => {
    if (drainedPhase === undefined) return false;
    const specType = UNIT_TYPES[unit.typeId].specType;
    return drainedPhase === 4 ||
      (drainedPhase === 1 && specType === "balance") ||
      (drainedPhase === 2 && specType === "land_spec") ||
      (drainedPhase === 3 && specType === "air_spec");
  };
  const stage25WarningCells = new Set(
    p.monsters.flatMap((monster) =>
      monster.bossStage === 25 &&
      monster.stage25CastEndsAtMs !== undefined &&
      now < monster.stage25CastEndsAtMs
        ? monster.stage25TargetCells ?? []
        : [],
    ),
  );
  const getMonsterBoardPosition = (monster: Monster) => {
    const monsterRoute = monster.route ?? p.path;
    const from = monsterRoute[Math.min(monster.pathStep, monsterRoute.length - 1)] ?? p.start;
    const to = monsterRoute[Math.min(monster.pathStep + 1, monsterRoute.length - 1)] ?? from;
    const fromRow = Math.floor(from / COLS);
    const fromCol = from % COLS;
    const toRow = Math.floor(to / COLS);
    const toCol = to % COLS;
    return {
      x: ((fromCol + (toCol - fromCol) * monster.progress + 0.5) / COLS) * 100,
      y: ((fromRow + (toRow - fromRow) * monster.progress + 0.5) / ROWS) * 100,
    };
  };
  const finalBossPosition = finalBoss
    ? getMonsterBoardPosition(finalBoss)
    : { x: 50, y: 50 };

  useEffect(() => {
    setPathPulseStart(0);
    if (!p.pathVisible || visiblePath.length === 0) return;
    const interval = window.setInterval(() => {
      setPathPulseStart((start) => (start + 1) % (visiblePath.length + 2));
    }, 150);
    return () => window.clearInterval(interval);
  }, [p.path, p.pathVisible, visiblePath.length]);

  return (
    <div className="boardShell">
      <div
        className={`board ${p.boardShaking ? "stompShaking" : ""} ${finalBossMode === "flash" ? "finalBossTransitionFlash" : ""} ${finalBossMode === "absorbing" ? "finalBossAbsorbing" : ""} ${finalBossMode === "releasing" ? "finalBossReleasing" : ""} ${finalBossMode === "combat" || (finalBossMode === "flash" && finalBoss?.finalBossFlashNext === "combat") ? "finalBossDimmed" : ""}`}
        style={{
          gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
          aspectRatio: `${COLS} / ${ROWS}`,
          animationDuration: `${450 / p.animationSpeed}ms`,
          animationPlayState: p.animationPaused ? "paused" : "running",
          "--final-boss-x": `${finalBossPosition.x}%`,
          "--final-boss-y": `${finalBossPosition.y}%`,
        } as CSSProperties}
      >
        {p.bossWarning && (
          <div key={p.bossWarning.token} className="bossStageWarning" role="status" aria-live="assertive">
            <span className="bossWarningTriangle" aria-hidden="true"><i>!</i></span>
            <strong>WARNING!</strong>
            <em>{p.bossWarning.stage === 36 ? "FINAL BOSS APPROACHING" : `BOSS STAGE ${p.bossWarning.stage}`}</em>
          </div>
        )}
        {p.grid.map((cell, i) => {
          const u = unitByCell.get(i);
          const roadTile = getRoadTile(i, pathCells);
          const pathIndex = pathIndexByCell.get(i);
          const pathPulseOrder = pathIndex === undefined ? -1 : pathIndex - pathPulseStart;
          const showPathPulse = p.pathVisible && pathPulseOrder >= 0 && pathPulseOrder < 3;
          const spriteClass = u ? UNIT_SPRITE_CLASSES[u.typeId] : null;
          const attackAge = u?.lastAttackTimeMs === undefined
            ? Number.POSITIVE_INFINITY
            : now - u.lastAttackTimeMs;
          const isStunned = Boolean(
            u?.stunnedUntilMs && now < u.stunnedUntilMs,
          );
          const classes = ["cell", cell.type];
          if (i === p.start) classes.push("start");
          if (i === p.goal) classes.push("goal");
          if (showPathPulse)
            classes.push("path");
          if (u?.id === p.selectedUnitId) classes.push("selectedUnit");
          if (u) classes.push("unitOccupied");
          if (u && isUnitLightDrained(u)) classes.push("lightDrainedUnit");
          if (i === p.activeCellIndex) classes.push("menuOpen");
          if (
            p.highlightedPlacementCells &&
            (cell.type === "natural" || cell.type === "player") &&
            !u
          ) classes.push("placementCandidate");
          return (
            <div
              key={i}
              className={classes.join(" ")}
              role="button"
              tabIndex={0}
              onClick={() => p.onCellClick(i)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") p.onCellClick(i);
              }}
            >
              <img
                className="terrainTile"
                src={roadTile.src}
                alt=""
                style={{ transform: `rotate(${roadTile.rotation}deg) scale(1.02)` }}
                aria-hidden="true"
              />
              {cell.type === "natural" && (
                <img className={`wallTileImage structureTile naturalStructure ${u ? "occupiedStructure" : ""}`} src={NATURAL_WALL_IMAGE} alt="자연 진지" />
              )}
              {cell.type === "permanent" && (
                <img className={`wallTileImage structureTile permanentStructure ${u ? "occupiedStructure" : ""}`} src={PERMANENT_WALL_IMAGE} alt="영구 진지" />
              )}
              {cell.type === "player" && (
                <img className={`wallTileImage structureTile playerStructure ${u ? "occupiedStructure" : ""}`} src={PLAYER_WALL_IMAGE} alt="설치 진지" />
              )}
              {showPathPulse && (
                <span
                  className={`pathMarker pathMarker-${pathPulseOrder + 1}`}
                  aria-hidden="true"
                />
              )}
              {stage25WarningCells.has(i) && (
                <span className="stage25CellWarning" aria-hidden="true" />
              )}

              {!u && (
                <span className="cellContent">
                  {i === p.start
                    ? <img className="endpointMarker" src={START_POINT_IMAGE} alt="시작점" />
                    : i === p.goal
                      ? <img className="endpointMarker" src={END_POINT_IMAGE} alt="도착점" />
                      : ""}
                </span>
              )}

              {u && (
                <div className={`unitWrapper ${isStunned ? "stunned" : ""}`} key={u.id}>
                  {u.tier >= 2 && (
                    <span
                      className={`unitTierTwoAura ${u.tier === 3 ? "tierThreeBase" : ""}`}
                      style={{
                        "--unit-tier-color": UNIT_TYPES[u.typeId].color,
                        "--unit-tier-duration": `${1450 / p.animationSpeed}ms`,
                        "--unit-spike-duration": `${920 / p.animationSpeed}ms`,
                        animationPlayState: p.animationPaused ? "paused" : "running",
                      } as CSSProperties}
                      aria-hidden="true"
                    >
                      {Array.from({ length: 8 }, (_, spikeIndex) => (
                        <i key={spikeIndex} />
                      ))}
                    </span>
                  )}
                  {u.tier === 3 && (
                    <span
                      className="unitTierThreeOrbit"
                      style={{
                        "--unit-orbit-color": UNIT_TYPES[u.typeId].color,
                        "--unit-orbit-duration": `${2600 / p.animationSpeed}ms`,
                        "--unit-orbit-pulse-duration": `${780 / p.animationSpeed}ms`,
                        animationPlayState: p.animationPaused ? "paused" : "running",
                      } as CSSProperties}
                      aria-hidden="true"
                    >
                      {Array.from({ length: 8 }, (_, shardIndex) => (
                        <i key={shardIndex} />
                      ))}
                    </span>
                  )}
                  {spriteClass ? (
                    <span
                      className={`unit ${spriteClass} ${u.facing === "left" ? "facingLeft" : ""} ${!isStunned && attackAge >= 0 && attackAge < 360 ? "attacking" : ""}`}
                      role="img"
                      aria-label={UNIT_TYPES[u.typeId].name}
                    />
                  ) : (
                    <span
                      className="unit"
                      style={{ color: UNIT_TYPES[u.typeId]?.color }}
                    >
                      {UNIT_TYPES[u.typeId]?.icon ?? "⚔️"}
                    </span>
                  )}
                  {isStunned && (
                    <span
                      className="unitStunStars"
                      style={{
                        animationDuration: `${850 / p.animationSpeed}ms`,
                        animationPlayState: p.animationPaused ? "paused" : "running",
                      }}
                      aria-label="기절"
                    >
                      <i>★</i><i>★</i><i>★</i>
                    </span>
                  )}
                  {u.protected && (
                    <span className="unitProtectionBadge" aria-label="판매 보호 중" title="판매 보호 중" />
                  )}
                  <UnitTooltip
                    typeId={u.typeId}
                    tier={u.tier}
                    upgradeLevels={getUpgradeLevels(p.upgrades, u.typeId)}
                    warriorAttackSpeedBonus={p.warriorAttackSpeedBonus}
                    rangerRangeBonusTiles={p.rangerRangeBonusTiles}
                  />
                </div>
              )}
              {i === p.activeCellIndex && p.renderCellMenu(i)}
            </div>
          );
        })}

        {selectedUnit && (
          <span
            className="unitRange"
            style={{
              left: `${(((selectedUnit.cell % COLS) + 0.5) / COLS) * 100}%`,
              top: `${((Math.floor(selectedUnit.cell / COLS) + 0.5) / ROWS) * 100}%`,
              width: `${(selectedUnitRange * 2 * 100) / COLS}%`,
            }}
          />
        )}

        {p.monsters
          .filter(
            (monster) =>
              monster.bossStage === 10 &&
              monster.stage10StompImpactAtMs !== undefined &&
              now < monster.stage10StompImpactAtMs,
          )
          .map((boss) => {
            const position = getMonsterBoardPosition(boss);
            return (
              <span
                key={`stomp-range-${boss.id}`}
                className="stage10StompTelegraph"
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  width: `${(STAGE10_STOMP_RADIUS_TILES * 2 * 100) / COLS}%`,
                  height: `${(STAGE10_STOMP_RADIUS_TILES * 2 * 100) / ROWS}%`,
                  animationDuration: `${STAGE10_STOMP_WARNING_MS / p.animationSpeed}ms`,
                  animationPlayState: p.animationPaused ? "paused" : "running",
                }}
                aria-hidden="true"
              />
            );
          })}

        {p.monsters.filter((monster) =>
          monster.bossStage === 30 &&
          monster.stage30TeleportEndsAtMs !== undefined &&
          monster.stage30TeleportTargetStep !== undefined &&
          now < monster.stage30TeleportEndsAtMs
        ).map((boss) => {
          const bossRoute = boss.route ?? p.path;
          const targetCell = bossRoute[boss.stage30TeleportTargetStep ?? 0] ?? p.start;
          const row = Math.floor(targetCell / COLS);
          const col = targetCell % COLS;
          return (
            <span
              key={`stage30-teleport-${boss.id}`}
              className="stage30TeleportTarget"
              style={{
                left: `${((col + 0.5) / COLS) * 100}%`,
                top: `${((row + 0.5) / ROWS) * 100}%`,
                width: `${(STAGE30_MAGNETIC_RADIUS_TILES * 2 * 100) / COLS}%`,
                height: `${(STAGE30_MAGNETIC_RADIUS_TILES * 2 * 100) / ROWS}%`,
                animationDuration: `${STAGE30_TELEPORT_CAST_MS / p.animationSpeed}ms`,
                animationPlayState: p.animationPaused ? "paused" : "running",
              }}
              aria-hidden="true"
            />
          );
        })}

        {p.monsters.filter((monster) =>
          monster.bossStage === 30 &&
          monster.stage30MagneticFieldUntilMs !== undefined &&
          monster.stage30MagneticFieldCell !== undefined &&
          now < monster.stage30MagneticFieldUntilMs
        ).map((boss) => {
          const fieldCell = boss.stage30MagneticFieldCell ?? p.start;
          const row = Math.floor(fieldCell / COLS);
          const col = fieldCell % COLS;
          return (
            <span
              key={`stage30-field-${boss.id}`}
              className="stage30MagneticField"
              style={{
                left: `${((col + 0.5) / COLS) * 100}%`,
                top: `${((row + 0.5) / ROWS) * 100}%`,
                width: `${(STAGE30_MAGNETIC_RADIUS_TILES * 2 * 100) / COLS}%`,
                height: `${(STAGE30_MAGNETIC_RADIUS_TILES * 2 * 100) / ROWS}%`,
                animationPlayState: p.animationPaused ? "paused" : "running",
              }}
              aria-hidden="true"
            />
          );
        })}

        {p.projectiles.filter((projectile) => projectile.delayMs <= 0).map((projectile) => {
          const [fromRow, fromCol] = [
            Math.floor(projectile.fromCell / COLS),
            projectile.fromCell % COLS,
          ];

          const startX = ((fromCol + 0.5) / COLS) * 100;
          const startY = ((fromRow + 0.5) / ROWS) * 100;

          const targetMonster = p.monsters.find(
            (m) => m.id === projectile.targetId,
          );

          // 다른 공격으로 목표가 먼저 제거되면 이펙트가 발사 유닛 위치로
          // 되돌아가 남아 보이지 않도록 즉시 숨긴다.
          if (!targetMonster) return null;

          let targetX = startX;
          let targetY = startY;

          const targetRoute = targetMonster.route ?? p.path;
          const a =
            targetRoute[Math.min(targetMonster.pathStep, targetRoute.length - 1)] ??
            p.start;
          const b =
            targetRoute[Math.min(targetMonster.pathStep + 1, targetRoute.length - 1)] ??
            a;
          const ar = Math.floor(a / COLS),
            ac = a % COLS,
            br = Math.floor(b / COLS),
            bc = b % COLS;
          targetX =
            ((ac + (bc - ac) * targetMonster.progress + 0.5) / COLS) * 100;
          targetY =
            ((ar + (br - ar) * targetMonster.progress + 0.5) / ROWS) * 100;

          const currentX = startX + (targetX - startX) * projectile.progress;
          const currentY = startY + (targetY - startY) * projectile.progress;

          const dx = targetX - startX;
          const dy = targetY - startY;
          const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

          if (projectile.sourceTypeId === "lightning_mage") {
            return (
              <span
                key={projectile.id}
                className={`projectile projectileEffect lightningStrike ${UNIT_EFFECT_CLASSES[projectile.sourceTypeId]}`}
                style={{
                  left: `${targetX}%`,
                  top: `${targetY}%`,
                  transform: "translate(-50%, -50%) rotate(90deg) scaleX(1.45)",
                  animationDuration: `${projectile.durationMs}ms`,
                }}
                aria-hidden="true"
              />
            );
          }

          if (projectile.sourceTypeId === "shotgunner") {
            const dxCells = (dx * COLS) / 100;
            const dyCells = (dy * ROWS) / 100;
            const distanceCells = Math.hypot(dxCells, dyCells) || 1;
            const perpendicularCol = -dyCells / distanceCells;
            const perpendicularRow = dxCells / distanceCells;

            return [-2, -1, 0, 1, 2].map((pelletIndex) => {
              const spreadTiles = pelletIndex * 0.22 * projectile.progress;
              const pelletX = currentX + (perpendicularCol * spreadTiles * 100) / COLS;
              const pelletY = currentY + (perpendicularRow * spreadTiles * 100) / ROWS;
              return (
                <span
                  key={`${projectile.id}-${pelletIndex}`}
                  className={`projectile projectileEffect shotgunPellet ${UNIT_EFFECT_CLASSES[projectile.sourceTypeId]}`}
                  style={{
                    left: `${pelletX}%`,
                    top: `${pelletY}%`,
                    opacity: 1 - Math.abs(pelletIndex) * 0.13,
                    transform: `translate(-50%, -50%) rotate(${angleDeg + pelletIndex * 4}deg)`,
                    animationDuration: `${projectile.durationMs}ms`,
                  }}
                  aria-hidden="true"
                />
              );
            });
          }

          return (
            <span
              key={projectile.id}
              className={`projectile projectileEffect projectile-${projectile.sourceTypeId} ${projectile.effectType === "sniper" ? `sniperSpecialProjectile ${targetMonster.isBoss ? "bossSniperProjectile" : "executeSniperProjectile"}` : ""} ${UNIT_EFFECT_CLASSES[projectile.sourceTypeId]}`}
              style={{
                left: `${currentX}%`,
                top: `${currentY}%`,
                transform: `translate(-50%, -50%) rotate(${angleDeg}deg)`,
                animationDuration: `${projectile.durationMs}ms`,
              }}
              aria-hidden="true"
            />
          );
        })}

        {p.monsters
          .filter((monster) => monster.stage05BeingAbsorbed)
          .map((skeleton) => {
            const boss = p.monsters.find(
              (monster) => monster.id === skeleton.summonedByBossId,
            );
            if (!boss) return null;
            const source = getMonsterBoardPosition(skeleton);
            const target = getMonsterBoardPosition(boss);
            return (
              <span
                key={`absorb-wisp-${skeleton.id}`}
                className="stage05AbsorbWisp"
                style={{
                  left: `${source.x}%`,
                  top: `${source.y}%`,
                  "--stage05-absorb-target-x": `${target.x}%`,
                  "--stage05-absorb-target-y": `${target.y}%`,
                  animationDuration: `${STAGE05_ABSORB_CAST_MS / p.animationSpeed}ms`,
                  animationPlayState: p.animationPaused ? "paused" : "running",
                } as CSSProperties}
                aria-hidden="true"
              />
            );
          })}

        {p.monsters.map((m) => {
          const monsterRoute = m.route ?? p.path;
          const a = monsterRoute[Math.min(m.pathStep, monsterRoute.length - 1)] ?? p.start;
          const b = monsterRoute[Math.min(m.pathStep + 1, monsterRoute.length - 1)] ?? a;
          const ar = Math.floor(a / COLS),
            ac = a % COLS,
            br = Math.floor(b / COLS),
            bc = b % COLS;
          const x = ((ac + (bc - ac) * m.progress + 0.5) / COLS) * 100;
          const y = ((ar + (br - ar) * m.progress + 0.5) / ROWS) * 100;
          const moveDirection = br < ar
            ? "up"
            : br > ar
              ? "down"
              : bc < ac
                ? "left"
                : "right";

          const isHit = m.lastHitTime && now - m.lastHitTime < 150;
          const isImmune =
            m.statusImmunityUntilMs && now < m.statusImmunityUntilMs;
          const isSlow = m.slowUntilMs && now < m.slowUntilMs;
          const isParalyzed = m.paralyzeUntilMs && now < m.paralyzeUntilMs;
          const isBurning = m.burnEffectUntilMs && now < m.burnEffectUntilMs;
          const isBossSniperHit = m.sniperImpactUntilMs && now < m.sniperImpactUntilMs;
          const isStage05Summoning =
            m.stage05SummoningUntilMs !== undefined &&
            now < m.stage05SummoningUntilMs;
          const isStage05Absorbing =
            m.stage05AbsorbingUntilMs !== undefined &&
            now < m.stage05AbsorbingUntilMs;
          const isStage10Stomping =
            m.bossStage === 10 &&
            m.stage10StompImpactAtMs !== undefined &&
            now < m.stage10StompImpactAtMs;
          const stage15State = m.stage15State ?? "phoenix";
          const isStage20Charging =
            m.bossStage === 20 && m.stage20State === "charging";
          const isStage20Shielded =
            m.bossStage === 20 &&
            (m.stage20ShieldHp ?? 0) > 0 &&
            (m.stage20State === "shielded" || isStage20Charging);
          const isStage20Stunned =
            m.bossStage === 20 && m.stage20State === "stunned";
          const isStage20ShieldHit =
            isStage20Shielded &&
            m.stage20ShieldHitUntilMs !== undefined &&
            now < m.stage20ShieldHitUntilMs;
          const isStage20ShieldBreaking =
            m.stage20ShieldBreakUntilMs !== undefined &&
            now < m.stage20ShieldBreakUntilMs;
          const isStage25Casting =
            m.bossStage === 25 &&
            m.stage25CastEndsAtMs !== undefined &&
            now < m.stage25CastEndsAtMs;
          const isStage30 = m.bossStage === 30;
          const isStage30Teleporting =
            isStage30 && m.stage30TeleportEndsAtMs !== undefined && now < m.stage30TeleportEndsAtMs;
          const isStage30Weak =
            isStage30 && m.stage30WeakUntilMs !== undefined && now < m.stage30WeakUntilMs;
          const isFinalBossPhase1 = m.isFinalBoss && m.finalBossPhase === 1;
          const isFinalBossPhase2 = m.isFinalBoss && m.finalBossPhase === 2;
          const isFinalBossPhase3 = m.isFinalBoss && m.finalBossPhase === 3;
          const isFinalBossPhase4 = m.isFinalBoss && m.finalBossPhase === 4;
          const usesFinalBossAura = isFinalBossPhase1 || isFinalBossPhase2 || isFinalBossPhase3 || isFinalBossPhase4;
          const stage20ShieldPercent = m.stage20ShieldMaxHp
            ? Math.max(0, ((m.stage20ShieldHp ?? 0) / m.stage20ShieldMaxHp) * 100)
            : 0;
          const sniperSpecialTarget = p.projectiles.some((projectile) =>
            projectile.targetId === m.id &&
            projectile.sourceTypeId === "sniper" &&
            projectile.effectType === "sniper"
          );

          const displayedMaxHp = m.bossStage === 15 && stage15State !== "phoenix"
            ? m.stage15EggMaxHp ?? m.maxHp
            : m.maxHp;
          const hpPercent = Math.max(0, (m.hp / displayedMaxHp) * 100);
          const hpColor =
            hpPercent > 50 ? "#22c55e" : hpPercent > 25 ? "#f97316" : "#ef4444";
          const monsterSpriteClass =
            (m.isFinalBoss && m.finalBossPhase
              ? FINAL_BOSS_SPRITE_CLASSES[m.finalBossPhase]
              : undefined) ??
            (m.bossStage ? BOSS_SPRITE_CLASSES[m.bossStage] : undefined) ??
            MONSTER_SPRITE_CLASSES[m.category];
          const displayedSpriteClass = m.bossStage === 15
            ? stage15State === "transforming" || stage15State === "hatching"
              ? `bossStage15RebirthSprite ${stage15State === "hatching" ? "stage15Hatching" : ""}`
              : stage15State === "egg"
                ? "bossStage15EggSprite"
                : monsterSpriteClass
            : monsterSpriteClass;

          return (
            <span
              key={m.id}
              className={`monster ${m.category} ${m.isBoss ? "boss" : ""} ${m.id === p.selectedBossId ? "selectedBoss" : ""} ${m.isFinalBoss ? "finalBoss" : ""} ${isFinalBossPhase1 ? "finalBossPhase1Test" : ""} ${isFinalBossPhase2 ? "finalBossPhase2Test" : ""} ${isFinalBossPhase3 ? "finalBossPhase3Test" : ""} ${isFinalBossPhase4 ? "finalBossPhase4Test" : ""} ${m.summonedByBossId !== undefined ? "stage05Skeleton" : ""} ${m.stage05BeingAbsorbed ? "stage05BeingAbsorbed" : ""} ${m.stage05ShieldActive ? "stage05SummonShield" : ""} ${isStage05Summoning ? "stage05Summoning" : ""} ${isStage05Absorbing ? "stage05Absorbing" : ""} ${m.bossStage === 15 ? `stage15-${stage15State}` : ""} ${isStage20Charging ? "stage20Charging" : ""} ${isStage20Shielded ? "stage20Shielded" : ""} ${isStage20Stunned ? "stage20Stunned" : ""} ${isStage20ShieldBreaking ? "stage20ShieldBreaking" : ""} ${isStage30Teleporting ? "stage30Teleporting" : ""} ${isStage30Weak ? "stage30Weak" : ""} ${isHit ? "hitFlash" : ""} ${isBurning ? "burning" : ""} ${isBossSniperHit ? "bossSniperHit" : ""} ${
                isParalyzed ? "paralyzed" : isSlow ? "slowed" : ""
              }`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                ...(m.stage05BeingAbsorbed
                  ? {
                      animationDuration: `${STAGE05_ABSORB_CAST_MS / p.animationSpeed}ms`,
                      animationPlayState: p.animationPaused ? "paused" : "running",
                    }
                  : {}),
              }}
              role={m.isBoss ? "button" : undefined}
              tabIndex={m.isBoss ? 0 : undefined}
              onClick={m.isBoss
                ? (event) => {
                    event.stopPropagation();
                    p.onBossClick(m.id);
                  }
                : undefined}
              onKeyDown={m.isBoss
                ? (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      p.onBossClick(m.id);
                    }
                  }
                : undefined}
              title={m.isBoss
                ? `${m.isFinalBoss ? `FINAL BOSS ${m.finalBossPhase}단계` : `${BOSS_NAMES[m.category]} 보스`} HP ${m.hp}/${displayedMaxHp}`
                : `[${m.category}] HP ${m.hp}/${m.maxHp} | Laps: ${m.laps}/5`}
            >
              {m.bossStage === 5 && (
                <span
                  className="bossStage05Aura"
                  style={{
                    animationDuration: `${1600 / p.animationSpeed}ms`,
                    animationPlayState: p.animationPaused ? "paused" : "running",
                  }}
                  aria-hidden="true"
                />
              )}
              {m.stage05ShieldActive && (
                <span
                  className="stage05ShieldEffect"
                  style={{
                    animationDuration: `${900 / p.animationSpeed}ms`,
                    animationPlayState: p.animationPaused ? "paused" : "running",
                  }}
                  aria-hidden="true"
                />
              )}
              {isStage05Summoning && (
                <span
                  className="stage05SummonEffect"
                  style={{
                    animationDuration: `${STAGE05_SUMMON_CAST_MS / p.animationSpeed}ms`,
                    animationPlayState: p.animationPaused ? "paused" : "running",
                  }}
                  aria-hidden="true"
                />
              )}
              {isStage05Absorbing && (
                <span
                  className="stage05AbsorbCore"
                  style={{
                    animationDuration: `${STAGE05_ABSORB_CAST_MS / p.animationSpeed}ms`,
                    animationPlayState: p.animationPaused ? "paused" : "running",
                  }}
                  aria-hidden="true"
                />
              )}
              {isStage20Charging && (
                <span
                  className="stage20ChargeEffect"
                  style={{
                    animationDuration: `${STAGE20_SHIELD_CAST_MS / p.animationSpeed}ms`,
                    animationPlayState: p.animationPaused ? "paused" : "running",
                  }}
                  aria-hidden="true"
                />
              )}
              {isStage20Shielded && (
                <>
                  <span className="stage20ShieldIcon" aria-hidden="true" />
                  <span className="stage20ShieldEffect" aria-hidden="true" />
                </>
              )}
              {isStage20ShieldHit && (
                <span className="stage20ShieldHitEffect" aria-hidden="true" />
              )}
              {isStage20ShieldBreaking && (
                <span className="stage20ShieldBreakEffect" aria-hidden="true" />
              )}
              {isStage20Stunned && (
                <span className="stage20StunEffect" aria-hidden="true">
                  <i /><i /><i />
                </span>
              )}
              {isStage25Casting && (
                <span
                  className="stage25ReforgeEffect"
                  style={{
                    animationDuration: `${STAGE25_REFORGE_CAST_MS / p.animationSpeed}ms`,
                    animationPlayState: p.animationPaused ? "paused" : "running",
                  }}
                  aria-hidden="true"
                />
              )}
              {isStage30 && (
                <span
                  className={`stage30OrbitEffect move-${moveDirection}`}
                  style={{
                    animationDuration: `${2600 / p.animationSpeed}ms`,
                    animationPlayState: p.animationPaused ? "paused" : "running",
                  }}
                  aria-hidden="true"
                >
                  {Array.from({ length: m.stage30StoneCount ?? 0 }, (_, index) => <i key={index} />)}
                </span>
              )}
              {usesFinalBossAura && (
                <span
                  className="finalBossAuraBack"
                  style={{
                    animationDuration: `${6200 / p.animationSpeed}ms`,
                    animationPlayState: p.animationPaused ? "paused" : "running",
                  }}
                  aria-hidden="true"
                />
              )}
              <span
                className={`monsterSprite ${m.isBoss ? "bossSprite" : ""} ${displayedSpriteClass} move-${moveDirection}`}
                style={{
                  animationDuration: `${(
                    isFinalBossPhase1
                      ? 1800
                    : isFinalBossPhase2
                      ? 1900
                    : isFinalBossPhase3
                      ? 1700
                    : isFinalBossPhase4
                      ? 2100
                    : m.bossStage === 5
                      ? isStage05Summoning
                        ? STAGE05_SUMMON_CAST_MS
                        : isStage05Absorbing
                          ? STAGE05_ABSORB_CAST_MS
                          : 1500
                      : m.bossStage === 10
                        ? 720
                        : m.bossStage === 15
                          ? stage15State === "transforming" || stage15State === "hatching"
                            ? 1200
                            : stage15State === "egg"
                              ? 1000
                              : 840
                          : m.bossStage === 20
                            ? moveDirection === "left" || moveDirection === "right"
                              ? 1120
                              : 1400
                            : m.bossStage === 25
                              ? moveDirection === "left" || moveDirection === "right"
                                ? 1540
                                : 2060
                              : m.bossStage === 30
                                ? 1400
                            : 480
                  ) / p.animationSpeed}ms`,
                  animationPlayState: p.animationPaused || isStage10Stomping || isStage20Charging || isStage20Stunned || isStage25Casting ? "paused" : "running",
                }}
                aria-hidden="true"
              />
              {usesFinalBossAura && <FinalBossLightning paused={p.animationPaused} speed={p.animationSpeed} />}
              {sniperSpecialTarget && (
                <span
                  className={`sniperSpecialMark ${m.isBoss ? "bossSniperMark" : "executeSniperMark"}`}
                  aria-hidden="true"
                />
              )}
              {isBurning && <span className="burnImpact" aria-hidden="true" />}
              {isBossSniperHit && <span className="bossSniperBurst" aria-hidden="true" />}
              {stage15State === "egg" && m.stage15ReviveAtMs !== undefined && (
                <span className="stage15EggTimer">
                  부활 {Math.max(0, (m.stage15ReviveAtMs - now) / 1000).toFixed(1)}s
                </span>
              )}
              {isStage20Shielded && m.stage20ShieldMaxHp !== undefined && (
                <span className="stage20ShieldBar">
                  <span
                    className="stage20ShieldBarFill"
                    style={{ width: `${stage20ShieldPercent}%` }}
                  />
                  <span className="stage20ShieldBarText">
                    {Math.ceil(m.stage20ShieldHp ?? 0)}/{m.stage20ShieldMaxHp}
                  </span>
                </span>
              )}
              {isStage30 && (m.stage30StoneCount ?? 0) > 0 && (
                <span className="stage30StoneBar">
                  부유석 {m.stage30StoneCount}/4 · {Math.ceil(m.stage30StoneHp ?? 0)}/{m.stage30StoneMaxHp}
                </span>
              )}

              {/* 완주 횟수 라벨 배지 */}
              {!m.isBoss && m.laps > 0 && (
                <span className="monsterLapBadge">
                  🔄 {m.laps}/5
                </span>
              )}

              {/* 상태이상 표시 */}
              <div className="statusIcons">
                {isImmune && <span className="statusTag immune">🛑</span>}
                {isSlow && <span className="statusTag slow">❄️</span>}
                {isParalyzed && <span className="statusTag stun">⚡</span>}
              </div>

              {/* HP 바 */}
              <span className="monsterHp">
                <span
                  className="monsterHpFill"
                  style={{
                    width: `${hpPercent}%`,
                    backgroundColor: hpColor,
                  }}
                />
                <span className="monsterHpText">
                  {m.hp}/{displayedMaxHp}
                </span>
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

import { useMemo, type CSSProperties } from "react";
import type { UnitClass, UnitTypeId } from "../../games/rogueTd/types";
import { UNIT_PORTRAIT_CLASSES } from "../../games/rogueTd/unitSprites";

interface Props {
  unitClass: UnitClass;
  unitTypeIds: UnitTypeId[];
  phase: "cutin" | "impact";
}

const ULTIMATE_CLASS_NAMES: Record<UnitClass, string> = {
  warrior: "warrior",
  mage: "mage",
  ranger: "ranger",
};

const RANGER_TARGETS = [
  { x: 18, y: 32, width: 15, delay: 0, life: 1600 },
  { x: 53, y: 33, width: 42, delay: 480, life: 1220 },
  { x: 87, y: 43, width: 18, delay: 120, life: 1680 },
  { x: 33, y: 84, width: 31, delay: 240, life: 1660 },
  { x: 70, y: 81, width: 22, delay: 360, life: 1640 },
];
const RANGER_STRIKES = [
  { x: 18, y: 32, missileWidth: 6.5, explosionWidth: 18, missileDelay: 3800 },
  { x: 53, y: 33, missileWidth: 12, explosionWidth: 46, missileDelay: 3900 },
  { x: 87, y: 43, missileWidth: 7.5, explosionWidth: 21, missileDelay: 4000 },
  { x: 33, y: 84, missileWidth: 10, explosionWidth: 35, missileDelay: 4100 },
  { x: 70, y: 81, missileWidth: 8.5, explosionWidth: 26, missileDelay: 4200 },
];

const MAGE_CRYSTAL_SOURCES = [
  { type: "fire", x: 18, y: 77 },
  { type: "ice", x: 50, y: 27 },
  { type: "lightning", x: 82, y: 80 },
] as const;

function createSpiralPath(
  startX: number,
  startY: number,
  turns: number,
  direction: number,
  radialPower: number,
  wobble: number,
  phase: number,
) {
  const centerX = 500;
  const centerY = 200;
  const sourceX = startX * 10;
  const sourceY = startY * 4;
  const screenAspectCorrection = 1.14;
  const deltaX = (sourceX - centerX) * screenAspectCorrection;
  const deltaY = sourceY - centerY;
  const initialRadius = Math.hypot(deltaX, deltaY);
  const initialAngle = Math.atan2(deltaY, deltaX);
  const points = Array.from({ length: 28 }, (_, index) => {
    const progress = index / 27;
    const angle = initialAngle + progress * Math.PI * 2 * turns * direction
      + Math.sin(progress * Math.PI * 3 + phase) * wobble * .018;
    const pulse = 1 + Math.sin(progress * Math.PI * 5 + phase) * wobble * .012 * (1 - progress);
    const radius = (1 - progress) ** radialPower * pulse;
    return {
      x: centerX + (initialRadius / screenAspectCorrection) * Math.cos(angle) * radius,
      y: centerY + initialRadius * Math.sin(angle) * radius,
    };
  });
  const commands = [`M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`];
  for (let index = 1; index < points.length - 1; index += 1) {
    const midpointX = (points[index].x + points[index + 1].x) / 2;
    const midpointY = (points[index].y + points[index + 1].y) / 2;
    commands.push(`Q ${points[index].x.toFixed(1)} ${points[index].y.toFixed(1)} ${midpointX.toFixed(1)} ${midpointY.toFixed(1)}`);
  }
  const last = points[points.length - 1];
  commands.push(`L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`);
  return commands.join(" ");
}

const MAGE_CRYSTALS = MAGE_CRYSTAL_SOURCES.flatMap((source, sourceIndex) =>
  Array.from({ length: 8 }, (_, index) => {
    const scatterAngle = (index / 8) * Math.PI * 2 + sourceIndex * 0.8;
    const startX = source.x + Math.cos(scatterAngle) * (2.5 + (index % 4) * 1.1);
    const startY = source.y + Math.sin(scatterAngle) * (1.4 + (index % 3) * 0.7);
    const variation = (index * 7 + sourceIndex * 5) % 9;
    const turns = 1.45 + variation * 0.24;
    const direction = (index * 3 + sourceIndex * 2) % 5 < 2 ? -1 : 1;
    const radialPower = 0.62 + ((index * 5 + sourceIndex) % 7) * 0.095;
    const wobble = 2 + ((index * 3 + sourceIndex * 2) % 6);

    return {
      id: `${source.type}-${index}`,
      type: source.type,
      path: createSpiralPath(startX, startY, turns, direction, radialPower, wobble, scatterAngle),
      size: 5 + ((index * 7 + sourceIndex * 3) % 6) * 1.8,
      delay: 150 + ((index * 5 + sourceIndex * 3) % 8) * 94,
      duration: 1900 + ((index * 5 + sourceIndex * 7) % 9) * 210,
      direction,
      spinDuration: 480 + ((index * 3 + sourceIndex) % 6) * 95,
      twinkleDuration: 420 + ((index * 5 + sourceIndex * 3) % 7) * 75,
      twinkleDelay: ((index * 7 + sourceIndex * 4) % 9) * 55,
    };
  }),
);

const WARRIOR_SLASH_TYPES = [
  { name: "swordsman", spriteClass: "swordsman" },
  { name: "dual-swordsman", spriteClass: "dual" },
  { name: "magic-swordsman", spriteClass: "magic" },
] as const;

interface WarriorSlash {
  id: string;
  spriteClass: "swordsman" | "dual" | "magic";
  x: number;
  y: number;
  width: number;
  rotation: number;
  delay: number;
  flip: number;
}

function createWarriorSlashes(): WarriorSlash[] {
  const zones = Array.from({ length: 24 }, (_, index) => index);
  for (let index = zones.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [zones[index], zones[swapIndex]] = [zones[swapIndex], zones[index]];
  }

  const slashTypes = WARRIOR_SLASH_TYPES.flatMap(({ name, spriteClass }) =>
    Array.from({ length: 8 }, (_, index) => ({ name, spriteClass, index })),
  );
  for (let index = slashTypes.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [slashTypes[index], slashTypes[swapIndex]] = [slashTypes[swapIndex], slashTypes[index]];
  }

  const slashes = slashTypes.map(({ name, spriteClass, index }, order) => {
    const zone = zones[order];
    const column = zone % 6;
    const row = Math.floor(zone / 6);
    const progress = order / (slashTypes.length - 1);
    return {
      id: `${name}-${index}`,
      spriteClass,
      x: 8.3 + column * 16.7 + (Math.random() - 0.5) * 8,
      y: 12.5 + row * 25 + (Math.random() - 0.5) * 12,
      width: 15 + Math.random() * 10,
      rotation: Math.round(Math.random() * 360),
      delay: Math.round(70 + 1250 * (1 - ((1 - progress) ** 1.8)) + Math.random() * 42),
      flip: Math.random() > 0.5 ? -1 : 1,
    };
  });

  return slashes.sort((a, b) => a.delay - b.delay);
}

export default function UltimateCutIn({ unitClass, unitTypeIds, phase }: Props) {
  const warriorSlashes = useMemo(() => createWarriorSlashes(), []);

  return (
    <div className={`ultimateCutIn ${ULTIMATE_CLASS_NAMES[unitClass]} ${phase}`} aria-live="assertive">
      <div className="ultimateShade" />
      <div className="ultimatePortraits" aria-hidden="true">
        {unitTypeIds.map((typeId, index) => (
          <span key={typeId} className={`ultimatePortrait portrait${index + 1}`}>
            <i className={UNIT_PORTRAIT_CLASSES[typeId]} />
          </span>
        ))}
      </div>
      <div className="ultimateMapEffect" aria-hidden="true">
        {unitClass === "warrior" && (
          <>
            <span className="ultimateWarriorSlashField">
              {warriorSlashes.map((slash) => (
                <span key={slash.id}>
                  <i
                    className={`ultimateWarriorSlash ${slash.spriteClass}`}
                    style={{
                      "--slash-x": `${slash.x}%`,
                      "--slash-y": `${slash.y}%`,
                      "--slash-width": `${slash.width}%`,
                      "--slash-rotation": `${slash.rotation}deg`,
                      "--slash-delay": `${slash.delay}ms`,
                      "--slash-flip": slash.flip,
                    } as CSSProperties}
                  />
                  <b
                    className={`ultimateWarriorScar ${slash.spriteClass}`}
                    style={{
                      "--slash-x": `${slash.x}%`,
                      "--slash-y": `${slash.y}%`,
                      "--scar-width": `${slash.width * 0.82}%`,
                      "--slash-rotation": `${slash.rotation}deg`,
                      "--scar-delay": `${slash.delay + 330}ms`,
                    } as CSSProperties}
                  />
                  <em
                    className={`ultimateWarriorImpactBurst ${slash.spriteClass}`}
                    style={{
                      "--slash-x": `${slash.x}%`,
                      "--slash-y": `${slash.y}%`,
                      "--burst-size": `${Math.max(7, slash.width * 0.58)}%`,
                      "--burst-delay": `${slash.delay + 120}ms`,
                      "--burst-rotation": `${slash.rotation + 35}deg`,
                    } as CSSProperties}
                  />
                </span>
              ))}
            </span>
            <span className="ultimateWarriorFaultShade" />
            <span className="ultimateWarriorFinalSlash" />
            <span className="ultimateWarriorSplit upper" />
            <span className="ultimateWarriorSplit lower" />
            <span className="ultimateWarriorRift" />
          </>
        )}
        {unitClass === "mage" && (
          <>
            <span className="ultimateMageCircle fire">
              <i />
            </span>
            <span className="ultimateMageCircle ice">
              <i />
            </span>
            <span className="ultimateMageCircle lightning">
              <i />
            </span>
            <svg className="ultimateMageCrystalField" viewBox="0 0 1000 400" preserveAspectRatio="none">
              {MAGE_CRYSTALS.map((crystal) => (
                <g key={crystal.id}>
                  <path
                    className={`ultimateMageCrystalTrail ${crystal.type}`}
                    d={crystal.path}
                    pathLength="100"
                    strokeWidth={Math.max(1.1, crystal.size * 0.15)}
                    strokeDasharray="7 93"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      from="0"
                      to="-100"
                      begin={`${crystal.delay / 1000}s`}
                      dur={`${crystal.duration / 1000}s`}
                      fill="freeze"
                    />
                    <animate
                      attributeName="opacity"
                      values="0;.58;.42;0"
                      keyTimes="0;.1;.84;1"
                      begin={`${crystal.delay / 1000}s`}
                      dur={`${crystal.duration / 1000}s`}
                      fill="freeze"
                    />
                  </path>
                  <g>
                    <animateMotion
                      path={crystal.path}
                      begin={`${crystal.delay / 1000}s`}
                      dur={`${crystal.duration / 1000}s`}
                      fill="freeze"
                      calcMode="linear"
                    />
                    <g>
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0"
                        to={`${crystal.direction * 360}`}
                        dur={`${crystal.spinDuration / 1000}s`}
                        repeatCount="indefinite"
                      />
                      <polygon
                        className={`ultimateMageCrystal ${crystal.type}`}
                        points="0,-1.15 .22,-.22 1.15,0 .22,.22 0,1.15 -.22,.22 -1.15,0 -.22,-.22"
                        transform={`scale(${crystal.size})`}
                        style={{
                          "--crystal-delay": `${crystal.delay}ms`,
                          "--crystal-duration": `${crystal.duration}ms`,
                        } as CSSProperties}
                      >
                        <animate attributeName="fill-opacity" values=".58;1;.72;1;.58" begin={`${crystal.twinkleDelay / 1000}s`} dur={`${crystal.twinkleDuration / 1000}s`} repeatCount="indefinite" />
                        <animate attributeName="stroke-opacity" values=".42;1;.55;1;.42" begin={`${crystal.twinkleDelay / 1000}s`} dur={`${crystal.twinkleDuration / 1000}s`} repeatCount="indefinite" />
                      </polygon>
                      <line
                        className="ultimateMageCrystalGlint"
                        x1="0" y1="-.88" x2="0" y2="-.32"
                        transform={`scale(${crystal.size})`}
                        style={{
                          "--crystal-delay": `${crystal.delay}ms`,
                          "--crystal-duration": `${crystal.duration}ms`,
                        } as CSSProperties}
                      />
                    </g>
                  </g>
                </g>
              ))}
            </svg>
            <span className="ultimateMageCore" />
            <span className="ultimateMageAbsorptions">
              {MAGE_CRYSTALS.map((crystal) => (
                <i
                  key={`absorb-${crystal.id}`}
                  className={crystal.type}
                  style={{
                    "--absorb-delay": `${crystal.delay + crystal.duration - 90}ms`,
                    "--absorb-size": 0.55 + crystal.size / 18,
                  } as CSSProperties}
                />
              ))}
            </span>
            <span className="ultimateMageBigBang">
              <i />
            </span>
          </>
        )}
        {unitClass === "ranger" && (
          <>
            <span className="ultimateRangerScope">
              <i />
              <b />
              <em />
              <small className="range">RNG 0842m</small>
              <small className="azimuth">AZ 317°</small>
              <small className="wind">WIND 02.4</small>
              <small className="lock">TRACKING</small>
            </span>
            <span className="ultimateTargetField">
              {RANGER_TARGETS.map((target, index) => (
                <span
                  key={index}
                  className="ultimateTarget"
                  style={{
                    "--target-x": `${target.x}%`,
                    "--target-y": `${target.y}%`,
                    "--target-width": `${target.width}%`,
                    "--target-delay": `${target.delay}ms`,
                    "--target-life": `${target.life}ms`,
                  } as CSSProperties}
                >
                  <i className="ultimateTargetSprite" />
                </span>
              ))}
            </span>
            <span className="ultimateMissiles">
              {RANGER_STRIKES.map((strike, index) => (
                <i
                  key={index}
                  style={{
                    "--strike-x": `${strike.x}%`,
                    "--strike-y": `${strike.y}%`,
                    "--missile-width": `${strike.missileWidth}%`,
                    "--missile-delay": `${strike.missileDelay}ms`,
                  } as CSSProperties}
                />
              ))}
            </span>
            <span className="ultimateBombardmentBursts">
              {RANGER_STRIKES.map((strike, index) => (
                <b
                  key={index}
                  style={{
                    "--target-x": `${strike.x}%`,
                    "--target-y": `${strike.y}%`,
                    "--explosion-width": `${strike.explosionWidth}%`,
                    "--burst-delay": `${strike.missileDelay + 640}ms`,
                  } as CSSProperties}
                />
              ))}
            </span>
          </>
        )}
      </div>
      <div className="ultimateFlash" aria-hidden="true" />
    </div>
  );
}

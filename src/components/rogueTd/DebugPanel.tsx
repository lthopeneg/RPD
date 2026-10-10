import { useState } from "react";
import { MAX_PLAYER_LEVEL, START_LIFE, UNIT_TYPES } from "../../games/rogueTd/constants";
import type { MonsterCategory, UnitClass, UnitTypeId } from "../../games/rogueTd/types";

export type DebugBrush = "start" | "goal" | "empty" | "natural" | "player" | "permanent";
export type DebugStagePreset =
  | "normal-human" | "normal-land" | "normal-flying" | "normal-mixed"
  | "boss-5" | "boss-10" | "boss-15" | "boss-20" | "boss-25" | "boss-30"
  | "final-1" | "final-2" | "final-3" | "final-4" | "final-auto";

export interface DebugMonsterEntry {
  category: MonsterCategory;
  count: number;
}

interface Props {
  brush: DebugBrush | null;
  onBrushChange: (brush: DebugBrush | null) => void;
  onClearMap: () => void;
  onSetGold: (gold: number) => void;
  onSetPlayerLevel: (level: number) => void;
  currentLife: number;
  onRestoreLife: () => void;
  onAddUnit: (typeId: UnitTypeId, tier: 1 | 2 | 3) => void;
  onApplyStage: (preset: DebugStagePreset) => void;
  onSpawnStage: (count: number) => void;
  onStartCustomWave: (entries: DebugMonsterEntry[], hp: number) => void;
  onClearMonsters: () => void;
  onSetTimer: (seconds: number) => void;
  onPreviewUltimate: (unitClass: UnitClass) => void;
  onClose: () => void;
}

const BRUSHES: { value: DebugBrush; label: string }[] = [
  { value: "start", label: "시작점" },
  { value: "goal", label: "골 지점" },
  { value: "empty", label: "빈칸" },
  { value: "natural", label: "자연벽" },
  { value: "player", label: "설치벽" },
  { value: "permanent", label: "파괴불가" },
];

export default function DebugPanel(props: Props) {
  const [gold, setGold] = useState(500);
  const [level, setLevel] = useState(1);
  const [unitType, setUnitType] = useState<UnitTypeId>("swordsman");
  const [unitTier, setUnitTier] = useState<1 | 2 | 3>(1);
  const [stagePreset, setStagePreset] = useState<DebugStagePreset>("boss-5");
  const [monsterCategory, setMonsterCategory] = useState<MonsterCategory>("human");
  const [monsterCount, setMonsterCount] = useState(1);
  const [monsterHp, setMonsterHp] = useState(100);
  const [monsterEntries, setMonsterEntries] = useState<DebugMonsterEntry[]>([]);
  const [timer, setTimer] = useState(40);
  const [ultimateClass, setUltimateClass] = useState<UnitClass>("warrior");

  return (
    <aside className="debugPanel" aria-label="디버그 모드">
      <div className="debugHeader"><strong>DEBUG MODE</strong><button type="button" onClick={props.onClose}>닫기</button></div>

      <section>
        <button type="button" className="debugWide" onClick={props.onClearMap}>빈 맵으로 초기화</button>
        <span className="debugHint">도구 선택 후 맵 셀을 클릭</span>
        <div className="debugBrushGrid">
          {BRUSHES.map(({ value, label }) => (
            <button key={value} type="button" className={props.brush === value ? "active" : ""}
              onClick={() => props.onBrushChange(props.brush === value ? null : value)}>{label}</button>
          ))}
        </div>
      </section>

      <section className="debugInline">
        <label>골드 <input type="number" min="0" value={gold} onChange={(e) => setGold(Number(e.target.value))} /></label>
        <button type="button" onClick={() => props.onSetGold(gold)}>적용</button>
      </section>

      <section className="debugInline">
        <label>레벨 <input type="number" min="1" max={MAX_PLAYER_LEVEL} value={level} onChange={(e) => setLevel(Number(e.target.value))} /></label>
        <button type="button" onClick={() => props.onSetPlayerLevel(level)}>적용</button>
      </section>

      <section className="debugInline">
        <label>라이프 <strong>{props.currentLife}/{START_LIFE}</strong></label>
        <button type="button" onClick={props.onRestoreLife} disabled={props.currentLife >= START_LIFE}>최대 회복</button>
      </section>

      <section className="debugInline">
        <select value={unitType} onChange={(e) => setUnitType(e.target.value as UnitTypeId)}>
          {(Object.keys(UNIT_TYPES) as UnitTypeId[]).map((id) => <option key={id} value={id}>{UNIT_TYPES[id].name}</option>)}
        </select>
        <select aria-label="유닛 성급" value={unitTier} onChange={(e) => setUnitTier(Number(e.target.value) as 1 | 2 | 3)}>
          <option value={1}>1성</option>
          <option value={2}>2성</option>
          <option value={3}>3성</option>
        </select>
        <button type="button" onClick={() => props.onAddUnit(unitType, unitTier)}>창고에 추가</button>
      </section>

      <section>
        <span className="debugHint">일반 몬스터 웨이브 구성</span>
        <div className="debugInline">
          <select aria-label="추가할 몬스터 유형" value={monsterCategory} onChange={(e) => setMonsterCategory(e.target.value as MonsterCategory)}>
            <option value="human">인간형</option>
            <option value="land">육지형</option>
            <option value="flying">비행형</option>
          </select>
          <input className="debugCount" aria-label="추가할 마릿수" type="number" min="1" max="100" value={monsterCount} onChange={(e) => setMonsterCount(Number(e.target.value))} />
          <button
            type="button"
            onClick={() => {
              const count = Math.min(100, Math.max(1, Math.floor(monsterCount || 1)));
              setMonsterEntries((entries) => {
                const existing = entries.find((entry) => entry.category === monsterCategory);
                if (!existing) return [...entries, { category: monsterCategory, count }];
                return entries.map((entry) => entry.category === monsterCategory
                  ? { ...entry, count: Math.min(100, entry.count + count) }
                  : entry);
              });
            }}
          >추가</button>
        </div>
        <div className="debugMonsterQueue">
          {monsterEntries.length === 0
            ? <span>추가된 몬스터 없음</span>
            : monsterEntries.map((entry) => (
                <button key={entry.category} type="button" title="클릭하면 목록에서 제거"
                  onClick={() => setMonsterEntries((entries) => entries.filter((item) => item.category !== entry.category))}>
                  {entry.category === "human" ? "인간형" : entry.category === "land" ? "육지형" : "비행형"} × {entry.count}
                </button>
              ))}
        </div>
        <div className="debugInline">
          <label>체력 <input type="number" min="1" max="99999999" value={monsterHp} onChange={(e) => setMonsterHp(Number(e.target.value))} /></label>
          <button type="button" disabled={monsterEntries.length === 0}
            onClick={() => props.onStartCustomWave(monsterEntries, monsterHp)}>시작</button>
        </div>
      </section>

      <section>
        <span className="debugHint">보스 스테이지</span>
        <div className="debugInline">
          <select value={stagePreset} onChange={(e) => setStagePreset(e.target.value as DebugStagePreset)}>
            <optgroup label="보스 스테이지">
              <option value="boss-5">BOSS STAGE 5 · 인간형</option>
              <option value="boss-10">BOSS STAGE 10 · 마수형</option>
              <option value="boss-15">BOSS STAGE 15 · 비행형</option>
              <option value="boss-20">BOSS STAGE 20 · 인간형</option>
              <option value="boss-25">BOSS STAGE 25 · 마수형</option>
              <option value="boss-30">BOSS STAGE 30 · 비행형</option>
            </optgroup>
            <optgroup label="최종 보스 테스트">
              <option value="final-1">FINAL · 1페이즈 직접</option>
              <option value="final-2">FINAL · 2페이즈 직접</option>
              <option value="final-3">FINAL · 3페이즈 직접</option>
              <option value="final-4">FINAL · 4페이즈 직접</option>
              <option value="final-auto">FINAL · 기믹 자동 확인</option>
            </optgroup>
          </select>
          <button type="button" onClick={() => props.onApplyStage(stagePreset)}>스테이지 적용</button>
        </div>
        <button
          type="button"
          className="debugWide"
          onClick={() => props.onSpawnStage(1)}
        >적용된 보스 소환</button>
        <button type="button" className="debugWide" onClick={props.onClearMonsters}>소환 몬스터 초기화</button>
      </section>

      <section className="debugInline">
        <label>타이머 <input type="number" min="1" max="9999" value={timer} onChange={(e) => setTimer(Number(e.target.value))} /></label>
        <button type="button" onClick={() => props.onSetTimer(timer)}>초 적용</button>
      </section>

      <section>
        <span className="debugHint">필살스킬 연출 확인</span>
        <div className="debugInline">
          <select
            aria-label="확인할 필살스킬 직업"
            value={ultimateClass}
            onChange={(event) => setUltimateClass(event.target.value as UnitClass)}
          >
            <option value="warrior">전사 필살기</option>
            <option value="mage">마법사 필살기</option>
            <option value="ranger">사수 필살기</option>
          </select>
          <button type="button" onClick={() => props.onPreviewUltimate(ultimateClass)}>연출 실행</button>
        </div>
      </section>
    </aside>
  );
}

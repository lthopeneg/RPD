import { useState } from "react";
import { MAX_PLAYER_LEVEL, UNIT_TYPES } from "../../games/rogueTd/constants";
import type { UnitTypeId } from "../../games/rogueTd/types";

export type DebugBrush = "start" | "goal" | "empty" | "natural" | "player" | "permanent";
export type DebugStagePreset =
  | "normal-human" | "normal-land" | "normal-flying" | "normal-mixed"
  | "boss-5" | "boss-10" | "boss-15" | "boss-20" | "boss-25" | "boss-30"
  | "final-1" | "final-2" | "final-3" | "final-4" | "final-auto";

interface Props {
  brush: DebugBrush | null;
  onBrushChange: (brush: DebugBrush | null) => void;
  onClearMap: () => void;
  onSetGold: (gold: number) => void;
  onSetPlayerLevel: (level: number) => void;
  onAddUnit: (typeId: UnitTypeId, tier: 1 | 2 | 3) => void;
  onApplyStage: (preset: DebugStagePreset) => void;
  onSpawnStage: (count: number) => void;
  onClearMonsters: () => void;
  onSetTimer: (seconds: number) => void;
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
  const [stagePreset, setStagePreset] = useState<DebugStagePreset>("normal-human");
  const [monsterCount, setMonsterCount] = useState(1);
  const [timer, setTimer] = useState(40);

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
        <div className="debugInline">
          <select value={stagePreset} onChange={(e) => setStagePreset(e.target.value as DebugStagePreset)}>
            <optgroup label="일반 스테이지">
              <option value="normal-human">STAGE 1 · 인간형</option>
              <option value="normal-land">STAGE 2 · 마수형</option>
              <option value="normal-flying">STAGE 3 · 비행형</option>
              <option value="normal-mixed">STAGE 4 · 균등 혼합</option>
            </optgroup>
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
        <div className="debugInline">
          <span className="debugHint">소환 수</span>
          <input className="debugCount" type="number" min="1" max="100" value={monsterCount} onChange={(e) => setMonsterCount(Number(e.target.value))} />
        </div>
        <button
          type="button"
          className="debugWide"
          onClick={() => props.onSpawnStage(monsterCount)}
        >적용된 스테이지 몬스터 소환</button>
        <button type="button" className="debugWide" onClick={props.onClearMonsters}>소환 몬스터 초기화</button>
      </section>

      <section className="debugInline">
        <label>타이머 <input type="number" min="1" max="9999" value={timer} onChange={(e) => setTimer(Number(e.target.value))} /></label>
        <button type="button" onClick={() => props.onSetTimer(timer)}>초 적용</button>
      </section>
    </aside>
  );
}

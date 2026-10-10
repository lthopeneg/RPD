import { UNIT_TYPES } from "../../games/rogueTd/constants";
import type { UnitTypeId } from "../../games/rogueTd/types";
import { useEffect, useState } from "react";

export interface WaveDamageEntry {
  unitId: number;
  typeId: UnitTypeId;
  tier: number;
  damage: number;
}

interface Props {
  wave: number | null;
  entries: WaveDamageEntry[];
}

export default function DamageReport({ wave, entries }: Props) {
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [wave, entries]);
  if (wave === null) {
    return (
      <section className="damageReport">
        <div className="damageReportHeader">
          <strong>데미지 랭킹</strong>
        </div>
        <p className="damageEmpty">웨이브 종료 후 피해량과 점유율이 표시됩니다.</p>
      </section>
    );
  }
  const total = entries.reduce((sum, entry) => sum + entry.damage, 0);
  const sorted = [...entries].sort((a, b) => b.damage - a.damage);
  const pageSize = 6;
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = sorted.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const slots = Array.from({ length: pageSize }, (_, index) => visible[index] ?? null);
  const visibleRankStart = currentPage * pageSize + 1;

  return (
    <section className="damageReport">
      <div className="damageReportHeader">
        <strong>데미지 랭킹</strong>
        <span>총 {total.toLocaleString()}</span>
      </div>
      <div className="damageRows">
          {slots.map((entry, index) => {
            if (!entry) {
              return <div className="damageRow empty" key={`empty-${currentPage}-${index}`} aria-hidden="true" />;
            }
            const def = UNIT_TYPES[entry.typeId];
            const share = total > 0 ? Math.round(entry.damage / total * 100) : 0;
            return (
              <div className="damageRow" key={entry.unitId}>
                <span>{visibleRankStart + index}. {def.name} {"★".repeat(entry.tier)}</span>
                <span>{entry.damage.toLocaleString()} ({share}%)</span>
              </div>
            );
          })}
      </div>
      <div className="damagePagination" aria-label="데미지 랭킹 페이지">
        <button type="button" onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={currentPage === 0} aria-label="이전 순위">‹</button>
        <span>{currentPage + 1}/{pageCount}</span>
        <button type="button" onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))} disabled={currentPage >= pageCount - 1} aria-label="다음 순위">›</button>
      </div>
    </section>
  );
}

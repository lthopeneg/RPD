import { useCallback, useEffect, useLayoutEffect, useState } from "react";

const TUTORIAL_STEPS = [
  { target: ".commandCell:nth-child(1)", title: "유닛 구매", text: "유닛 버튼(Q)을 누르면 무작위 유닛을 구매합니다. 구매한 유닛은 먼저 창고의 빈칸에 들어갑니다.", tip: "창고가 가득 차거나 웨이브가 진행 중이면 구매할 수 없습니다." },
  { target: ".centerWorkspace .storageShell", title: "창고와 배치", text: "창고의 유닛을 클릭하고 유닛 배치를 선택한 뒤, 금색으로 빛나는 맵 칸을 누르면 배치됩니다.", tip: "배치한 유닛을 클릭하면 회수하거나 다른 유닛과 자리를 교환할 수 있습니다." },
  { target: ".centerStage .boardShell", title: "벽과 경로", text: "빈 맵 칸을 클릭해 벽을 설치하면 몬스터의 이동 경로가 바뀝니다. 길을 완전히 막는 벽은 설치할 수 없습니다.", tip: "커맨드의 경로 버튼(S)으로 현재 최단 경로를 확인할 수 있습니다." },
  { target: ".centerWorkspace .storageShell", title: "합성과 승급", text: "같은 종류와 같은 성급의 유닛 3개가 모이면 유닛 메뉴에서 승급할 수 있습니다.", tip: "2성부터 고유 스킬을 얻고, 3성은 강화 스킬과 추가 고유 스킬을 함께 사용합니다." },
  { target: ".leftRail .synergyShell", title: "업그레이드와 시너지", text: "같은 직업이나 특성의 유닛을 함께 배치하면 이곳에 표시된 시너지 효과가 활성화됩니다.", tip: "커맨드의 업그레이드 버튼(W)은 무작위 직업·특성의 피해를 강화합니다." },
  { target: ".commandCell:nth-child(8)", title: "웨이브 진행", text: "준비를 마치면 웨이브 시작(X)을 눌러 전투를 시작하세요. 보스 스테이지에서는 보스 설명도 확인할 수 있습니다.", tip: "일시정지(Z)와 배속(D)을 이용해 전투 속도를 조절할 수 있습니다." },
] as const;

interface Props { onClose: () => void; }
interface SpotlightRect { left: number; top: number; width: number; height: number; }

export default function TutorialPanel({ onClose }: Props) {
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<SpotlightRect | null>(null);
  const current = TUTORIAL_STEPS[step];

  const updateTarget = useCallback(() => {
    const target = document.querySelector<HTMLElement>(current.target);
    if (!target) {
      setTargetRect(null);
      return;
    }
    const rect = target.getBoundingClientRect();
    const padding = 7;
    setTargetRect({
      left: Math.max(8, rect.left - padding),
      top: Math.max(8, rect.top - padding),
      width: Math.min(window.innerWidth - 16, rect.width + padding * 2),
      height: Math.min(window.innerHeight - 16, rect.height + padding * 2),
    });
  }, [current.target]);

  useLayoutEffect(updateTarget, [updateTarget]);
  useEffect(() => {
    window.addEventListener("resize", updateTarget);
    window.addEventListener("scroll", updateTarget, true);
    return () => {
      window.removeEventListener("resize", updateTarget);
      window.removeEventListener("scroll", updateTarget, true);
    };
  }, [updateTarget]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") setStep((value) => Math.max(0, value - 1));
      if (event.key === "ArrowRight") setStep((value) => Math.min(TUTORIAL_STEPS.length - 1, value + 1));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const panelWidth = Math.min(360, window.innerWidth - 24);
  const panelLeft = targetRect
    ? Math.min(window.innerWidth - panelWidth - 12, Math.max(12, targetRect.left + targetRect.width / 2 - panelWidth / 2))
    : Math.max(12, (window.innerWidth - panelWidth) / 2);
  const placeBelow = targetRect ? targetRect.top + targetRect.height + 250 < window.innerHeight : true;
  const panelTop = targetRect
    ? placeBelow ? targetRect.top + targetRect.height + 15 : Math.max(12, targetRect.top - 235)
    : Math.max(12, window.innerHeight / 2 - 110);

  return (
    <div className="tutorialOverlay" role="dialog" aria-modal="true" aria-labelledby="tutorial-step-title">
      {targetRect ? (
        <div className="tutorialSpotlight" style={{ left: targetRect.left, top: targetRect.top, width: targetRect.width, height: targetRect.height }} aria-hidden="true" />
      ) : <div className="tutorialFallbackShade" aria-hidden="true" />}
      <section className={`tutorialGuide ${placeBelow ? "below" : "above"}`} style={{ left: panelLeft, top: panelTop, width: panelWidth }}>
        <header>
          <span>STEP {step + 1} / {TUTORIAL_STEPS.length}</span>
          <button type="button" onClick={onClose} aria-label="튜토리얼 닫기">×</button>
        </header>
        <h2 id="tutorial-step-title">{current.title}</h2>
        <p>{current.text}</p>
        <aside><strong>TIP</strong>{current.tip}</aside>
        <footer>
          <button type="button" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0}>이전</button>
          <div className="tutorialDots" aria-label={`전체 ${TUTORIAL_STEPS.length}단계 중 ${step + 1}단계`}>
            {TUTORIAL_STEPS.map((item, index) => <i key={item.title} className={index === step ? "active" : ""} />)}
          </div>
          {step < TUTORIAL_STEPS.length - 1
            ? <button type="button" className="primary" onClick={() => setStep((value) => value + 1)}>다음</button>
            : <button type="button" className="primary" onClick={onClose}>완료</button>}
        </footer>
      </section>
    </div>
  );
}

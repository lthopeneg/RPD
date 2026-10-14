interface Props {
  musicVolume: number;
  sfxVolume: number;
  musicMuted: boolean;
  sfxMuted: boolean;
  onMusicVolume: (value: number) => void;
  onSfxVolume: (value: number) => void;
  onToggleMusic: () => void;
  onToggleSfx: () => void;
}

export default function AudioControls(props: Props) {
  return (
    <section className="audioControls panelBox" aria-label="소리 설정">
      <div className="audioControlRow">
        <button type="button" className={props.musicMuted ? "muted" : ""} onClick={props.onToggleMusic} aria-label="배경음악 음소거 전환">
          {props.musicMuted ? "🔇" : "🎵"}<span>BGM</span>
        </button>
        <input type="range" min="0" max="100" value={Math.round(props.musicVolume * 100)} onChange={(event) => props.onMusicVolume(Number(event.target.value) / 100)} aria-label="배경음악 볼륨" />
      </div>
      <div className="audioControlRow">
        <button type="button" className={props.sfxMuted ? "muted" : ""} onClick={props.onToggleSfx} aria-label="효과음 음소거 전환">
          {props.sfxMuted ? "🔇" : "🔊"}<span>효과음</span>
        </button>
        <input type="range" min="0" max="100" value={Math.round(props.sfxVolume * 100)} onChange={(event) => props.onSfxVolume(Number(event.target.value) / 100)} aria-label="효과음 볼륨" />
      </div>
    </section>
  );
}

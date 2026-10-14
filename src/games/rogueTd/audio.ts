export type RogueTdMusicMode = "normal" | "boss" | "final";
export type RogueTdSfx = "wave-start" | "attack" | "skill" | "boss-phase" | "clear" | "defeat";

export interface RogueTdAudioSettings {
  musicVolume: number;
  sfxVolume: number;
  musicMuted: boolean;
  sfxMuted: boolean;
}

const STORAGE_KEY = "rogue-td-audio-v1";
const DEFAULT_SETTINGS: RogueTdAudioSettings = {
  musicVolume: 0.28,
  sfxVolume: 0.42,
  musicMuted: false,
  sfxMuted: false,
};

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const midiToHz = (note: number) => 440 * 2 ** ((note - 69) / 12);

class RogueTdAudioEngine {
  private context: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private timer: number | null = null;
  private mode: RogueTdMusicMode = "normal";
  private step = 0;
  private lastAttackAt = 0;
  private settings = this.loadSettings();

  getSettings(): RogueTdAudioSettings {
    return { ...this.settings };
  }

  async unlock() {
    this.ensureContext();
    if (this.context?.state === "suspended") await this.context.resume();
  }

  setSettings(next: Partial<RogueTdAudioSettings>) {
    this.settings = {
      musicVolume: clamp(next.musicVolume ?? this.settings.musicVolume),
      sfxVolume: clamp(next.sfxVolume ?? this.settings.sfxVolume),
      musicMuted: next.musicMuted ?? this.settings.musicMuted,
      sfxMuted: next.sfxMuted ?? this.settings.sfxMuted,
    };
    this.applyVolumes();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      // 저장 공간을 사용할 수 없는 환경에서도 오디오는 계속 동작한다.
    }
  }

  startMusic(mode: RogueTdMusicMode) {
    this.ensureContext();
    if (this.context?.state === "suspended") void this.context.resume();
    const changed = this.mode !== mode;
    this.mode = mode;
    if (changed) this.step = 0;
    if (this.timer !== null) return;
    this.tickMusic();
    const interval = mode === "normal" ? 250 : mode === "boss" ? 205 : 185;
    this.timer = window.setInterval(() => this.tickMusic(), interval);
  }

  pauseMusic() {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
  }

  stopMusic() {
    this.pauseMusic();
    this.step = 0;
  }

  playSfx(kind: RogueTdSfx) {
    this.ensureContext();
    if (!this.context || this.settings.sfxMuted || this.settings.sfxVolume <= 0) return;
    const now = this.context.currentTime;
    if (kind === "attack") {
      if (performance.now() - this.lastAttackAt < 55) return;
      this.lastAttackAt = performance.now();
      this.note(this.sfxGain, 210, 0.055, 0.12, "square", now, 125);
      return;
    }
    const patterns: Record<Exclude<RogueTdSfx, "attack">, number[]> = {
      "wave-start": [60, 64, 67],
      skill: [72, 79, 84],
      "boss-phase": [48, 55, 60, 67],
      clear: [60, 64, 67, 72, 76],
      defeat: [55, 52, 48, 43],
    };
    const gap = kind === "clear" ? 0.13 : 0.1;
    patterns[kind].forEach((midi, index) => {
      this.note(this.sfxGain, midiToHz(midi), kind === "defeat" ? 0.24 : 0.16, 0.16, kind === "clear" ? "triangle" : "square", now + index * gap);
    });
  }

  private loadSettings(): RogueTdAudioSettings {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<RogueTdAudioSettings> | null;
      return saved ? { ...DEFAULT_SETTINGS, ...saved } : { ...DEFAULT_SETTINGS };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  private ensureContext() {
    if (this.context) return;
    const AudioContextCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    this.context = new AudioContextCtor();
    this.musicGain = this.context.createGain();
    this.sfxGain = this.context.createGain();
    this.musicGain.connect(this.context.destination);
    this.sfxGain.connect(this.context.destination);
    this.applyVolumes();
  }

  private applyVolumes() {
    if (!this.context) return;
    const now = this.context.currentTime;
    this.musicGain?.gain.setTargetAtTime(this.settings.musicMuted ? 0 : this.settings.musicVolume, now, 0.02);
    this.sfxGain?.gain.setTargetAtTime(this.settings.sfxMuted ? 0 : this.settings.sfxVolume, now, 0.02);
  }

  private tickMusic() {
    if (!this.context || !this.musicGain || this.settings.musicMuted) {
      this.step += 1;
      return;
    }
    const now = this.context.currentTime;
    const patterns = {
      normal: { melody: [69, 72, 76, 72, 67, 71, 74, 71], bass: [45, 45, 48, 43], type: "triangle" as OscillatorType },
      boss: { melody: [72, 70, 67, 70, 73, 70, 65, 67], bass: [36, 39, 34, 41], type: "sawtooth" as OscillatorType },
      final: { melody: [76, 75, 72, 68, 71, 72, 67, 63], bass: [32, 32, 35, 31], type: "square" as OscillatorType },
    }[this.mode];
    const melody = patterns.melody[this.step % patterns.melody.length];
    this.note(this.musicGain, midiToHz(melody), this.mode === "normal" ? 0.2 : 0.15, 0.055, patterns.type, now);
    if (this.step % 2 === 0) {
      const bass = patterns.bass[Math.floor(this.step / 2) % patterns.bass.length];
      this.note(this.musicGain, midiToHz(bass), 0.32, 0.07, "triangle", now);
    }
    if (this.mode !== "normal" && this.step % 2 === 1) {
      this.note(this.musicGain, 1400 + (this.step % 4) * 180, 0.035, 0.018, "square", now);
    }
    this.step += 1;
  }

  private note(target: GainNode | null, frequency: number, duration: number, volume: number, type: OscillatorType, at?: number, endFrequency?: number) {
    if (!this.context || !target) return;
    const start = at ?? this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (endFrequency !== undefined) oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), start + duration);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(envelope);
    envelope.connect(target);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }
}

export const rogueTdAudio = new RogueTdAudioEngine();

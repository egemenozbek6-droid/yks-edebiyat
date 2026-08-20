// ============================================================
// EdebiKart — Web Audio API ile mini ses efektleri
// Harici dosya gerektirmez, tüm sesler sentezlenir.
// ============================================================

let audioCtx: AudioContext | null = null;
let muted = false;

const MUTE_KEY = "edebikart-sfx-muted";

export function sfxMuted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(MUTE_KEY) === "1";
}

export function sfxMuteToggle(): boolean {
  muted = !muted;
  localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  return muted;
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (muted || sfxMuted()) return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function tone(freq: number, duration: number, type: OscillatorType, volume: number, delay = 0): void {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(volume, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration);
}

export function sfxCorrect(): void {
  tone(523.25, 0.12, "sine", 0.15);
  tone(659.25, 0.12, "sine", 0.15, 0.08);
  tone(783.99, 0.18, "sine", 0.15, 0.16);
}

export function sfxWrong(): void {
  tone(196, 0.18, "sawtooth", 0.12);
  tone(146.83, 0.25, "sawtooth", 0.1, 0.1);
}

export function sfxTick(): void {
  tone(880, 0.04, "square", 0.06);
}

export function sfxVictory(): void {
  tone(523.25, 0.15, "sine", 0.15);
  tone(659.25, 0.15, "sine", 0.15, 0.12);
  tone(783.99, 0.15, "sine", 0.15, 0.24);
  tone(1046.5, 0.3, "sine", 0.18, 0.36);
}

export function sfxDefeat(): void {
  tone(392, 0.2, "sine", 0.12);
  tone(311.13, 0.2, "sine", 0.12, 0.15);
  tone(261.63, 0.4, "sine", 0.1, 0.3);
}

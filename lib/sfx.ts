// ============================================================
// EdebiKart — Web Audio API ile mini ses efektleri
// Harici dosya gerektirmez, tüm sesler sentezlenir (telifsiz).
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
  // iOS / tarayıcı suspend fix
  if (audioCtx.state === "suspended") {
    void audioCtx.resume();
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

/** Kısa gürültü patlaması (kağıt / sayfa hissi) */
function noiseBurst(duration: number, volume: number, freq = 1400, delay = 0): void {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const len = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-3.5 * (i / len));
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(freq, t);
  filter.Q.setValueAtTime(0.7, t);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(volume, t + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  src.start(t);
  src.stop(t + duration + 0.02);
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

/** Kart çevirme — yumuşak sayfa / kitap sesi */
export function sfxFlip(): void {
  noiseBurst(0.09, 0.18, 1600, 0);
  noiseBurst(0.06, 0.1, 900, 0.03);
  tone(320, 0.07, "sine", 0.035, 0);
  tone(240, 0.09, "sine", 0.025, 0.04);
}

/** Sağa atma (öğrendim) — soft onay */
export function sfxSwipeRight(): void {
  tone(523.25, 0.09, "sine", 0.11);
  tone(659.25, 0.12, "sine", 0.1, 0.06);
  tone(783.99, 0.1, "triangle", 0.06, 0.12);
}

/** Sola atma (tekrar) — soft olumsuz */
export function sfxSwipeLeft(): void {
  tone(349.23, 0.11, "triangle", 0.09);
  tone(277.18, 0.14, "triangle", 0.08, 0.07);
  tone(220, 0.12, "sine", 0.05, 0.12);
}

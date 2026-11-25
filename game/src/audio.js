// audio.js — every sound in the game is synthesized with WebAudio, so the
// game ships no audio files and makes no network request.
let audioContext = null;
let muted = false;

export function ensureAudio() {
  if (!audioContext) {
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      audioContext = new Ctor();
    } catch (err) {
      audioContext = null;
    }
  }
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

function tone(freq, durMs, type, gainValue, slideTo) {
  if (muted) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const now = ctx.currentTime;
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, now);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + durMs / 1000);
  gain.gain.setValueAtTime(gainValue || 0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + durMs / 1000);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + durMs / 1000 + 0.02);
}

function noiseBurst(durMs, gainValue) {
  if (muted) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const len = Math.max(1, Math.floor((ctx.sampleRate * durMs) / 1000));
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = gainValue || 0.15;
  src.connect(gain);
  gain.connect(ctx.destination);
  src.start();
}

export const sfx = {
  pickup() { tone(520, 70, 'triangle', 0.1, 760); },
  place() { tone(300, 80, 'triangle', 0.1, 210); },
  chop() { noiseBurst(70, 0.22); tone(180, 60, 'square', 0.06); },
  choppedDone() { tone(660, 90, 'triangle', 0.12); tone(880, 120, 'triangle', 0.12); },
  sizzleStart() { noiseBurst(220, 0.1); },
  cookedReady() { tone(740, 110, 'sine', 0.12, 990); },
  plated() { tone(440, 70, 'triangle', 0.1, 620); },
  dishReady() { tone(523, 110, 'triangle', 0.13); setTimeout(() => tone(784, 160, 'triangle', 0.13), 100); },
  serve() { tone(659, 110, 'sine', 0.14); setTimeout(() => tone(880, 200, 'sine', 0.14), 110); },
  reject() { tone(160, 180, 'sawtooth', 0.1, 110); },
  orderIn() { tone(880, 90, 'sine', 0.1); setTimeout(() => tone(1174, 120, 'sine', 0.1), 90); },
  orderLost() { tone(392, 160, 'sawtooth', 0.1, 196); },
  tick() { tone(1200, 40, 'sine', 0.06); },
  gameOver() { [523, 440, 349, 262].forEach((f, i) => setTimeout(() => tone(f, 220, 'triangle', 0.12), i * 200)); },
};

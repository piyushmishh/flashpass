/**
 * useSound — procedural sound effects via the Web Audio API.
 *
 * Generates short, tasteful UI sounds entirely in code — no MP3 files
 * needed. Sounds are subtle enough to enhance interactions without
 * being annoying. Memoizes a single AudioContext for the page lifetime.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.08,
) {
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const vol = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    vol.gain.value = gain;
    vol.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    osc.connect(vol);
    vol.connect(ac.destination);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration);
  } catch {
    // Silently ignore if audio context is unavailable
  }
}

/** Short UI click — 1200 Hz square, 50ms */
export function playClick() {
  tone(1200, 0.05, 'square', 0.04);
}

/** Ascending two-tone chime for success */
export function playSuccess() {
  tone(523, 0.15, 'sine', 0.07);
  setTimeout(() => tone(784, 0.2, 'sine', 0.07), 100);
}

/** Descending buzz for errors */
export function playError() {
  tone(300, 0.15, 'sawtooth', 0.05);
  setTimeout(() => tone(200, 0.2, 'sawtooth', 0.05), 100);
}

/** Soft metronome tick for countdown urgency */
export function playTick() {
  tone(880, 0.03, 'sine', 0.05);
}

/** Celebration fanfare — rapid ascending arpeggiated notes */
export function playReserved() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((f, i) => setTimeout(() => tone(f, 0.12, 'sine', 0.06), i * 80));
}

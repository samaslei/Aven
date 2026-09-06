/**
 * Aven - Web Audio API Synthesis Utilities
 * Generates alarm chimes and subtle ticking sounds without external audio assets.
 */

let sharedAudioCtx = null;
let tickToggleState = false;

function getAudioContext() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch (e) {
    return null;
  }
}

/**
 * Play subtle per-second ticking sound during countdown
 * Alternates subtly between tick and tock for an organic feel
 * @param {number} volume - 0.0 to 1.0
 */
export function playTickSound(volume = 0.3) {
  if (volume <= 0) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    tickToggleState = !tickToggleState;
    const freq = tickToggleState ? 1050 : 820;
    const gainVal = Math.max(0.001, Math.min(0.2, volume * 0.08));

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq, now);
    filter.Q.setValueAtTime(4.0, now);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.025);
  } catch (e) {
    // Gracefully handle browser autoplay or audio context errors
  }
}

/**
 * Play end-of-phase alarm chime
 * @param {number} volume - 0.0 to 1.0
 * @param {string} soundType - 'bell' | 'digital'
 */
export function playAlarmSound(volume = 0.5, soundType = 'bell') {
  if (volume <= 0) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const baseGain = Math.max(0.01, Math.min(1.0, volume * 0.45));

    if (soundType === 'digital') {
      // Crisp digital double-pulse (high electronic beep)
      [0, 0.15, 0.3].forEach((offset, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(idx === 2 ? 1318.51 : 987.77, now + offset);
        gain.gain.setValueAtTime(baseGain * 0.35, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.1);
      });
    } else {
      // Harmonic Bell Chime: 3 resonant sine notes (D5, F#5, A5, D6)
      const notes = [
        { freq: 587.33, start: 0, dur: 0.8, gainFactor: 0.9 },     // D5
        { freq: 739.99, start: 0.14, dur: 0.85, gainFactor: 0.95 }, // F#5
        { freq: 880.00, start: 0.28, dur: 0.9, gainFactor: 1.0 },   // A5
        { freq: 1174.66, start: 0.42, dur: 1.2, gainFactor: 1.1 }   // D6
      ];

      notes.forEach(n => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.freq, now + n.start);

        const targetGain = baseGain * n.gainFactor;
        gain.gain.setValueAtTime(0.001, now + n.start);
        gain.gain.linearRampToValueAtTime(targetGain, now + n.start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + n.start + n.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + n.start);
        osc.stop(now + n.start + n.dur);
      });
    }
  } catch (e) {
    // Gracefully handle browser autoplay policies
  }
}

/**
 * Backward compatibility dual-tone chime
 */
export function playDualToneChime() {
  playAlarmSound(0.5, 'bell');
}


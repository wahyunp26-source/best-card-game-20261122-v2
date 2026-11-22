// Ember Court — tiny WebAudio blips. No sound files, no network.
// Every call is guarded: when audio is unavailable the game stays silent.

let ctx = null;

function ac() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    return ctx;
  } catch {
    return null;
  }
}

function blip(freq, dur, type = 'sine', vol = 0.12, when = 0) {
  const c = ac();
  if (!c) return;
  try {
    if (c.state === 'suspended') void c.resume();
    const t = c.currentTime + when;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + dur);
  } catch {
    // Silent is fine — never let a sound break the game.
  }
}

export const sfx = {
  play() { blip(520, 0.12, 'triangle', 0.14); blip(780, 0.1, 'sine', 0.1, 0.05); },
  draw() { blip(660, 0.07, 'sine', 0.08); },
  hit() { blip(180, 0.16, 'square', 0.12); blip(120, 0.2, 'sawtooth', 0.08, 0.03); },
  heal() { blip(440, 0.14, 'sine', 0.1); blip(660, 0.16, 'sine', 0.1, 0.08); },
  shield() { blip(300, 0.14, 'triangle', 0.1); },
  turn() { blip(392, 0.1, 'triangle', 0.1); blip(523, 0.12, 'triangle', 0.1, 0.07); },
  win() { [523, 659, 784, 1047].forEach((f, i) => blip(f, 0.22, 'triangle', 0.13, i * 0.12)); },
  lose() { [392, 330, 262, 196].forEach((f, i) => blip(f, 0.26, 'sawtooth', 0.07, i * 0.14)); },
  denied() { blip(140, 0.1, 'square', 0.08); },
};

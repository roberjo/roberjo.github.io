// A synthesized 14.4k dial-up: dial tone, DTMF, ringback, answer tone, and the
// handshake screech. Pure Web Audio, no sound files. ~7 seconds end to end.
//
// Frequencies are the real ones: North American dial tone (350 + 440 Hz), ringback
// (440 + 480 Hz), DTMF pairs, the 2100 Hz answer tone, and V.21-style FSK chatter.

const DTMF = {
  1: [697, 1209], 2: [697, 1336], 3: [697, 1477],
  4: [770, 1209], 5: [770, 1336], 6: [770, 1477],
  7: [852, 1209], 8: [852, 1336], 9: [852, 1477],
  0: [941, 1336],
};

// Timeline (seconds) shared with the on-screen text in bbs.js.
export const DIAL_TIMELINE = {
  dialTone: 0.0,
  digits: 0.9,
  ring: 2.25,
  answer: 3.6,
  handshake: 4.5,
  connect: 7.2,
};

export const PHONE = "1-205-555-0199";

export function playDialup(volume = 0.12) {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return { stop() {} };
  let ctx;
  try { ctx = new AC(); } catch (e) { return { stop() {} }; }
  const master = ctx.createGain();
  master.gain.value = volume;
  master.connect(ctx.destination);
  const t0 = ctx.currentTime + 0.05;

  function tone(freqs, start, dur, gain = 0.5, type = "sine") {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0 + start);
    g.gain.linearRampToValueAtTime(gain, t0 + start + 0.01);
    g.gain.setValueAtTime(gain, t0 + start + dur - 0.02);
    g.gain.linearRampToValueAtTime(0, t0 + start + dur);
    g.connect(master);
    freqs.forEach((f) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      o.connect(g);
      o.start(t0 + start);
      o.stop(t0 + start + dur + 0.05);
    });
  }

  function noise(start, dur, center, q, gain) {
    const len = Math.ceil(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = center;
    bp.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0 + start);
    g.gain.linearRampToValueAtTime(gain, t0 + start + 0.03);
    // Amplitude flutter: the "kshhhh" of training.
    for (let t = 0.05; t < dur - 0.05; t += 0.07) g.gain.setValueAtTime(gain * (0.55 + Math.random() * 0.45), t0 + start + t);
    g.gain.linearRampToValueAtTime(0, t0 + start + dur);
    src.connect(bp); bp.connect(g); g.connect(master);
    src.start(t0 + start);
    src.stop(t0 + start + dur);
  }

  function fsk(start, dur, f1, f2, rate, gain) {
    const o = ctx.createOscillator();
    o.type = "square";
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t0 + start);
    g.gain.setValueAtTime(0, t0 + start + dur);
    for (let t = 0; t < dur; t += 1 / rate) o.frequency.setValueAtTime(Math.random() < 0.5 ? f1 : f2, t0 + start + t);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 2600;
    o.connect(lp); lp.connect(g); g.connect(master);
    o.start(t0 + start);
    o.stop(t0 + start + dur);
  }

  const T = DIAL_TIMELINE;
  tone([350, 440], T.dialTone, 0.8, 0.35);
  PHONE.replace(/\D/g, "").split("").forEach((d, i) => tone(DTMF[d], T.digits + i * 0.12, 0.08, 0.45));
  tone([440, 480], T.ring, 1.0, 0.3);
  tone([2100], T.answer, 0.85, 0.35);
  fsk(T.handshake, 0.45, 980, 1180, 300, 0.12);
  tone([1650, 1850], T.handshake + 0.5, 0.25, 0.18);
  noise(T.handshake + 0.75, 1.2, 1800, 0.9, 0.9);
  tone([600, 1200], T.handshake + 1.95, 0.22, 0.2);
  noise(T.handshake + 2.2, 0.5, 2400, 1.4, 0.7);

  let stopped = false;
  const closeAt = setTimeout(() => { if (!stopped) ctx.close().catch(() => {}); }, (T.connect + 0.6) * 1000);
  return {
    stop() {
      if (stopped) return;
      stopped = true;
      clearTimeout(closeAt);
      ctx.close().catch(() => {});
    },
  };
}

export function beep(times = 3, volume = 0.1) {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  try {
    const ctx = new AC();
    const g = ctx.createGain();
    g.gain.value = volume;
    g.connect(ctx.destination);
    for (let i = 0; i < times; i++) {
      const o = ctx.createOscillator();
      o.type = "square";
      o.frequency.value = 880;
      o.connect(g);
      o.start(ctx.currentTime + i * 0.35);
      o.stop(ctx.currentTime + i * 0.35 + 0.15);
    }
    setTimeout(() => ctx.close().catch(() => {}), times * 400 + 200);
  } catch (e) { /* no audio, no problem */ }
}

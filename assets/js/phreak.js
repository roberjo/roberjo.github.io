// A phone-phreaking museum exhibit: the 2600 Hz Cap'n Crunch whistle, R1 multi-frequency
// (MF) "blue box" signaling, international ring cadences, and a degraded switch recording.
//
// All of it is simulation. In-band signaling like this only ever fooled 1960s-70s trunks;
// networks moved signaling out of band (CCIS, then SS7), which ended blue boxing for good.
// Nothing here places a call. The one network request is Lisbon's weather from Open-Meteo.

const MF = {
  1: [700, 900], 2: [700, 1100], 3: [900, 1100], 4: [700, 1300], 5: [900, 1300],
  6: [1100, 1300], 7: [700, 1500], 8: [900, 1500], 9: [1100, 1500], 0: [1300, 1500],
  KP: [1100, 1700], ST: [1500, 1700],
};

// UK numbers are from Ofcom's range reserved for TV and radio drama (020 7946 0xxx).
export const DESTINATIONS = {
  palace: {
    label: "Buckingham Palace switchboard (simulated)",
    country: "44", number: "2079460018", ring: "uk", lang: "en-GB",
    route: ["KP 044 ST", "Overseas gateway, White Plains NY", "TAT-6 transatlantic cable", "Mollison ISC, London", "London tandem", "Westminster local exchange"],
    script: () => [
      "Good afternoon, palace switchboard. Simulated, of course.",
      "I'm afraid His Majesty does not take calls placed with a two thousand six hundred hertz whistle.",
      "Shall I put you through to the Keeper of the Privy Purse? No? Very good. Mind the gap.",
    ],
  },
  heathrow: {
    label: "Heathrow flight information (simulated)",
    country: "44", number: "2079460452", ring: "uk", lang: "en-GB",
    route: ["KP 044 ST", "Overseas gateway, Pittsburgh PA", "TAT-5 transatlantic cable", "Faraday ISC, London", "Hillingdon tandem", "Heathrow airport PBX"],
    script: () => [
      "Welcome to Heathrow flight information. This is a simulation.",
      "All departures are delayed due to fog, as is tradition.",
      "Passengers for Lisbon, please proceed to gate nine. Passengers with blue boxes, please proceed to 1972.",
    ],
  },
  lisbon: {
    label: "Lisbon time and temperature (degraded recording)",
    country: "351", number: "210000000", ring: "pt", lang: "pt-PT",
    route: ["KP 0351 ST", "Overseas gateway, New York", "TAT-8 fiber (1988, so this is anachronistic)", "Lisbon international exchange", "Lisboa 'hora certa' service"],
    script: null, // built from live data
  },
};

let active = null; // { ctx, stopFns[] }

function audioCtx() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try { return new AC(); } catch (e) { return null; }
}

function hang() {
  if (active) {
    active.stopFns.forEach((f) => { try { f(); } catch (e) {} });
    active.ctx && active.ctx.close().catch(() => {});
    active = null;
  }
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

function begin() {
  hang();
  const ctx = audioCtx();
  active = { ctx, stopFns: [] };
  return active;
}

function tone(ctx, dest, freqs, start, dur, gain) {
  const g = ctx.createGain();
  const t0 = ctx.currentTime + start;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.008);
  g.gain.setValueAtTime(gain, t0 + Math.max(0.01, dur - 0.01));
  g.gain.linearRampToValueAtTime(0, t0 + dur);
  g.connect(dest);
  freqs.forEach((f) => {
    const o = ctx.createOscillator();
    o.frequency.value = f;
    o.connect(g);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  });
}

// Telephone-band hiss, crackle, and 50 Hz mains hum (European grid) for "degraded" lines.
function lineNoise(ctx, dest, seconds) {
  const len = Math.ceil(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    d[i] = (Math.random() * 2 - 1) * 0.35;
    if (Math.random() < 0.0004) d[i] = (Math.random() < 0.5 ? -1 : 1) * 0.9; // crackle
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 300;
  const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 3400;
  const g = ctx.createGain(); g.gain.value = 0.18;
  src.connect(hp); hp.connect(lp); lp.connect(g); g.connect(dest);
  const hum = ctx.createOscillator(); hum.frequency.value = 50;
  const hg = ctx.createGain(); hg.gain.value = 0.05;
  hum.connect(hg); hg.connect(dest);
  src.start(); hum.start();
  return () => { try { src.stop(); hum.stop(); } catch (e) {} };
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ */

export const phreak = {
  trunkSeized: false,

  hangUp() { hang(); this.trunkSeized = false; },

  // 2600 Hz for ~1.2 s, then the "kerchunk" of the far end going idle.
  async whistle(sound) {
    const a = begin();
    if (sound && a.ctx) {
      const out = a.ctx.createGain(); out.gain.value = 0.12; out.connect(a.ctx.destination);
      tone(a.ctx, out, [2600], 0, 1.2, 0.6);
      // kerchunk: a short low thump plus click
      tone(a.ctx, out, [90, 180], 1.3, 0.09, 0.8);
      tone(a.ctx, out, [1200], 1.32, 0.02, 0.4);
    }
    await wait(1500);
    this.trunkSeized = true;
  },

  // R1 MF: KP, digits, ST. Returns the dialed string.
  async mf(sound, digits) {
    const a = active && active.ctx ? active : begin();
    const seq = ["KP", ...digits.split(""), "ST"];
    if (sound && a.ctx) {
      const out = a.ctx.createGain(); out.gain.value = 0.12; out.connect(a.ctx.destination);
      let t = 0.05;
      seq.forEach((k) => { const dur = k === "KP" ? 0.1 : 0.06; tone(a.ctx, out, MF[k], t, dur, 0.5); t += dur + 0.06; });
      await wait(t * 1000 + 100);
    } else {
      await wait(400);
    }
    return seq.join(" ");
  },

  async ring(sound, kind, rings = 2) {
    const a = active && active.ctx ? active : begin();
    if (!sound || !a.ctx) { await wait(800); return; }
    const out = a.ctx.createGain(); out.gain.value = 0.1; out.connect(a.ctx.destination);
    let t = 0.1;
    for (let i = 0; i < rings; i++) {
      if (kind === "uk") {
        // UK double ring: 400+450 Hz, 0.4 on, 0.2 off, 0.4 on, 2 off
        tone(a.ctx, out, [400, 450], t, 0.4, 0.5); tone(a.ctx, out, [400, 450], t + 0.6, 0.4, 0.5); t += 3.0;
      } else {
        // Portugal: 425 Hz, 1 on, 5 off (shortened)
        tone(a.ctx, out, [425], t, 1.0, 0.5); t += 2.2;
      }
    }
    await wait(t * 1000 - 600);
  },

  // Speak lines with a degraded-line bed underneath. Resolves when done (or after a timeout).
  async speak(sound, lines, lang) {
    const a = active && active.ctx ? active : begin();
    const synth = window.speechSynthesis;
    const total = lines.join(" ").length;
    let stopNoise = () => {};
    if (sound && a.ctx) stopNoise = lineNoise(a.ctx, a.ctx.destination, Math.min(30, 3 + total / 12));
    a.stopFns.push(stopNoise);
    if (!sound || !synth || typeof SpeechSynthesisUtterance === "undefined") { await wait(600); stopNoise(); return false; }

    const voices = await new Promise((r) => {
      const v = synth.getVoices();
      if (v.length) return r(v);
      const t = setTimeout(() => r(synth.getVoices()), 600);
      synth.addEventListener("voiceschanged", () => { clearTimeout(t); r(synth.getVoices()); }, { once: true });
    });
    const voice = voices.find((v) => v.lang === lang) || voices.find((v) => v.lang && v.lang.startsWith(lang.slice(0, 2)));
    // A Portuguese recording read by an English voice would be wrong; stay silent and show the transcript.
    if (!voice) { await wait(600); stopNoise(); return false; }
    const done = new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(lines.join(" "));
      u.lang = voice ? voice.lang : lang;
      if (voice) u.voice = voice;
      u.rate = 0.92; u.pitch = 0.85; u.volume = 0.9;
      u.onend = resolve; u.onerror = resolve;
      synth.cancel();
      synth.speak(u);
    });
    await Promise.race([done, wait(Math.min(20000, 4000 + total * 90))]);
    stopNoise();
    return !!voice;
  },

  beep(sound) {
    const a = active && active.ctx ? active : begin();
    if (sound && a.ctx) tone(a.ctx, a.ctx.destination, [1000], 0, 0.5, 0.05);
  },
};

/* ------------------------------------------------------------------ */
/* Lisbon: real local time, live temperature                           */
/* ------------------------------------------------------------------ */

export function lisbonTime(now = new Date()) {
  const fmt = (opts) => new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Lisbon", ...opts }).format(now);
  const hh = Number(fmt({ hour: "numeric", hourCycle: "h23" }));
  const mm = Number(fmt({ minute: "numeric" }));
  return { hh, mm, display: `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}` };
}

export async function lisbonTemperature() {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const r = await fetch("https://api.open-meteo.com/v1/forecast?latitude=38.72&longitude=-9.14&current=temperature_2m", { signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) return null;
    const j = await r.json();
    const c = j && j.current && j.current.temperature_2m;
    return typeof c === "number" ? Math.round(c) : null;
  } catch (e) {
    return null;
  }
}

const PT_UNITS = ["zero", "uma", "duas", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "catorze", "quinze", "dezasseis", "dezassete", "dezoito", "dezanove"];
const PT_TENS = ["", "", "vinte", "trinta", "quarenta", "cinquenta"];

// Portuguese number words, feminine for hours ("uma hora", "duas horas").
export function ptNumber(n, feminine = true) {
  let w;
  if (n < 20) w = PT_UNITS[n];
  else w = PT_TENS[Math.floor(n / 10)] + (n % 10 ? " e " + PT_UNITS[n % 10] : "");
  if (!feminine) w = w.replace(/\buma\b/, "um").replace(/\bduas\b/, "dois");
  return w;
}

// "É meia-noite", "É uma hora", "É meio-dia", "São quinze horas".
function ptHour(h) {
  if (h === 0) return "É meia-noite";
  if (h === 12) return "É meio-dia";
  if (h === 1) return "É uma hora";
  return `São ${ptNumber(h)} horas`;
}

export function lisbonScript(time, tempC) {
  const pt = [
    "Hora certa.",
    `${ptHour(time.hh)}${time.mm === 0 ? " em ponto" : ` e ${ptNumber(time.mm, false)} ${time.mm === 1 ? "minuto" : "minutos"}`}.`,
    tempC === null ? "Temperatura indisponível." : `Temperatura em Lisboa: ${tempC < 0 ? "menos " : ""}${ptNumber(Math.abs(tempC), false)} ${Math.abs(tempC) === 1 ? "grau" : "graus"}.`,
  ];
  const en = [
    "Time check.",
    `At the tone, the time in Lisbon will be ${time.display}.`,
    tempC === null ? "Temperature unavailable." : `Temperature in Lisbon: ${tempC} °C.`,
  ];
  return { pt, en };
}

// Randomly degrade a transcript line, the way a worn tape loop drops syllables.
export function degrade(text, amount = 0.06) {
  return text.split("").map((ch) => (ch !== " " && Math.random() < amount ? "░" : ch)).join("");
}

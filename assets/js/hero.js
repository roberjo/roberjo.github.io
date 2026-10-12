// Hero visuals: a WebGL "data field" shader behind the hero, and an interactive
// 3D network of projects grouped by area. No libraries.
import { HUBS, PROJECTS, PROFILE } from "./data.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Deterministic PRNG so the graph looks the same on every visit.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ */
/* Shader background                                                   */
/* ------------------------------------------------------------------ */

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform vec3 uBg;
uniform vec3 uA;
uniform vec3 uB;
uniform float uStrength;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 17.0; a *= 0.5; }
  return v;
}
void main(){
  vec2 uv = gl_FragCoord.xy / uRes.xy;
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes.xy) / uRes.y;
  float t = uTime * 0.045;
  vec2 m = (uMouse - 0.5) * 0.35;
  vec2 q = vec2(fbm(p * 1.6 + t), fbm(p * 1.6 - t + 4.2));
  vec2 r = vec2(fbm(p * 2.2 + 3.0 * q + m + t * 1.3), fbm(p * 2.2 + 3.0 * q - m + 7.7));
  float f = fbm(p * 1.8 + 2.5 * r);
  // Fine scanline grid for a "terminal" texture.
  float grid = smoothstep(0.985, 1.0, abs(sin(gl_FragCoord.y * 0.5))) * 0.04;
  vec3 col = mix(uBg, uA, smoothstep(0.35, 0.95, f) * uStrength);
  col = mix(col, uB, smoothstep(0.55, 1.0, r.x * f) * uStrength * 0.8);
  // Vignette toward the edges and bottom so content stays readable.
  float vig = smoothstep(1.25, 0.25, length((uv - vec2(0.62, 0.62)) * vec2(1.2, 1.6)));
  col = mix(uBg, col, vig) + grid * uStrength;
  gl_FragColor = vec4(col, 1.0);
}`;

function startShader(canvas) {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false });
  if (!gl) { canvas.remove(); return null; }

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (e) {
    canvas.remove();
    return null;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const u = {};
  ["uRes", "uTime", "uMouse", "uBg", "uA", "uB", "uStrength"].forEach((n) => (u[n] = gl.getUniformLocation(prog, n)));

  const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  window.addEventListener("pointermove", (e) => {
    mouse.tx = e.clientX / window.innerWidth;
    mouse.ty = 1 - e.clientY / window.innerHeight;
  }, { passive: true });

  function applyTheme() {
    const light = document.documentElement.getAttribute("data-theme") === "light" && !document.documentElement.hasAttribute("data-mainframe");
    const bg = hexToRgb(cssVar("--bg")).map((v) => v / 255);
    const a = hexToRgb(cssVar("--accent")).map((v) => v / 255);
    const b = hexToRgb(cssVar("--violet")).map((v) => v / 255);
    gl.uniform3fv(u.uBg, bg);
    gl.uniform3fv(u.uA, a);
    gl.uniform3fv(u.uB, b);
    gl.uniform1f(u.uStrength, light ? 0.22 : 0.38);
  }

  function resize() {
    // Half resolution: the field is soft, and this keeps it cheap on laptops.
    const scale = Math.min(window.devicePixelRatio || 1, 2) * 0.5;
    const w = Math.max(1, Math.floor(canvas.clientWidth * scale));
    const h = Math.max(1, Math.floor(canvas.clientHeight * scale));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    gl.uniform2f(u.uRes, w, h);
  }

  applyTheme();
  resize();
  const t0 = performance.now();
  function frame(now) {
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;
    gl.uniform1f(u.uTime, (now - t0) / 1000);
    gl.uniform2f(u.uMouse, mouse.x, mouse.y);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  return { frame, resize, applyTheme };
}

/* ------------------------------------------------------------------ */
/* 3D project network                                                  */
/* ------------------------------------------------------------------ */

function buildGraph() {
  const rand = mulberry32(1117485);
  const nodes = [];
  const edges = [];
  const core = { id: "core", label: PROFILE.handle, kind: "core", x: 0, y: 0, z: 0, r: 9 };
  nodes.push(core);

  // Hubs on a tetrahedron around the core.
  const tetra = [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]];
  const hubById = {};
  HUBS.forEach((h, i) => {
    const [x, y, z] = tetra[i].map((v) => v * 92);
    const node = { id: "hub-" + h.id, label: h.label, kind: "hub", hub: h, x, y, z, r: 6.5 };
    hubById[h.id] = node;
    nodes.push(node);
    edges.push({ a: core, b: node, w: 1 });
  });

  // Projects cluster around their primary hub; secondary tags add extra edges.
  PROJECTS.forEach((p) => {
    const home = hubById[p.tags[0]];
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(2 * rand() - 1);
    const rad = 38 + rand() * 30;
    const node = {
      id: p.id, label: p.id, kind: "project", project: p, hub: home.hub,
      x: home.x * 1.25 + rad * Math.sin(phi) * Math.cos(theta),
      y: home.y * 1.25 + rad * Math.sin(phi) * Math.sin(theta),
      z: home.z * 1.25 + rad * Math.cos(phi),
      r: p.featured ? 4.6 : 3,
    };
    nodes.push(node);
    p.tags.forEach((t, i) => edges.push({ a: hubById[t], b: node, w: i === 0 ? 0.8 : 0.35 }));
  });

  // Ambient "stars" so the scene has depth.
  const dust = [];
  for (let i = 0; i < 140; i++) {
    const theta = rand() * Math.PI * 2, phi = Math.acos(2 * rand() - 1), rad = 170 + rand() * 120;
    dust.push({ x: rad * Math.sin(phi) * Math.cos(theta), y: rad * Math.sin(phi) * Math.sin(theta), z: rad * Math.cos(phi), s: rand() });
  }
  return { nodes, edges, dust, rand };
}

function startGraph(canvas, tooltip) {
  const ctx = canvas.getContext("2d");
  const { nodes, edges, dust, rand } = buildGraph();
  const state = { yaw: 0.6, pitch: -0.25, vyaw: reduceMotion ? 0 : 0.0016, vpitch: 0, dragging: false, lastX: 0, lastY: 0, hover: null, w: 0, h: 0, dpr: 1, scale: 1 };
  const packets = [];
  let colors = {};
  const glowCache = new Map();

  function readColors() {
    colors = {
      text: cssVar("--text"), muted: cssVar("--text-muted"), faint: cssVar("--text-faint"),
      accent: cssVar("--accent"), line: cssVar("--border-strong"),
    };
    HUBS.forEach((h) => (colors[h.id] = cssVar(h.color)));
    glowCache.clear();
  }

  // Pre-rendered radial glow sprites; much cheaper than shadowBlur per frame.
  function glow(color) {
    if (glowCache.has(color)) return glowCache.get(color);
    const s = 64, c = document.createElement("canvas");
    c.width = c.height = s;
    const g = c.getContext("2d");
    const [r, gg, b] = hexToRgb(color);
    const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grad.addColorStop(0, `rgba(${r},${gg},${b},0.9)`);
    grad.addColorStop(0.25, `rgba(${r},${gg},${b},0.35)`);
    grad.addColorStop(1, `rgba(${r},${gg},${b},0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
    glowCache.set(color, c);
    return c;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.w = rect.width; state.h = rect.height;
    canvas.width = Math.round(rect.width * state.dpr);
    canvas.height = Math.round(rect.height * state.dpr);
    state.scale = Math.min(rect.width, rect.height) / 420;
  }

  function project(n) {
    const cy = Math.cos(state.yaw), sy = Math.sin(state.yaw);
    const cp = Math.cos(state.pitch), sp = Math.sin(state.pitch);
    const x1 = n.x * cy - n.z * sy;
    const z1 = n.x * sy + n.z * cy;
    const y2 = n.y * cp - z1 * sp;
    const z2 = n.y * sp + z1 * cp;
    const f = 560 / (560 + z2);
    return { sx: state.w / 2 + x1 * f * state.scale, sy: state.h / 2 + y2 * f * state.scale, f, z: z2 };
  }

  function colorFor(n) {
    if (n.kind === "core") return colors.text;
    return colors[n.hub.id] || colors.accent;
  }

  function spawnPacket() {
    const e = edges[Math.floor(rand() * edges.length)];
    const forward = rand() > 0.5;
    packets.push({ e, t: 0, speed: 0.006 + rand() * 0.01, forward });
  }

  function draw() {
    const { w, h, dpr } = state;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Dust.
    ctx.fillStyle = colors.faint;
    dust.forEach((d) => {
      const p = project(d);
      if (p.f <= 0) return;
      ctx.globalAlpha = 0.15 + 0.35 * d.s * Math.min(1, p.f);
      ctx.fillRect(p.sx, p.sy, 1.2, 1.2);
    });

    nodes.forEach((n) => (n.p = project(n)));

    // Edges, faded by depth; hovered node's edges highlighted.
    edges.forEach((e) => {
      const hot = state.hover && (e.a === state.hover || e.b === state.hover);
      const depth = Math.min(1, (e.a.p.f + e.b.p.f) / 2);
      ctx.globalAlpha = hot ? 0.9 : (0.22 + 0.45 * e.w) * depth;
      ctx.strokeStyle = hot ? colorFor(e.b) : colors.line;
      ctx.lineWidth = hot ? 1.4 : 1;
      ctx.beginPath();
      ctx.moveTo(e.a.p.sx, e.a.p.sy);
      ctx.lineTo(e.b.p.sx, e.b.p.sy);
      ctx.stroke();
    });

    // Packets flowing along edges (event-driven, naturally).
    packets.forEach((k) => {
      const a = k.forward ? k.e.a : k.e.b, b = k.forward ? k.e.b : k.e.a;
      const x = a.p.sx + (b.p.sx - a.p.sx) * k.t;
      const y = a.p.sy + (b.p.sy - a.p.sy) * k.t;
      const c = colorFor(k.e.b);
      ctx.globalAlpha = Math.sin(Math.PI * k.t);
      ctx.drawImage(glow(c), x - 7, y - 7, 14, 14);
    });

    // Nodes, back to front.
    const sorted = nodes.slice().sort((a, b) => b.p.z - a.p.z);
    sorted.forEach((n) => {
      const c = colorFor(n);
      const r = n.r * n.p.f * state.scale * (state.hover === n ? 1.5 : 1);
      const depth = Math.max(0.25, Math.min(1, n.p.f));
      ctx.globalAlpha = depth;
      const g = r * (n.kind === "project" ? 5 : 6);
      ctx.drawImage(glow(c), n.p.sx - g / 2, n.p.sy - g / 2, g, g);
      ctx.globalAlpha = Math.min(1, depth + 0.2);
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(n.p.sx, n.p.sy, Math.max(1.5, r), 0, Math.PI * 2);
      ctx.fill();

      if (n.kind !== "project" || state.hover === n) {
        ctx.globalAlpha = n.kind === "project" ? 1 : 0.85 * depth;
        ctx.fillStyle = n.kind === "project" ? colors.text : c;
        ctx.font = `${n.kind === "core" ? 600 : 500} ${n.kind === "project" ? 12 : 11}px "JetBrains Mono", monospace`;
        ctx.textAlign = "center";
        ctx.fillText(n.kind === "hub" ? n.label.toUpperCase() : n.label, n.p.sx, n.p.sy - r - 8);
      }
    });
    ctx.globalAlpha = 1;
  }

  function step() {
    if (!state.dragging) {
      state.yaw += state.vyaw;
      state.pitch += state.vpitch;
      state.vpitch *= 0.94;
      // Ease back to cruising speed after a fling.
      const cruise = reduceMotion ? 0 : 0.0016;
      state.vyaw += (cruise - state.vyaw) * 0.02;
      state.pitch = Math.max(-1.1, Math.min(1.1, state.pitch));
    }
    if (!reduceMotion) {
      if (packets.length < 26 && rand() < 0.25) spawnPacket();
      for (let i = packets.length - 1; i >= 0; i--) {
        packets[i].t += packets[i].speed;
        if (packets[i].t >= 1) packets.splice(i, 1);
      }
    }
    draw();
  }

  function pick(x, y) {
    let best = null, bestD = 18;
    nodes.forEach((n) => {
      if (n.kind !== "project" || !n.p) return;
      const d = Math.hypot(n.p.sx - x, n.p.sy - y);
      if (d < bestD) { bestD = d; best = n; }
    });
    return best;
  }

  function local(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function showTip(n, x, y) {
    if (!n) { tooltip.hidden = true; canvas.style.cursor = "grab"; return; }
    tooltip.innerHTML = "";
    const name = document.createElement("strong"); name.textContent = n.project.id;
    const stack = document.createElement("span"); stack.textContent = n.project.stack;
    const hint = document.createElement("em"); hint.textContent = "click to view";
    tooltip.append(name, stack, hint);
    tooltip.hidden = false;
    const left = Math.min(x + 16, state.w - tooltip.offsetWidth - 8);
    tooltip.style.transform = `translate(${Math.max(8, left)}px, ${Math.max(8, y - tooltip.offsetHeight - 12)}px)`;
    canvas.style.cursor = "pointer";
  }

  let downAt = null;
  canvas.addEventListener("pointerdown", (e) => {
    downAt = { x: e.clientX, y: e.clientY };
    if (e.pointerType === "mouse") {
      state.dragging = true;
      state.lastX = e.clientX; state.lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = "grabbing";
    }
  });
  canvas.addEventListener("pointermove", (e) => {
    if (state.dragging) {
      const dx = e.clientX - state.lastX, dy = e.clientY - state.lastY;
      state.yaw += dx * 0.006; state.pitch += dy * 0.006;
      state.vyaw = dx * 0.0009; state.vpitch = dy * 0.0006;
      state.lastX = e.clientX; state.lastY = e.clientY;
      return;
    }
    if (e.pointerType !== "mouse") return;
    const { x, y } = local(e);
    state.hover = pick(x, y);
    showTip(state.hover, x, y);
  });
  function endDrag(e) {
    state.dragging = false;
    canvas.style.cursor = state.hover ? "pointer" : "grab";
    const moved = downAt ? Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) : 99;
    downAt = null;
    if (moved < 6) {
      const { x, y } = local(e);
      const n = pick(x, y);
      if (n) document.dispatchEvent(new CustomEvent("project:focus", { detail: n.project.id }));
    }
  }
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", () => { state.dragging = false; downAt = null; });
  canvas.addEventListener("pointerleave", () => { if (!state.dragging) { state.hover = null; showTip(null); } });

  readColors();
  resize();
  return { step, resize, readColors };
}

/* ------------------------------------------------------------------ */
/* Loop                                                                */
/* ------------------------------------------------------------------ */

export function initHero() {
  const hero = document.querySelector(".hero");
  const bg = document.getElementById("hero-shader");
  const graphCanvas = document.getElementById("hero-graph");
  const tip = document.getElementById("graph-tip");
  if (!hero || !graphCanvas) return;

  const shader = bg ? startShader(bg) : null;
  const graph = startGraph(graphCanvas, tip);
  if (!shader) hero.classList.add("no-webgl");

  // Paint one frame immediately: a WebGL canvas is black until its first draw, and
  // requestAnimationFrame doesn't fire at all in hidden or backgrounded tabs.
  shader && shader.frame(performance.now());
  graph.step();

  let visible = true, running = false;
  function loop(now) {
    if (!visible || document.hidden) { running = false; return; }
    shader && shader.frame(now);
    graph.step();
    requestAnimationFrame(loop);
  }
  function kick() {
    if (!running && visible && !document.hidden) { running = true; requestAnimationFrame(loop); }
  }

  if (reduceMotion) {
    // One still frame each; nothing animates.
    requestAnimationFrame((now) => { shader && shader.frame(now); graph.step(); });
  } else {
    new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; kick(); }).observe(hero);
    document.addEventListener("visibilitychange", kick);
    kick();
  }

  let rt;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => { shader && shader.resize(); graph.resize(); if (reduceMotion) graph.step(); }, 120);
  });
  new MutationObserver(() => {
    shader && shader.applyTheme();
    graph.readColors();
    if (reduceMotion) { shader && shader.frame(performance.now()); graph.step(); }
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-mainframe"] });
}

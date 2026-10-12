// Page wiring: nav, theme, command palette, project focus, live GitHub activity,
// cursor spotlight, reveals, and a few things that only show up if you go looking.
import { PROJECTS, SECTIONS, PROFILE } from "./data.js";
import { initHero } from "./hero.js";
import { initShell } from "./shell.js";
import { getGithubSummary, timeAgo } from "./github.js";

const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
root.classList.add("js");

/* ---------- Theme ---------- */
function setTheme(next) {
  root.setAttribute("data-theme", next);
  try { localStorage.setItem("theme", next); } catch (e) {}
}
function toggleTheme() { setTheme(root.getAttribute("data-theme") === "light" ? "dark" : "light"); }
document.getElementById("theme-toggle")?.addEventListener("click", toggleTheme);

/* ---------- Toast ---------- */
const toastEl = document.getElementById("toast");
let toastTimer;
function toast(msg) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("is-on"), 2600);
}

/* ---------- Mobile menu ---------- */
const menuBtn = document.getElementById("menu-toggle");
const links = document.getElementById("nav-links");
function closeMenu() {
  if (!links || !menuBtn) return;
  links.classList.remove("is-open");
  menuBtn.setAttribute("aria-expanded", "false");
  menuBtn.setAttribute("aria-label", "Open menu");
}
menuBtn?.addEventListener("click", () => {
  const open = links.classList.toggle("is-open");
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
});
links?.addEventListener("click", (e) => { if (e.target.closest("a")) closeMenu(); });

/* ---------- Nav state, scroll progress, scroll spy ---------- */
const nav = document.querySelector(".nav");
const progress = document.getElementById("scroll-progress");
function onScroll() {
  nav?.classList.toggle("is-scrolled", window.scrollY > 8);
  if (progress) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
  }
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

const navLinks = Array.from(document.querySelectorAll(".nav__links a"));
if ("IntersectionObserver" in window && navLinks.length) {
  const byId = Object.fromEntries(navLinks.map((a) => [a.getAttribute("href").slice(1), a]));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => a.classList.remove("is-active"));
      byId[entry.target.id]?.classList.add("is-active");
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  Object.keys(byId).forEach((id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
}

/* ---------- Project filters ---------- */
const chips = Array.from(document.querySelectorAll(".chip[data-filter]"));
const items = Array.from(document.querySelectorAll("#project-list [data-tags], #mini-list [data-tags]"));
function applyFilter(filter) {
  chips.forEach((c) => {
    const active = c.getAttribute("data-filter") === filter;
    c.classList.toggle("is-active", active);
    c.setAttribute("aria-pressed", String(active));
  });
  items.forEach((item) => {
    const tags = item.getAttribute("data-tags").split(" ");
    item.classList.toggle("is-hidden", filter !== "all" && !tags.includes(filter));
  });
}
chips.forEach((chip) => chip.addEventListener("click", () => applyFilter(chip.getAttribute("data-filter"))));

/* ---------- Focus a project (from the graph, palette, or shell) ---------- */
document.addEventListener("project:focus", (e) => {
  const card = document.getElementById("p-" + e.detail);
  if (!card) return;
  applyFilter("all");
  card.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  card.classList.remove("is-flash");
  void card.offsetWidth;
  card.classList.add("is-flash");
});

/* ---------- Cursor spotlight on cards ---------- */
if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
  document.addEventListener("pointermove", (e) => {
    const card = e.target.closest?.(".card");
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  }, { passive: true });
}

/* ---------- Copy email ---------- */
async function copyEmail() {
  try { await navigator.clipboard.writeText(PROFILE.email); toast(`Copied ${PROFILE.email}`); }
  catch (e) { toast(PROFILE.email); }
}
document.getElementById("copy-email")?.addEventListener("click", copyEmail);

/* ---------- Live GitHub activity ---------- */
async function renderActivity() {
  const langsEl = document.getElementById("activity-langs");
  const recentEl = document.getElementById("activity-recent");
  const metaEl = document.getElementById("activity-meta");
  if (!langsEl || !recentEl) return;
  const s = await getGithubSummary();
  if (!s) {
    if (metaEl) metaEl.textContent = "GitHub's API is resting (rate limits). Showing the static view.";
    return;
  }
  langsEl.innerHTML = "";
  s.languages.slice(0, 7).forEach((l, i) => {
    const row = document.createElement("li");
    row.className = "lang";
    row.style.setProperty("--pct", l.pct + "%");
    row.style.setProperty("--i", i);
    const name = document.createElement("span"); name.className = "lang__name"; name.textContent = l.name;
    const bar = document.createElement("span"); bar.className = "lang__bar"; bar.setAttribute("aria-hidden", "true");
    const pct = document.createElement("span"); pct.className = "lang__pct"; pct.textContent = l.pct + "%";
    row.append(name, bar, pct);
    langsEl.appendChild(row);
  });
  recentEl.innerHTML = "";
  s.recent.slice(0, 6).forEach((r) => {
    const li = document.createElement("li");
    const a = document.createElement("a"); a.href = r.url; a.textContent = r.name;
    const meta = document.createElement("span"); meta.className = "recent__meta";
    meta.textContent = [r.language, timeAgo(r.pushed)].filter(Boolean).join(" · ");
    li.append(a, meta);
    recentEl.appendChild(li);
  });
  if (metaEl) metaEl.textContent = `${s.repoCount} public repositories · fetched live from api.github.com`;
}
const activity = document.getElementById("activity");
if (activity && "IntersectionObserver" in window) {
  const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) { renderActivity(); io.disconnect(); } }, { rootMargin: "300px" });
  io.observe(activity);
} else {
  renderActivity();
}

/* ---------- Command palette (⌘K / Ctrl+K) ---------- */
const palette = document.getElementById("palette");
const pIn = document.getElementById("palette-in");
const pList = document.getElementById("palette-list");
let pItems = [], pSel = 0;

const shell = initShell();

const ACTIONS = [
  ...SECTIONS.map((s) => ({ label: `Go to ${s.label}`, hint: "section", run: () => document.getElementById(s.id)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }) })),
  ...PROJECTS.map((p) => ({ label: p.id, hint: p.tags.join(" · "), run: () => document.dispatchEvent(new CustomEvent("project:focus", { detail: p.id })) })),
  { label: "Open the shell", hint: "`", run: () => shell?.open() },
  { label: "Toggle theme", hint: "action", run: toggleTheme },
  { label: "Copy email address", hint: "action", run: copyEmail },
  { label: "Send an email", hint: "mailto", run: () => { window.location.href = `mailto:${PROFILE.email}`; } },
  { label: "GitHub profile", hint: "link", run: () => window.open(PROFILE.github, "_blank", "noopener") },
  { label: "LinkedIn profile", hint: "link", run: () => window.open(PROFILE.linkedin, "_blank", "noopener") },
];

function score(q, label) {
  // Subsequence match; consecutive and early matches score higher.
  q = q.toLowerCase(); label = label.toLowerCase();
  if (!q) return 1;
  let s = 0, li = 0, streak = 0;
  for (const ch of q) {
    const at = label.indexOf(ch, li);
    if (at === -1) return 0;
    streak = at === li ? streak + 1 : 0;
    s += 1 + streak * 2 + (at === 0 ? 3 : 0);
    li = at + 1;
  }
  return s;
}

function renderPalette() {
  const q = pIn.value.trim();
  pItems = ACTIONS.map((a) => ({ a, s: score(q, a.label) })).filter((x) => x.s > 0).sort((x, y) => y.s - x.s).slice(0, 9).map((x) => x.a);
  pSel = Math.min(pSel, Math.max(0, pItems.length - 1));
  pList.innerHTML = "";
  pItems.forEach((a, i) => {
    const li = document.createElement("li");
    li.id = "pal-opt-" + i;
    li.setAttribute("role", "option");
    li.setAttribute("aria-selected", String(i === pSel));
    li.className = i === pSel ? "is-sel" : "";
    const l = document.createElement("span"); l.textContent = a.label;
    const h = document.createElement("span"); h.className = "palette__hint"; h.textContent = a.hint;
    li.append(l, h);
    li.addEventListener("click", () => { closePalette(); a.run(); });
    li.addEventListener("pointermove", () => { if (pSel !== i) { pSel = i; renderPalette(); } });
    pList.appendChild(li);
  });
  pIn.setAttribute("aria-activedescendant", pItems.length ? "pal-opt-" + pSel : "");
}
function openPalette() {
  if (!palette) return;
  pIn.value = ""; pSel = 0; renderPalette();
  palette.showModal ? palette.showModal() : palette.setAttribute("open", "");
  setTimeout(() => pIn.focus(), 0);
}
function closePalette() { palette?.close ? palette.close() : palette?.removeAttribute("open"); }
pIn?.addEventListener("input", () => { pSel = 0; renderPalette(); });
pIn?.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown") { pSel = (pSel + 1) % Math.max(1, pItems.length); renderPalette(); e.preventDefault(); }
  else if (e.key === "ArrowUp") { pSel = (pSel - 1 + pItems.length) % Math.max(1, pItems.length); renderPalette(); e.preventDefault(); }
  else if (e.key === "Enter") { const a = pItems[pSel]; if (a) { closePalette(); a.run(); } e.preventDefault(); }
});
palette?.addEventListener("click", (e) => { if (e.target === palette) closePalette(); });
document.querySelectorAll("[data-open-palette]").forEach((b) => b.addEventListener("click", openPalette));
document.querySelectorAll("[data-open-shell]").forEach((b) => b.addEventListener("click", () => shell?.open()));

/* ---------- Global keys ---------- */
const typing = (el) => el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
let konami = 0;
document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); palette?.open ? closePalette() : openPalette(); return; }
  if (e.key === "Escape") closeMenu();
  if (typing(e.target)) return;
  if (e.key === "`") { e.preventDefault(); shell?.isOpen() ? shell.close() : shell?.open(); return; }

  konami = e.key === KONAMI[konami] || e.key.toLowerCase() === KONAMI[konami] ? konami + 1 : (e.key === KONAMI[0] ? 1 : 0);
  if (konami === KONAMI.length) {
    konami = 0;
    const on = root.toggleAttribute("data-mainframe");
    toast(on ? "IPL complete. Welcome to MAINFRAME MODE (3270 green, as nature intended)." : "Back to the 21st century.");
  }
});

/* ---------- Reveals ---------- */
if (!reduceMotion && "IntersectionObserver" in window) {
  const targets = document.querySelectorAll(".section__title, .card, .principles li, .stack__group, .timeline__item");
  const reveal = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add("is-visible"); obs.unobserve(entry.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  targets.forEach((el) => { el.classList.add("reveal"); reveal.observe(el); });
}

// SVG <animateMotion> ignores CSS, so pause the architecture packets explicitly.
if (reduceMotion) document.querySelectorAll(".arch__svg").forEach((svg) => svg.pauseAnimations?.());

const year = document.getElementById("year");
if (year) year.textContent = String(new Date().getFullYear());

initHero();

/* ---------- For those who open the developer tools ---------- */
// Room IV of the quest lives here. If you're reading this in the source instead of the console:
// that works too. Room IV's fragment prints below, one byte per group.
(function () {
  const big = "font: 700 14px/1.6 'JetBrains Mono', monospace; color: #38d9c0;";
  const dim = "font: 12px/1.6 'JetBrains Mono', monospace; color: #9aa7b6;";
  const amb = "font: 12px/1.6 'JetBrains Mono', monospace; color: #f5b454;";
  console.log("%c┌─ THE CONSOLE ABYSS ──────────────────────────────┐", big);
  console.log("%cYou found the room developers never show the client.", dim);
  console.log("%cGDIT, 2010: automated builds. Regions, 2013 → now: keeping it all up.", dim);
  console.log("%cFragment IV (8 bits per letter):", dim);
  console.log("%c01010010 01010101 01001110 01001110 01001001 01001110 01000111", amb);
  console.log("%cDecode it, then press ` on the page and type: take <WORD>", dim);
  console.log("%cLost? In the shell, type: quest", dim);
  console.log("%c└──────────────────────────────────────────────────┘", big);
})();

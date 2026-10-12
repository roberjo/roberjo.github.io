// The site shell: a small terminal with real commands, tab completion, history,
// and (for the curious) a text adventure. Not every command is listed in `help`.
//
//   "Not all those who wander are lost. Some are just reading the source."
//
import { PROFILE, PROJECTS, SKILLS, CAREER, EDUCATION } from "./data.js";
import { getGithubSummary } from "./github.js";

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* ------------------------------------------------------------------ */
/* The quest. Answers are stored as SHA-256 digests: reading this file  */
/* tells you where to look, not what you'll find. No spoilers here.     */
/* ------------------------------------------------------------------ */

const ROOMS = [
  {
    n: "I", name: "The Markup Gate", era: "1999 · Auburn University",
    hash: "1dd17190a2f261044d8e04d099db4ebe2754ff402e5c2b8b759498176ddd343a",
    look: "Every career starts with a page of HTML. This one starts with the page you're reading. " +
          "Its first lines aren't for browsers; they're for people who press View Source.",
    hints: [
      "Right-click the page and choose View Page Source (or press Ctrl/Cmd+U).",
      "Read the comment at the very top. One line ends in '=='; that's Base64.",
      "In a browser console: atob('the thing ending in ==').",
    ],
    lore:
      "1999. Before CSS grid, before jQuery, before 'full stack' was a job title, Auburn's Cellular and " +
      "Molecular Biosciences department needed a website. A student hand-wrote it and kept the web server " +
      "alive between classes. Table layouts teach humility early. War Eagle.",
  },
  {
    n: "II", name: "The Style Forge", era: "2011 · Kelsey Advertising & Design",
    hash: "a3e5514bcfd79e7649e30fbf98826208f3da47833b4223b68cff2db23beb3801",
    look: "An agency's craft lives in its stylesheets. Somewhere in this site's CSS is a custom property " +
          "that no element ever uses. Agencies call that 'brand equity'.",
    hints: [
      "Open /assets/css/style.css and look near the top, among the tokens.",
      "Find the variable that starts with --fragment. Its value is rotated.",
      "ROT13: shift every letter 13 places. Do it twice and you're back where you started.",
    ],
    lore:
      "2011–2013, Kelsey Advertising & Design, LaGrange, GA: benefits and HR platforms for regional and " +
      "national clients, Raspberry Pi-powered kiosks, and real-time KPI dashboards. Backbone, Ember, AND " +
      "Angular inside two years: the JavaScript framework wars, fought in person.",
  },
  {
    n: "III", name: "The Mainframe Vault", era: "2001 · AT&T  ·  2008 · Aflac",
    hash: "d29900b5259db377f0d2b4aaf5a72d8509e1591917343b726bf2b97c9d3be0b1",
    look: "Robots are told where not to go. Humans, historically, take that as an invitation. " +
          "Whatever is behind the door speaks the mainframe's native tongue, not ASCII.",
    hints: [
      "Every site has a /robots.txt. Read this one.",
      "Visit the path it disallows. You'll need to get past the security screen (read its fine print).",
      "The hex is EBCDIC, code page 037. C1–C9 are A–I, D1–D9 are J–R, E2–E9 are S–Z.",
    ],
    lore:
      "2001–2008, AT&T: C/C++ for data mining at a scale before anyone called it 'big data', project lead " +
      "on special data projects, a Senior Member of Technical Staff at AT&T Labs, and a stint as an " +
      "international technical systems auditor (the auditor, auditing). Then Aflac's change management, " +
      "where nothing reaches production without a ticket. The lesson that stuck: the boring systems are " +
      "the ones the money runs on.",
  },
  {
    n: "IV", name: "The Console Abyss", era: "2010 · GDIT  ·  2013 · Regions",
    hash: "d80ffc8dc07953482a2f9f5fbff9a9cecea5d0022155f32af0b56e91d1bee7d3",
    look: "Developers have a second screen they never show the client. Open your browser's developer " +
          "tools; something down there is speaking in ones and zeros.",
    hints: [
      "Press F12 (or Cmd+Option+I) and open the Console tab, then reload.",
      "Seven bytes of binary. Each 8-bit group is one ASCII letter.",
      "01010010 is 82, which is 'R'. Keep going.",
    ],
    lore:
      "2010–2011, GDIT in Peachtree City (home of more golf-cart paths than most towns have sidewalks): a " +
      "VB.NET app hauled onto .NET 4 with WCF and automated TFS builds. Then Regions, 2013 to now: from " +
      "ASP.NET MVC internal tools to enterprise AWS for a Fortune 500 bank, PCI DSS and SOC 2 included. " +
      "Thirteen years of keeping things up.",
  },
];
const FINAL_HASH = "0fae3694b79f6237c6eed3e1a27fdaaa3afe01c1625fbcf02a73556a6eb4ef40";

/* ------------------------------------------------------------------ */

export function initShell() {
  const dialog = document.getElementById("shell");
  const out = document.getElementById("shell-out");
  const form = document.getElementById("shell-form");
  const input = document.getElementById("shell-in");
  if (!dialog || !out || !form || !input) return null;

  const history = store.get("shell.history", []);
  let hIdx = history.length;
  let booted = false;

  function line(html, cls) {
    const div = document.createElement("div");
    div.className = "sh-line" + (cls ? " " + cls : "");
    div.innerHTML = html;
    out.appendChild(div);
    out.scrollTop = out.scrollHeight;
  }
  const print = (text, cls) => line(esc(text), cls);
  const blank = () => line("&nbsp;");

  function quest() { return store.get("quest.found", []); }
  function saveQuest(found) { store.set("quest.found", found); }

  /* ---------------- commands ---------------- */

  const projectIds = PROJECTS.map((p) => p.id);

  const COMMANDS = {
    help: {
      desc: "list commands",
      run() {
        const rows = Object.entries(COMMANDS).filter(([, c]) => c.desc);
        rows.forEach(([name, c]) => line(`<span class="sh-cmd">${name.padEnd(10)}</span><span class="sh-dim">${esc(c.desc)}</span>`));
        line(`<span class="sh-dim">Tab completes. ↑/↓ for history. Some commands aren't listed. Curious people find them.</span>`);
      },
    },
    whoami: { desc: "who is this", run: () => print(`${PROFILE.name}: ${PROFILE.headline}`) },
    about: { desc: "the short version", run: () => { print(PROFILE.about); print(`Based in ${PROFILE.location}.`, "sh-dim"); } },
    ls: {
      desc: "list projects",
      run(args) {
        const tag = (args[0] || "").replace(/^--?/, "").toLowerCase();
        const list = tag ? PROJECTS.filter((p) => p.tags.includes(tag)) : PROJECTS;
        if (!list.length) return print(`ls: no projects tagged '${tag}' (try ai, cloud, legacy, web)`, "sh-err");
        list.forEach((p) => line(`<span class="sh-cmd">${esc(p.id.padEnd(32))}</span><span class="sh-dim">${esc(p.tags.join(","))}</span>`));
      },
    },
    cat: {
      desc: "describe a project",
      complete: projectIds,
      run(args) {
        const p = findProject(args[0]);
        if (!p) return print(`cat: ${args[0] || "(nothing)"}: No such project. Try 'ls'.`, "sh-err");
        line(`<span class="sh-key">${esc(p.id)}</span>`);
        print(p.blurb);
        print(p.stack, "sh-val");
        print(p.url, "sh-dim");
      },
    },
    open: {
      desc: "open a project",
      complete: projectIds,
      run(args) {
        const p = findProject(args[0]);
        if (!p) return print(`open: ${args[0] || "(nothing)"}: No such project. Try 'ls'.`, "sh-err");
        print(`Opening ${p.live || p.url} …`, "sh-dim");
        window.open(p.live || p.url, "_blank", "noopener");
      },
    },
    career: {
      desc: "work history",
      run() {
        CAREER.forEach((c) => {
          line(`<span class="sh-val">${esc(c.years.padEnd(12))}</span><span class="sh-key">${esc(c.org)}</span> <span class="sh-dim">· ${esc(c.role)}</span>`);
        });
      },
    },
    education: { desc: "schooling", run: () => EDUCATION.forEach((e) => print(e.school)) },
    skills: {
      desc: "the toolbox",
      run() {
        Object.entries(SKILLS).forEach(([k, v]) => line(`<span class="sh-key">${esc(k.padEnd(14))}</span>${esc(v.join(", "))}`));
      },
    },
    certs: { desc: "certifications", run: () => PROFILE.certs.forEach((c) => line(`<span class="sh-ok">✔</span> ${esc(c)}`)) },
    contact: {
      desc: "how to reach me",
      run() {
        line(`email     <a href="mailto:${PROFILE.email}">${PROFILE.email}</a>`);
        line(`github    <a href="${PROFILE.github}" target="_blank" rel="noopener">${PROFILE.github}</a>`);
        line(`linkedin  <a href="${PROFILE.linkedin}" target="_blank" rel="noopener">${PROFILE.linkedin}</a>`);
      },
    },
    github: {
      desc: "live GitHub stats",
      async run() {
        print("Fetching api.github.com …", "sh-dim");
        const s = await getGithubSummary();
        if (!s) return print("GitHub's API didn't answer (rate limits happen). Try again in a bit.", "sh-err");
        line(`<span class="sh-key">public repos</span>  ${s.repoCount}`);
        line(`<span class="sh-key">languages</span>     ${esc(s.languages.slice(0, 6).map((l) => `${l.name} ${l.pct}%`).join(", "))}`);
        line(`<span class="sh-key">recently</span>      ${esc(s.recent.slice(0, 5).map((r) => r.name).join(", "))}`);
      },
    },
    neofetch: {
      desc: "system info",
      run() {
        const logo = [
          "     ██ ██████ ",
          "     ██ ██   ██",
          "     ██ ██████ ",
          "██   ██ ██   ██",
          " █████  ██   ██",
        ];
        const since = new Date().getFullYear() - 1999;
        const info = [
          `<span class="sh-key">roberjo</span>@<span class="sh-key">portfolio</span>`,
          `<span class="sh-dim">-----------------</span>`,
          `<span class="sh-key">Host</span>     ${esc(PROFILE.location)}`,
          `<span class="sh-key">Uptime</span>   ${since} years (first deploy: 1999, Auburn)`,
          `<span class="sh-key">Kernel</span>   Regions Financial, 2013 – present`,
          `<span class="sh-key">Shell</span>    this one (try 'quest')`,
          `<span class="sh-key">Certs</span>    AWS SA Pro · AWS DevOps Pro`,
          `<span class="sh-key">Langs</span>    Python, TypeScript, Rust, C#, COBOL, C/C++`,
          `<span class="sh-key">Theme</span>    ${document.documentElement.getAttribute("data-theme")}`,
        ];
        const rows = Math.max(logo.length, info.length);
        for (let i = 0; i < rows; i++) {
          line(`<span class="sh-ok">${esc((logo[i] || "").padEnd(18))}</span>${info[i] || ""}`);
        }
      },
    },
    theme: {
      desc: "theme [dark|light]",
      complete: ["dark", "light"],
      run(args) {
        const cur = document.documentElement.getAttribute("data-theme");
        const next = args[0] === "dark" || args[0] === "light" ? args[0] : cur === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        try { localStorage.setItem("theme", next); } catch (e) {}
        print(`Theme set to ${next}.`, "sh-dim");
      },
    },
    history: { desc: "command history", run: () => history.slice(-20).forEach((h, i) => print(`${String(i + 1).padStart(3)}  ${h}`, "sh-dim")) },
    clear: { desc: "clear the screen", run: () => { out.innerHTML = ""; } },
    exit: { desc: "close the shell", run: () => close() },

    /* ---- unlisted ---- */
    sudo: {
      run(args) {
        if (args.join(" ").toLowerCase() === "hire-me" || args.join(" ").toLowerCase() === "hire me") {
          print("[sudo] password for recruiter: ********", "sh-dim");
          line(`<span class="sh-ok">Permission granted.</span> Opening a draft email …`);
          window.location.href = `mailto:${PROFILE.email}?subject=${encodeURIComponent("Let's talk (sent via sudo hire-me)")}`;
          return;
        }
        print("roberjo is not in the sudoers file. This incident will be reported. (Try: sudo hire-me)", "sh-err");
      },
    },
    rm: { run: (a) => print(a.join(" ").includes("-rf") ? "Nice try. Change ticket required. (Aflac taught me that.)" : "rm: missing operand", "sh-err") },
    vim: { run: () => print("You're now trapped in vim. Just kidding: type :q! … or 'exit'.", "sh-dim") },
    emacs: { run: () => print("emacs: a great operating system, lacking only a decent editor.", "sh-dim") },
    cobol: { run: () => { print("IDENTIFICATION DIVISION.", "sh-val"); print("PROGRAM-ID. HELLO-RECRUITER.", "sh-val"); print("PROCEDURE DIVISION.", "sh-val"); print("    DISPLAY 'STILL RUNNING SINCE 1959'.", "sh-val"); print("    STOP RUN.", "sh-val"); } },
    war: { run: (a) => print(a[0] && a[0].toLowerCase() === "eagle" ? "WAR EAGLE! 🦅 (Auburn, 1999–2001)" : "war: what is it good for?", a[0] && a[0].toLowerCase() === "eagle" ? "sh-ok" : "sh-dim") },
    ping: { run: (a) => print(`PONG from ${a[0] || "roberjo"}: 0% packet loss, 100% caffeine`, "sh-dim") },
    coffee: { run: () => print("☕ Brewing … ETA: before the 3 a.m. page.", "sh-dim") },
    xyzzy: { run: () => print("A hollow voice says \"Fool.\" (Wrong adventure. Try 'quest'.)", "sh-dim") },

    /* ---- the adventure ---- */
    quest: {
      run() {
        const found = quest();
        line(`<span class="sh-key">THE LOST DEPLOY KEY</span>`);
        print("A production deploy key was split into four fragments and hidden across every layer of this " +
              "site, the way a career spreads across every layer of the stack. Find all four, then unlock the vault.");
        blank();
        ROOMS.forEach((r) => {
          const done = found.includes(r.n);
          line(`${done ? '<span class="sh-ok">[✔]</span>' : '<span class="sh-dim">[ ]</span>'} ` +
               `<span class="sh-val">${r.n.padEnd(4)}</span><span class="sh-key">${esc(r.name.padEnd(22))}</span><span class="sh-dim">${esc(r.era)}</span>`);
        });
        blank();
        line(`<span class="sh-dim">look &lt;I-IV&gt; · take &lt;FRAGMENT&gt; · inventory · hint · unlock &lt;KEY&gt;</span>`);
      },
    },
    look: {
      complete: ROOMS.map((r) => r.n),
      run(args) {
        const r = ROOMS.find((x) => x.n === (args[0] || "").toUpperCase());
        if (!r) return print("look at which room? I, II, III, or IV.", "sh-err");
        line(`<span class="sh-key">${r.n}. ${esc(r.name)}</span> <span class="sh-dim">(${esc(r.era)})</span>`);
        print(r.look);
      },
    },
    hint: {
      run(args) {
        const found = quest();
        const r = args[0] ? ROOMS.find((x) => x.n === args[0].toUpperCase()) : ROOMS.find((x) => !found.includes(x.n));
        if (!r) return print("You have every fragment. Assemble them in order, joined with dashes, and 'unlock' the vault.", "sh-ok");
        const level = store.get("quest.hint." + r.n, 0);
        print(`Hint ${Math.min(level, r.hints.length - 1) + 1}/${r.hints.length} for room ${r.n}: ${r.hints[Math.min(level, r.hints.length - 1)]}`, "sh-dim");
        store.set("quest.hint." + r.n, level + 1);
      },
    },
    take: {
      async run(args) {
        const guess = (args[0] || "").trim().toUpperCase();
        if (!guess) return print("take what? (fragments are single words)", "sh-err");
        const h = await sha256(guess);
        const r = ROOMS.find((x) => x.hash === h);
        if (!r) return print(`'${guess}' doesn't fit any lock. Fragments are single uppercase words.`, "sh-err");
        const found = quest();
        if (found.includes(r.n)) return print(`You already hold fragment ${r.n}.`, "sh-dim");
        found.push(r.n);
        saveQuest(found);
        line(`<span class="sh-ok">✔ Fragment ${r.n} recovered: ${esc(guess)}</span> <span class="sh-dim">(${found.length}/4)</span>`);
        line(`<span class="sh-key">${esc(r.name)} · ${esc(r.era)}</span>`);
        print(r.lore);
        if (found.length === 4) { blank(); print("All four fragments recovered. In room order, joined with dashes: unlock <KEY>.", "sh-val"); }
      },
    },
    inventory: {
      run() {
        const found = quest();
        if (!found.length) return print("Your inventory: one (1) curious mind. Try 'quest'.", "sh-dim");
        found.forEach((n) => print(`fragment ${n} · ${ROOMS.find((r) => r.n === n).name}`));
      },
    },
    unlock: {
      async run(args) {
        const key = (args[0] || "").trim().toUpperCase();
        if (!key) return print("unlock requires a key.", "sh-err");
        if ((await sha256(key)) !== FINAL_HASH) {
          return print("ACCESS DENIED. The vault hums disapprovingly. (Fragments in room order I → IV, joined with dashes.)", "sh-err");
        }
        store.set("quest.complete", true);
        [
          "  ██╗   ██╗ █████╗ ██╗   ██╗██╗  ████████╗",
          "  ██║   ██║██╔══██╗██║   ██║██║  ╚══██╔══╝",
          "  ╚██╗ ██╔╝███████║██║   ██║██║     ██║   ",
          "   ╚████╔╝ ██╔══██║╚██████╔╝███████╗██║   ",
          "    ╚═══╝  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝   ",
        ].forEach((l) => print(l, "sh-ok sh-pre"));
        blank();
        line(`<span class="sh-key">ACHIEVEMENT UNLOCKED: Senior Member of the Technical Staff (Honorary)</span>`);
        print("Keep the COBOL running. Across 25+ years — hand-written HTML at Auburn, data mining at AT&T, change " +
              "control at Aflac, .NET at GDIT, agency work at Kelsey, and AWS at Regions — the constant was this: " +
              "the systems people depend on deserve modern tooling, not a rewrite-everything slide deck.");
        blank();
        line(`You read the source, decoded Base64, ROT13, EBCDIC, and binary, and didn't give up. ` +
             `That's exactly who I like working with. Type <span class="sh-cmd">mail</span> to tell me you made it.`);
      },
    },
    mail: {
      run() {
        if (!store.get("quest.complete", false)) return print("mail: nothing to send yet. (Finish the quest first.)", "sh-dim");
        window.location.href = `mailto:${PROFILE.email}?subject=${encodeURIComponent("I found the deploy key")}&body=${encodeURIComponent("I made it through the vault on roberjo.github.io.\n\n")}`;
      },
    },
  };
  COMMANDS.inv = COMMANDS.inventory;

  function findProject(q) {
    if (!q) return null;
    const s = q.toLowerCase();
    return PROJECTS.find((p) => p.id.toLowerCase() === s) || PROJECTS.find((p) => p.id.toLowerCase().startsWith(s));
  }

  async function exec(raw) {
    const text = raw.trim();
    line(`<span class="sh-prompt">roberjo@portfolio:~$</span> ${esc(text)}`);
    if (!text) return;
    history.push(text);
    if (history.length > 100) history.shift();
    store.set("shell.history", history);
    hIdx = history.length;
    const [name, ...args] = text.split(/\s+/);
    const cmd = COMMANDS[name.toLowerCase()];
    if (!cmd) return print(`${name}: command not found. Type 'help'.`, "sh-err");
    try { await cmd.run(args); } catch (e) { print(`${name}: ${e.message}`, "sh-err"); }
  }

  /* ---------------- input handling ---------------- */

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = input.value;
    input.value = "";
    exec(v);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") {
      if (hIdx > 0) { hIdx--; input.value = history[hIdx]; }
      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      if (hIdx < history.length - 1) { hIdx++; input.value = history[hIdx]; } else { hIdx = history.length; input.value = ""; }
      e.preventDefault();
    } else if (e.key === "Tab") {
      e.preventDefault();
      const parts = input.value.split(/\s+/);
      if (parts.length === 1) {
        const opts = Object.keys(COMMANDS).filter((c) => COMMANDS[c].desc && c.startsWith(parts[0].toLowerCase()));
        if (opts.length === 1) input.value = opts[0] + " ";
        else if (opts.length > 1) print(opts.join("  "), "sh-dim");
      } else {
        const cmd = COMMANDS[parts[0].toLowerCase()];
        const pool = (cmd && cmd.complete) || [];
        const last = parts[parts.length - 1].toLowerCase();
        const opts = pool.filter((o) => o.toLowerCase().startsWith(last));
        if (opts.length === 1) { parts[parts.length - 1] = opts[0]; input.value = parts.join(" ") + " "; }
        else if (opts.length > 1) print(opts.join("  "), "sh-dim");
      }
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      out.innerHTML = "";
    }
  });

  out.addEventListener("click", () => input.focus());

  function boot() {
    if (booted) return;
    booted = true;
    line(`<span class="sh-ok">●</span> <span class="sh-dim">roberjo.sh v2.6 · ${new Date().toDateString()}</span>`);
    print(`Welcome. Type 'help' to look around.${store.get("quest.complete", false) ? " (Vault: unlocked. Nicely done.)" : ""}`);
  }

  function open(prefill) {
    if (!dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal(); else dialog.setAttribute("open", "");
    }
    boot();
    if (prefill) { input.value = ""; exec(prefill); }
    setTimeout(() => input.focus(), 0);
  }
  function close() {
    if (typeof dialog.close === "function") dialog.close(); else dialog.removeAttribute("open");
  }

  dialog.addEventListener("click", (e) => { if (e.target === dialog) close(); });
  document.querySelectorAll("[data-shell-close]").forEach((b) => b.addEventListener("click", close));

  return { open, close, isOpen: () => dialog.open };
}

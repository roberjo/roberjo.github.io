// THE MATRIX BBS: a tribute to the dial-up boards of Birmingham, AL (area code 205),
// rebuilt inside a portfolio. Every file here is parody. Nothing downloads but jokes.
//
//   "Hack the planet" was a movie line. "Patch the planet" is a job.
//
import { PROFILE, PROJECTS, CAREER } from "./data.js";
import { playDialup, beep, DIAL_TIMELINE, PHONE } from "./modem.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

const BANNER = [
  "████████╗██╗  ██╗███████╗    ███╗   ███╗ █████╗ ████████╗██████╗ ██╗██╗  ██╗",
  "╚══██╔══╝██║  ██║██╔════╝    ████╗ ████║██╔══██╗╚══██╔══╝██╔══██╗██║╚██╗██╔╝",
  "   ██║   ███████║█████╗      ██╔████╔██║███████║   ██║   ██████╔╝██║ ╚███╔╝ ",
  "   ██║   ██╔══██║██╔══╝      ██║╚██╔╝██║██╔══██║   ██║   ██╔══██╗██║ ██╔██╗ ",
  "   ██║   ██║  ██║███████╗    ██║ ╚═╝ ██║██║  ██║   ██║   ██║  ██║██║██╔╝ ██╗",
  "   ╚═╝   ╚═╝  ╚═╝╚══════╝    ╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝",
];

const BOARDS = [
  {
    name: "Main Lobby", desc: "General chatter. Be excellent to each other.",
    threads: [
      { title: "Welcome to The Matrix", by: "SysOp", body: [
        "You made it through the screech. Welcome.",
        "This board is a tribute to the 205 BBS scene: late nights, tied-up phone",
        "lines, and parents yelling to get off the modem. The SysOp, jbroberts,",
        "has been shipping software since 1999. Look around. Read the files.",
        "Log off with [G] when you're done; there's a whole shell behind this.",
      ] },
      { title: "FIRST POST!!!1", by: "n00b2400", body: [
        "first",
        "",
        "> [SysOp]: It's 2026. The thread is 30 years old. You are not first.",
      ] },
      { title: "Uptime: 27 years and counting", by: "jbroberts", body: [
        "1999  Auburn University ..... hand-coded HTML, kept a web server alive",
        "2001  AT&T .................. C/C++ data mining, AT&T Labs, auditing",
        "2008  Aflac ................. change management: every change, a ticket",
        "2010  GDIT .................. VB.NET -> .NET 4, automated TFS builds",
        "2011  Kelsey Advertising .... agency apps, Raspberry Pi kiosks",
        "2013  Regions Financial ..... enterprise AWS, still here",
        "No reboots required.",
      ] },
    ],
  },
  {
    name: "Mainframe Underground", desc: "COBOL, JCL, and people who say 'DASD' out loud.",
    threads: [
      { title: "COBOL is dead? My paycheck disagrees", by: "PIC_X_50", body: [
        "Payments, deposits, claims. Still COBOL batch, still running nightly.",
        "The SysOp built mainframe-frontier: a whole COBOL nightly cycle for a",
        "simulated bank that runs in a container, with a JES-style job runner",
        "written in Rust. Keep the COBOL. Give it modern tooling.",
        "https://github.com/roberjo/mainframe-frontier",
      ] },
      { title: "Packed decimal ate my weekend", by: "COMP-3", body: [
        "x'12345C' is +12345. x'12345D' is -12345. You're welcome.",
        "If your bytes look like C3 D6 C2 D6 D3, you're reading EBCDIC, friend.",
        "Speaking of which... somebody left something like that in a vault.",
      ] },
      { title: "USPS addresses in COBOL (on purpose)", by: "jbroberts", body: [
        "Because sometimes JSON is too soft and PIC X(50) builds character.",
        "GnuCOBOL + GixSQL + PostgreSQL, commit/restart, golden-file CI.",
        "https://github.com/roberjo/usps-cobol-addresses",
      ] },
    ],
  },
  {
    name: "Cloud & Serverless", desc: "Someone else's computer, configured with Terraform.",
    threads: [
      { title: "Isn't the cloud just someone else's mainframe?", by: "BigIron", body: [
        "Yes. With better marketing and a per-millisecond invoice.",
        "> [jbroberts]: And IAM policies instead of RACF profiles. Same job.",
      ] },
      { title: "I ran a whole AWS stack on my laptop", by: "jbroberts", body: [
        "~70 Terraform resources: Lambda, SNS/SQS + DLQs, DynamoDB Streams, S3,",
        "Kafka, CloudFront, Route 53, a Next.js front end. 22 end-to-end tests.",
        "No AWS account. The emulator's gaps are documented, warts and all.",
        "https://github.com/roberjo/aws-testing",
      ] },
    ],
  },
  {
    name: "AI Agents", desc: "Robots that write code. Supervised. Mostly.",
    threads: [
      { title: "Ticket in, pull request out", by: "jbroberts", body: [
        "ServiceNow vulnerability finding -> Jira issue -> an LLM reads the repo,",
        "writes the fix, opens a GitHub PR -> Teams/Slack/email. Humans review.",
        "Claude or Gemini, pluggable. https://github.com/roberjo/ticket-remediation",
      ] },
      { title: "Teaching agents to use gh, kubectl, and Jira", by: "jbroberts", body: [
        "Agents can run any CLI. The gap is judgment: which flags, which exit codes.",
        "tool-enabler compiles that knowledge into Claude Code Skills, AGENTS.md,",
        "GEMINI.md, and Copilot instructions. https://github.com/roberjo/tool-enabler",
      ] },
    ],
  },
  {
    name: "Hack the Planet", desc: "Security talk. Defense only. The SysOp works at a bank.",
    threads: [
      { title: "Zero Trust: trust no one (not even this BBS)", by: "ACIDBYTE", body: [
        "Verify explicitly. Least privilege. Assume breach.",
        "> [jbroberts]: Also: encryption at rest and in transit, and PCI DSS",
        "> doesn't care how cool your exploit was.",
      ] },
      { title: "Overheard on node 2", by: "anonymous", body: [
        "Rumor is somebody split a production deploy key into four pieces",
        "and hid them in this very site. Markup, style, a vault robots aren't",
        "allowed into, and a console nobody opens.",
        "Start where every hacker starts: View Source.",
      ] },
    ],
  },
];

// File areas. Everything is parody; "downloads" only reveal jokes or real portfolio links.
const AREAS = [
  {
    name: "Hackz", desc: "Career exploits",
    files: [
      { name: "HACKCRR.TXT", size: "4,096", date: "03-14-95", desc: "How to hack your career (6 employers, 27 yrs)",
        body: () => ["HOW TO HACK YOUR CAREER, by jbroberts", "", ...CAREER.slice().reverse().map((c) => `  ${c.years.padEnd(12)} ${c.org}`),
          "", "Exploit: keep learning. Payload: compounding returns. CVSS: 10.0."] },
      { name: "LOCKPICK.TXT", size: "1,337", date: "07-04-96", desc: "Lockpicking for beginners",
        body: () => ["Step 1: Don't.", "", "The SysOp spent time as an international technical systems auditor.",
          "The only lock he picks is his own front door when he forgets his keys."] },
    ],
  },
  {
    name: "Phreakz", desc: "Ma Bell memorabilia",
    files: [
      { name: "BLUEBOX.TXT", size: "2,600", date: "02-26-94", desc: "2600 Hz and you",
        body: () => ["2600 Hz. You know the story.", "",
          "The SysOp spent 2001-2008 at AT&T, writing C/C++ for data mining at a scale",
          "nobody called 'big data' yet. He's heard every phreak story twice.", "Ma Bell says hi. She's not mad. She's disappointed."] },
      { name: "WARDIAL.BAS", size: "512", date: "11-30-93", desc: "War dialer (Applesoft BASIC)",
        body: () => ["10 PRINT \"PLEASE DON'T WAR DIAL\"", "20 GOTO 10", "RUN", "",
          "Want real Applesoft? The SysOp writes fractals for the Apple IIe:", "https://github.com/roberjo/basic-fractals"] },
    ],
  },
  {
    name: "Warez", desc: "Totally legit software",
    files: [
      { name: "WIN95.ZIP", size: "13 disks", date: "08-24-95", desc: "Windows 95 (13 x 1.44MB)",
        body: () => ["Inserting disk 1 of 13 ...", "Inserting disk 2 of 13 ...", "...", "Inserting disk 7 of 13 ...",
          "General failure reading drive A:", "Abort, Retry, Fail?", "", "It was always disk 7. Buy your software."] },
      { name: "DOOM1.ZIP", size: "2,394,624", date: "12-10-93", desc: "DOOM shareware, episode 1",
        body: () => ["Knee-Deep in the Dead: free. Episodes 2 and 3: buy them.", "Support developers. (Hi. We're developers.)"] },
    ],
  },
  {
    name: "Cracks", desc: "Keygens & trainers",
    files: [
      { name: "KEYGEN.COM", size: "8,192", date: "06-06-96", desc: "Universal keygen (all programs!)",
        body: () => ["Generating key ...", "KEY: 1111-1111-1111-1111", "", "Works on: 0 programs.", "Software engineers have mortgages too."] },
      { name: "TRAINER.EXE", size: "16,384", date: "09-09-97", desc: "+infinite lives trainer",
        body: () => ["Patched: lives = infinite", "Side effect: technical_debt = infinite", "", "There are no cheat codes for production. Only change tickets."] },
    ],
  },
  {
    name: "Shareware", desc: "The SysOp's real projects",
    files: PROJECTS.filter((p) => p.featured).map((p) => ({
      name: (p.id.replace(/[^A-Za-z]/g, "").slice(0, 8) + ".ZIP").toUpperCase(),
      size: String(1000 + p.id.length * 4321).replace(/\B(?=(\d{3})+(?!\d))/g, ","),
      date: "10-12-26",
      desc: p.id,
      link: p.live || p.url,
      body: () => [p.id, p.blurb, p.stack],
    })),
  },
  {
    name: "Zero-Days", desc: "Fresh. Unpatched. Uploaded 1 min ago.",
    files: [
      { name: "0DAY.ZIP", size: "65,535", date: "TODAY", desc: "!!! UNPATCHED EXPLOIT - DO NOT DISTRIBUTE !!!",
        body: () => ["README.TXT", "", "There is no zero-day in here.", "There is a reminder:",
          "  - patch your systems", "  - rotate your keys", "  - turn on MFA", "  - read your vendor's security bulletins",
          "", "The real zero-day was the patch you didn't apply.", "-- Management"] },
      { name: "PATCHTUE.TXT", size: "2,048", date: "TUESDAY", desc: "What really happens on Patch Tuesday",
        body: () => ["0900  Patches released", "0905  Change ticket opened", "1300  CAB approves (it's not Thursday? approved anyway)",
          "2200  Maintenance window", "2201  'Works on my machine'", "0300  Pager", "", "Ship it tested. Have a backout plan."] },
    ],
  },
];

const DOORS = [
  { name: "SPACE TRADING", desc: "Buy low, sell high, among the stars. Written in BASIC.", url: "https://github.com/roberjo/SpaceTradingGame" },
  { name: "SEC RECRUITING", desc: "College football recruiting sim with NIL deals. Text mode.", url: "https://github.com/roberjo/CFBRecruitsGame" },
  { name: "WORLD RADIO", desc: "Tune into 5,000+ live stations on a map. Not text mode. Sorry.", url: "https://roberjo.github.io/world-radio/" },
];

/* ------------------------------------------------------------------ */
/* Engine                                                              */
/* ------------------------------------------------------------------ */

export function createBBS(api) {
  const { line, print, blank, setPrompt, setMode, esc, store, out } = api;
  let skip = false;
  let animating = false;
  let screen = "main";
  let ctx = {};
  let audio = null;

  const handle = () => store.get("bbs.handle", null);
  const soundOn = () => store.get("bbs.sound", true);

  function sleep(ms) {
    if (skip || reduceMotion) return Promise.resolve();
    return new Promise((r) => {
      const t0 = performance.now();
      (function check() {
        if (skip || performance.now() - t0 >= ms) return r();
        setTimeout(check, 30);
      })();
    });
  }

  async function lines(arr, cls, delay = 18) {
    for (const l of arr) { print(l, cls); await sleep(delay); }
  }

  const c = (cls, text) => `<span class="${cls}">${esc(text)}</span>`;
  const key = (k) => `<span class="bbs-key">[${esc(k)}]</span>`;
  const rule = () => line(c("bbs-blu", "─".repeat(64)));

  /* ---------------- dial & login ---------------- */

  async function dial() {
    animating = true; skip = false;
    setPrompt("");
    out.classList.add("is-bbs");
    if (soundOn() && !reduceMotion) audio = playDialup();
    const T = DIAL_TIMELINE;
    const at = (s) => s * 1000;
    let elapsed = 0;
    const until = async (s) => { await sleep(Math.max(0, at(s) - elapsed)); elapsed = Math.max(elapsed, at(s)); };

    line(c("bbs-dim", "Telix v3.51 · COM2 · 14400 baud · press any key to skip"));
    blank();
    print("ATZ", "bbs-wht"); await sleep(250); print("OK", "bbs-grn");
    print("ATM1L1", "bbs-wht"); await sleep(250); print("OK", "bbs-grn");
    await until(T.digits);
    print(`ATDT ${PHONE}`, "bbs-wht");
    await until(T.ring);
    print("RINGING", "bbs-yel");
    await until(T.answer);
    print("ANSWER", "bbs-yel");
    await until(T.handshake);
    print("CARRIER 14400", "bbs-cyn");
    await sleep(500); print("PROTOCOL: LAP-M", "bbs-cyn");
    await sleep(500); print("COMPRESSION: V.42BIS", "bbs-cyn");
    await until(T.connect);
    if (audio && skip) audio.stop();
    line(c("bbs-grn bbs-b", "CONNECT 14400/ARQ/V32/LAPM/V42BIS"));
    await sleep(400);
    blank();
    await banner();
    animating = false;
    await login();
  }

  async function banner() {
    for (const l of BANNER) { line(c("bbs-banner", l), "sh-pre bbs-banner-line"); await sleep(70); }
    line(c("bbs-mag", "   -=[ ") + c("bbs-wht", "a tribute to the 205 BBS scene") + c("bbs-mag", " ]=-  ") +
         c("bbs-dim", "2 nodes · 2400-14.4k · SysOp: jbroberts"));
    blank();
  }

  async function login() {
    const h = handle();
    if (h) {
      line(`${c("bbs-cyn", "Welcome back,")} ${c("bbs-yel bbs-b", h)}${c("bbs-cyn", ". Your password? We don't do passwords. It's 1994.")}`);
      await sleep(200);
      return mainMenu();
    }
    line(c("bbs-cyn", "New caller detected. No password needed; this BBS has 1994-grade security."));
    line(c("bbs-dim", "(Please don't type a real password anywhere you didn't mean to.)"));
    screen = "handle";
    setPrompt("Enter your handle:");
  }

  /* ---------------- screens ---------------- */

  function mainMenu() {
    screen = "main"; ctx = {};
    blank();
    line(c("bbs-mag bbs-b", "══════════════════ MAIN MENU ══════════════════"));
    line(`  ${key("M")} Message Boards     ${key("F")} File Areas`);
    line(`  ${key("D")} Door Games         ${key("B")} Bulletins`);
    line(`  ${key("W")} Who's Online       ${key("P")} Page SysOp`);
    line(`  ${key("G")} Goodbye (log off to the shell)`);
    setPrompt(`[${handle() || "guest"}] Main:`);
  }

  function boardsMenu() {
    screen = "boards";
    blank();
    line(c("bbs-mag bbs-b", "─── MESSAGE BOARDS ───"));
    BOARDS.forEach((b, i) => line(`  ${key(i + 1)} ${c("bbs-yel", b.name.padEnd(24))}${c("bbs-dim", b.desc)}`));
    line(`  ${key("Q")} Back to main menu`);
    setPrompt("Board #:");
  }

  function threadsMenu(bi) {
    screen = "threads"; ctx.board = bi;
    const b = BOARDS[bi];
    blank();
    line(c("bbs-mag bbs-b", `─── ${b.name.toUpperCase()} ───`));
    b.threads.forEach((t, i) => line(`  ${key(i + 1)} ${c("bbs-wht", t.title.padEnd(46))}${c("bbs-dim", "by " + t.by)}`));
    line(`  ${key("Q")} Back to boards`);
    setPrompt("Read #:");
  }

  async function readThread(ti) {
    const t = BOARDS[ctx.board].threads[ti];
    screen = "reading";
    blank(); rule();
    line(`${c("bbs-dim", "Subj:")} ${c("bbs-wht bbs-b", t.title)}`);
    line(`${c("bbs-dim", "From:")} ${c("bbs-yel", t.by)}   ${c("bbs-dim", "Conf: " + BOARDS[ctx.board].name)}`);
    rule();
    animating = true; skip = false;
    for (const l of t.body) { line(linkify(l), "bbs-body"); await sleep(25); }
    animating = false;
    rule();
    setPrompt("[Enter] back:");
  }

  function areasMenu() {
    screen = "areas";
    blank();
    line(c("bbs-mag bbs-b", "─── FILE AREAS ───"));
    AREAS.forEach((a, i) => line(`  ${key(i + 1)} ${c("bbs-yel", a.name.padEnd(12))}${c("bbs-dim", a.desc)}`));
    line(`  ${key("U")} Upload a file`);
    line(`  ${key("Q")} Back to main menu`);
    setPrompt("Area #:");
  }

  function filesMenu(ai) {
    screen = "files"; ctx.area = ai;
    const a = AREAS[ai];
    blank();
    line(c("bbs-mag bbs-b", `─── ${a.name.toUpperCase()} ───`));
    line(c("bbs-dim", "  #  FILENAME      SIZE        DATE      DESCRIPTION"));
    a.files.forEach((f, i) => line(`  ${key(i + 1)} ${c("bbs-cyn", f.name.padEnd(13))} ${c("bbs-wht", f.size.padStart(10))}  ${c("bbs-dim", f.date.padEnd(9))} ${esc(f.desc)}`));
    line(`  ${key("Q")} Back to file areas`);
    setPrompt("Download #:");
  }

  async function download(fi) {
    const f = AREAS[ctx.area].files[fi];
    screen = "downloading";
    animating = true; skip = false;
    blank();
    line(`${c("bbs-wht", "ZMODEM")} ${c("bbs-dim", "sending")} ${c("bbs-cyn", f.name)} ${c("bbs-dim", "· CRC-32 · 1424 cps")}`);
    const bar = line("");
    const steps = 24;
    for (let i = 0; i <= steps; i++) {
      const pct = Math.round((i / steps) * 100);
      bar.innerHTML = `${c("bbs-grn", "█".repeat(i))}${c("bbs-dim", "░".repeat(steps - i))} ${c("bbs-wht", String(pct).padStart(3) + "%")}`;
      await sleep(70);
    }
    line(c("bbs-grn", `Transfer complete. 0 errors.`));
    blank();
    for (const l of f.body()) { line(linkify(l), "bbs-body"); await sleep(25); }
    if (f.link) line(`${c("bbs-dim", "Open it:")} <a href="${esc(f.link)}" target="_blank" rel="noopener">${esc(f.link)}</a>`);
    animating = false;
    setPrompt("[Enter] back:");
  }

  function doorsMenu() {
    screen = "doors";
    blank();
    line(c("bbs-mag bbs-b", "─── DOOR GAMES ───"));
    DOORS.forEach((d, i) => line(`  ${key(i + 1)} ${c("bbs-yel", d.name.padEnd(16))}${c("bbs-dim", d.desc)}`));
    line(`  ${key("Q")} Back to main menu`);
    setPrompt("Door #:");
  }

  function bulletins() {
    screen = "bulletin";
    blank(); rule();
    line(c("bbs-yel bbs-b", "BULLETIN #1 · HOUSE RULES"));
    [
      "1. Be excellent to each other.",
      "2. No real warez. Every file here is a joke. The SysOp works in bank security.",
      "3. Don't tie up the line. Other callers are waiting (they aren't; it's 2026).",
      "4. Leaving? Press G. You'll get a full shell. Try 'help', or 'quest'.",
    ].forEach((l) => print(l, "bbs-body"));
    blank();
    line(c("bbs-yel bbs-b", "BULLETIN #2 · Y2K STATUS"));
    print("This BBS is Y2K compliant. It is also Y2K38 aware. Sleep well.", "bbs-body");
    rule();
    setPrompt("[Enter] back:");
  }

  function whosOnline() {
    screen = "who";
    blank();
    line(c("bbs-mag bbs-b", "─── WHO'S ONLINE ───"));
    line(c("bbs-dim", "  NODE  HANDLE              BAUD    DOING"));
    line(`  ${c("bbs-wht", "1".padEnd(5))} ${c("bbs-yel", "jbroberts (SysOp)".padEnd(19))} ${c("bbs-wht", "T1".padEnd(7))} ${c("bbs-dim", "keeping a bank's AWS up")}`);
    line(`  ${c("bbs-wht", "2".padEnd(5))} ${c("bbs-cyn", (handle() || "guest").slice(0, 19).padEnd(19))} ${c("bbs-wht", "14400".padEnd(7))} ${c("bbs-dim", "reading the source, probably")}`);
    line(`  ${c("bbs-wht", "3".padEnd(5))} ${c("bbs-dim", "(waiting for caller)")}`);
    setPrompt("[Enter] back:");
  }

  async function pageSysop() {
    screen = "paging";
    animating = true; skip = false;
    blank();
    print("Paging SysOp", "bbs-yel");
    if (soundOn() && !reduceMotion) beep(3);
    for (let i = 0; i < 3; i++) { await sleep(450); out.lastChild.innerHTML += c("bbs-yel", " ."); }
    await sleep(300);
    animating = false;
    print("The SysOp is busy keeping a Fortune 500 bank's cloud running.", "bbs-body");
    line(`Leave him a message by email? ${key("Y")}es / ${key("N")}o`);
    screen = "page-confirm";
    setPrompt("Y/N:");
  }

  async function goodbye() {
    animating = true; skip = false;
    blank();
    line(c("bbs-cyn", `Thanks for calling The Matrix, ${handle() || "caller"}. Time online: ${Math.max(1, Math.round((Date.now() - (ctx.since || Date.now())) / 60000))} min.`));
    await sleep(350);
    print("+++", "bbs-wht"); await sleep(500);
    print("ATH0", "bbs-wht"); await sleep(300);
    line(c("bbs-red bbs-b", "NO CARRIER"));
    animating = false;
    blank();
    out.classList.remove("is-bbs");
    setMode(null);
    api.onExit();
  }

  function linkify(text) {
    return esc(text).replace(/https?:\/\/[^\s<]+/g, (u) => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
  }

  /* ---------------- input ---------------- */

  async function onInput(raw) {
    if (animating) { skip = true; return; }
    const v = raw.trim();
    const k = v.toLowerCase();
    if (v) line(c("bbs-dim", "> ") + esc(v));

    switch (screen) {
      case "handle": {
        const h = v.replace(/[^\w .\-]/g, "").slice(0, 18) || "guest";
        store.set("bbs.handle", h);
        line(`${c("bbs-cyn", "Welcome to The Matrix,")} ${c("bbs-yel bbs-b", h)}${c("bbs-cyn", ".")}`);
        return mainMenu();
      }
      case "main":
        if (k === "m") return boardsMenu();
        if (k === "f") return areasMenu();
        if (k === "d") return doorsMenu();
        if (k === "b") return bulletins();
        if (k === "w") return whosOnline();
        if (k === "p") return pageSysop();
        if (k === "g" || k === "q" || k === "exit" || k === "logoff") return goodbye();
        return line(c("bbs-red", "Huh? Pick a letter from the menu."));
      case "boards": {
        if (k === "q") return mainMenu();
        const i = parseInt(k, 10) - 1;
        if (BOARDS[i]) return threadsMenu(i);
        return line(c("bbs-red", "No such board."));
      }
      case "threads": {
        if (k === "q") return boardsMenu();
        const i = parseInt(k, 10) - 1;
        if (BOARDS[ctx.board].threads[i]) return readThread(i);
        return line(c("bbs-red", "No such message."));
      }
      case "reading": return threadsMenu(ctx.board);
      case "areas": {
        if (k === "q") return mainMenu();
        if (k === "u") return line(c("bbs-red", "Uploads disabled. The SysOp learned about boot-sector viruses in 1994."));
        const i = parseInt(k, 10) - 1;
        if (AREAS[i]) return filesMenu(i);
        return line(c("bbs-red", "No such area."));
      }
      case "files": {
        if (k === "q") return areasMenu();
        const i = parseInt(k, 10) - 1;
        if (AREAS[ctx.area].files[i]) return download(i);
        return line(c("bbs-red", "No such file."));
      }
      case "downloading": return filesMenu(ctx.area);
      case "doors": {
        if (k === "q") return mainMenu();
        const d = DOORS[parseInt(k, 10) - 1];
        if (!d) return line(c("bbs-red", "No such door."));
        line(`${c("bbs-yel", "Opening door: " + d.name)} ${c("bbs-dim", "(new window)")}`);
        window.open(d.url, "_blank", "noopener");
        return;
      }
      case "bulletin":
      case "who":
        return mainMenu();
      case "page-confirm":
        if (k === "y") {
          window.location.href = `mailto:${PROFILE.email}?subject=${encodeURIComponent("Paged you from The Matrix BBS")}`;
          line(c("bbs-grn", "Opening your mail client ..."));
        }
        return mainMenu();
      default:
        return mainMenu();
    }
  }

  return {
    async connect() {
      ctx.since = Date.now();
      setMode(onInput);
      await dial();
    },
    // Called for every keydown while the BBS owns the shell: any key skips animations.
    onKey() { if (animating) { skip = true; if (audio) audio.stop(); } },
    isAnimating: () => animating,
    hangUp() { if (audio) audio.stop(); },
  };
}

// Live GitHub data, fetched in the browser from the public API (no token).
// Cached for an hour so repeat visits don't spend the 60-requests-per-hour budget.
const USER = "roberjo";
const CACHE_KEY = "gh.summary.v1";
const TTL = 60 * 60 * 1000;

let inflight = null;

function readCache() {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (c && Date.now() - c.at < TTL) return c.data;
  } catch (e) {}
  return null;
}

function writeCache(data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data })); } catch (e) {}
}

export function getGithubSummary() {
  const cached = readCache();
  if (cached) return Promise.resolve(cached);
  if (inflight) return inflight;
  inflight = fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed&type=owner`, {
    headers: { Accept: "application/vnd.github+json" },
  })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
    .then((repos) => {
      const own = repos.filter((r) => !r.fork && !r.private);
      const counts = {};
      own.forEach((r) => { if (r.language) counts[r.language] = (counts[r.language] || 0) + 1; });
      const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
      const languages = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, n]) => ({ name, n, pct: Math.round((n / total) * 100) }));
      const recent = own.slice(0, 8).map((r) => ({
        name: r.name, url: r.html_url, pushed: r.pushed_at, language: r.language, description: r.description,
      }));
      const data = { repoCount: own.length, languages, recent, fetchedAt: Date.now() };
      writeCache(data);
      return data;
    })
    .catch(() => null)
    .finally(() => { inflight = null; });
  return inflight;
}

export function timeAgo(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  const units = [["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60]];
  for (const [u, n] of units) {
    const v = Math.floor(s / n);
    if (v >= 1) return `${v} ${u}${v > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

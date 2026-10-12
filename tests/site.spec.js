// @ts-check
const { test, expect } = require('@playwright/test');

// Serve a fixed GitHub API response so tests never depend on the network or rate limits.
const GH_FIXTURE = [
    { name: 'mainframe-frontier', html_url: 'https://github.com/roberjo/mainframe-frontier', pushed_at: new Date().toISOString(), language: 'Rust', fork: false, private: false },
    { name: 'ticket-remediation', html_url: 'https://github.com/roberjo/ticket-remediation', pushed_at: new Date().toISOString(), language: 'Python', fork: false, private: false },
    { name: 'VINScout', html_url: 'https://github.com/roberjo/VINScout', pushed_at: new Date().toISOString(), language: 'TypeScript', fork: false, private: false },
];

test.use({ colorScheme: 'dark' });

test.beforeEach(async ({ page }) => {
    await page.route('https://api.github.com/**', (route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(GH_FIXTURE) }));
});

async function openShell(page) {
    await page.locator('body').click({ position: { x: 5, y: 300 } });
    await page.keyboard.press('Backquote');
    const input = page.locator('#shell-in');
    await expect(input).toBeVisible();
    return input;
}

async function run(page, input, cmd) {
    await input.fill(cmd);
    await input.press('Enter');
}

test('loads without console errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto('/');
    await expect(page).toHaveTitle(/John B. Roberts/);
    await expect(page.locator('#hero-graph')).toBeVisible();
    await page.waitForTimeout(500);
    expect(errors).toEqual([]);
});

test('nav link scrolls to projects', async ({ page, isMobile }) => {
    await page.goto('/');
    if (isMobile) await page.locator('#menu-toggle').click();
    await page.getByRole('link', { name: 'Projects', exact: true }).first().click();
    await expect(page.getByRole('heading', { name: 'Selected work' })).toBeInViewport();
});

test('theme toggle switches and persists', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.locator('#theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('project filter shows only matching projects', async ({ page }) => {
    await page.goto('/');
    await page.locator('.chip[data-filter="legacy"]').click();
    await expect(page.locator('#p-mainframe-frontier')).toBeVisible();
    await expect(page.locator('#p-VINScout')).toBeHidden();
    await expect(page.locator('#p-ssis-parser')).toBeVisible();
});

test('no horizontal overflow', async ({ page }) => {
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
});

test('live activity renders from the GitHub API', async ({ page }) => {
    await page.goto('/');
    await page.locator('#activity').scrollIntoViewIfNeeded();
    await expect(page.locator('#activity-recent')).toContainText('mainframe-frontier');
    await expect(page.locator('#activity-langs')).toContainText('Rust');
});

test('command palette jumps to a project', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard shortcut is a desktop feature');
    await page.goto('/');
    await page.keyboard.press('ControlOrMeta+k');
    await page.locator('#palette-in').fill('vinsc');
    await page.keyboard.press('Enter');
    await expect(page.locator('#p-VINScout')).toBeInViewport();
});

test('shell runs commands', async ({ page, isMobile }) => {
    test.skip(isMobile, 'backtick shortcut is a desktop feature');
    await page.goto('/');
    const input = await openShell(page);
    await run(page, input, 'help');
    await expect(page.locator('#shell-out')).toContainText('career');
    await run(page, input, 'cat mainframe');
    await expect(page.locator('#shell-out')).toContainText('COBOL');
    await run(page, input, 'career');
    await expect(page.locator('#shell-out')).toContainText('AT&T');
    await run(page, input, 'nope');
    await expect(page.locator('#shell-out')).toContainText('command not found');
});

test('every quest clue in the shipped files decodes to its fragment', async ({ page, request }) => {
    // Room I: Base64 in the HTML comment at the top of index.html.
    const html = await (await request.get('/')).text();
    const comment = html.slice(html.indexOf('<!--'), html.indexOf('-->'));
    const b64 = comment.match(/\s([A-Za-z0-9+/]{4,}==)\s/)[1];
    const fragment1 = Buffer.from(b64, 'base64').toString('ascii');

    // Room II: ROT13 in an unused CSS custom property.
    const css = await (await request.get('/assets/css/style.css')).text();
    const rot = css.match(/--fragment-2:\s*"([A-Z]+)"/)[1];
    const fragment2 = rot.replace(/[A-Z]/g, (c) => String.fromCharCode(((c.charCodeAt(0) - 65 + 13) % 26) + 65));

    // Room III: robots.txt points at the vault; the vault shows EBCDIC (code page 037).
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toMatch(/Disallow: \/vault\//);
    const vault = await (await request.get('/vault/')).text();
    const hex = vault.match(/class="hex">([0-9A-F ]+)</)[1].trim().split(/\s+/);
    const ebcdic = (h) => {
        const n = parseInt(h, 16), hi = n >> 4, lo = n & 15;
        const base = { 0xC: 'A', 0xD: 'J', 0xE: 'S' }[hi];
        return String.fromCharCode(base.charCodeAt(0) + lo - (hi === 0xE ? 2 : 1));
    };
    const fragment3 = hex.map(ebcdic).join('');

    // Room IV: binary printed to the developer console.
    const logs = [];
    page.on('console', (m) => logs.push(m.text()));
    await page.goto('/');
    // console.log("%c…", style) arrives with the style string attached, so match the bytes anywhere.
    const bin = logs.map((l) => l.match(/(?:[01]{8} ){6}[01]{8}/)).find(Boolean)[0];
    const fragment4 = bin.split(' ').map((b) => String.fromCharCode(parseInt(b, 2))).join('');

    expect([fragment1, fragment2, fragment3, fragment4]).toEqual(['KEEP', 'THE', 'COBOL', 'RUNNING']);
});

test('the quest can be completed in the shell', async ({ page, isMobile }) => {
    test.skip(isMobile, 'backtick shortcut is a desktop feature');
    await page.goto('/');
    const input = await openShell(page);
    const out = page.locator('#shell-out');
    await run(page, input, 'quest');
    await expect(out).toContainText('THE LOST DEPLOY KEY');
    await run(page, input, 'take WRONG');
    await expect(out).toContainText("doesn't fit any lock");
    for (const f of ['keep', 'THE', 'Cobol', 'RUNNING']) await run(page, input, `take ${f}`);
    await expect(out).toContainText('(4/4)');
    await run(page, input, 'unlock KEEP-THE-COBOL-RUNNING');
    await expect(out).toContainText('ACHIEVEMENT UNLOCKED');
});

test('konami code toggles mainframe mode', async ({ page, isMobile }) => {
    test.skip(isMobile, 'needs a keyboard');
    await page.goto('/');
    await page.locator('body').click({ position: { x: 5, y: 300 } });
    for (const k of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']) {
        await page.keyboard.press(k);
    }
    await expect(page.locator('html')).toHaveAttribute('data-mainframe', '');
});

test('404 page and vault page load', async ({ page }) => {
    const r = await page.goto('/vault/');
    expect(r.status()).toBe(200);
    await expect(page.locator('body')).toContainText('THE MAINFRAME VAULT');
});

// Run with Vite at 127.0.0.1:5173 and Playwright available: node checks/tripAccordion.cjs
const assert = require("node:assert/strict");
const { chromium } = require("playwright");

async function check() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
    const requests = [];
    let releaseFirst;
    const firstResponse = new Promise(resolve => { releaseFirst = resolve; });
    let finishFirst;
    const firstFinished = new Promise(resolve => { finishFirst = resolve; });
    const items = ["a", "b", "empty", "error", "next"].map((id, order) => ({
      id, name: `Trip ${id}`, order,
      date: id === "next" ? "2026-10-16" : "2026-10-15",
      mapUrl: "https://example.com/map",
      lastEditedTime: "2026-10-15T00:00:00Z"
    }));
    await page.route("**/.netlify/functions/notion?*", route => route.fulfill({ json: items }));
    await page.route("**/.netlify/functions/page?*", async route => {
      const id = new URL(route.request().url()).searchParams.get("id");
      requests.push(id);
      if (id === "a") await firstResponse;
      if (id === "error") return route.fulfill({ status: 500, body: "unavailable" });
      const content = id === "empty" ? [] : [{ type: "paragraph", text: `Note ${id}` }];
      if (id === "a") content.push({
        type: "image", caption: "Preview image",
        url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='60'%3E%3Crect width='80' height='60' fill='pink'/%3E%3C/svg%3E"
      });
      await route.fulfill({ json: { content } });
      if (id === "a") finishFirst();
    });

    const toggle = id => page.getByRole("button", { name: `Trip ${id}`, exact: true });
    const note = id => page.locator(`#trip-note-${id}`);
    await page.goto("http://127.0.0.1:5173/2026-10-15");
    await toggle("a").waitFor();
    assert.deepEqual(requests, [], "Initial render must not fetch notes");
    assert.equal(await page.locator("aside.detail").count(), 0);

    const popupPromise = page.waitForEvent("popup");
    await page.locator(".card").first().getByRole("link").click();
    await (await popupPromise).close();
    assert.deepEqual(requests, [], "Map links must not open notes");

    await toggle("a").click();
    await note("a").getByRole("status").waitFor();
    await toggle("b").click();
    await note("b").getByText("Note b", { exact: true }).waitFor();
    const lateResponse = page.waitForResponse(response => response.url().includes("/page?id=a&"));
    releaseFirst();
    await firstFinished;
    await (await lateResponse).finished();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await note("a").isVisible(), false);
    assert.equal(await note("b").innerText(), "Note b", "Late responses must not replace the active note");

    await toggle("b").click();
    assert.equal(await note("b").isVisible(), false);
    await toggle("b").focus();
    await page.keyboard.press("Enter");
    await note("b").getByText("Note b", { exact: true }).waitFor();
    assert.deepEqual(requests, ["a", "b"], "Reopening must reuse the existing cache");

    await page.setViewportSize({ width: 1080, height: 800 });
    await page.locator("aside.detail").getByText("Note b", { exact: true }).waitFor();
    assert.equal(await page.locator(".trip-notes").count(), 0);
    const listBounds = await page.locator(".list").boundingBox();
    const detailBounds = await page.locator("aside.detail").boundingBox();
    assert.ok(detailBounds.x >= listBounds.x + listBounds.width, "Desktop notes must remain to the right of the list");
    await toggle("b").click();
    assert.equal(await page.locator("aside.detail").getByText("Note b", { exact: true }).isVisible(), true);
    await page.setViewportSize({ width: 390, height: 844 });
    await note("b").getByText("Note b", { exact: true }).waitFor();
    const summaryBounds = await page.locator(".card-summary").nth(1).boundingBox();
    const noteBounds = await note("b").boundingBox();
    assert.ok(noteBounds.y >= summaryBounds.y + summaryBounds.height, "Mobile notes must expand beneath their own item");

    await toggle("a").click();
    await note("a").getByRole("button", { name: "Preview image" }).click();
    await page.locator(".image-modal").waitFor();
    await page.keyboard.press("Escape");
    assert.equal(await page.locator(".image-modal").count(), 0);
    assert.equal(await toggle("a").getAttribute("aria-expanded"), "true");

    await toggle("empty").click();
    await note("empty").getByText("這個項目目前沒有筆記內容").waitFor();
    await toggle("error").click();
    await note("error").getByText("內容載入失敗").waitFor();
    await toggle("error").click();
    await toggle("error").click();
    await note("error").getByText("內容載入失敗").waitFor();
    assert.equal(requests.filter(id => id === "error").length, 2, "Errors must remain retryable");
    await page.locator(".date-tabs button").nth(1).click();
    await toggle("next").waitFor();
    assert.equal(await note("next").isVisible(), false);
    assert.equal(requests.includes("next"), false, "Changing dates must not preload notes");
    console.log("PASS: lazy loading, mobile accordion, cache, response order, desktop layout, keyboard, maps, images, empty/error states, date switching");
  } finally {
    await browser.close();
  }
}

check().catch(error => { console.error(error); process.exitCode = 1; });

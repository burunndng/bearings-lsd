import { test, expect } from "@playwright/test";

const guidedWorksheets = [
  "/sheet/preparation",
  "/sheet/session-focus",
  "/sheet/integration",
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.print = () => {
      (window as Window & { __printCalled?: boolean }).__printCalled = true;
    };
  });
});

test("desktop navigation exposes the six public pillars and private tools", async ({ page }) => {
  await page.goto("/");
  const primary = page.locator(".site-nav--primary");
  await expect(primary).toBeVisible();
  for (const label of ["Before", "In between", "Integration", "Learn", "Worksheets", "Resources"]) {
    await expect(primary.getByRole("link", { name: label, exact: true })).toBeVisible();
  }
  await page.locator(".tools-menu summary").click();
  const tools = page.getByRole("navigation", { name: "Tools" });
  await expect(tools).toBeVisible();
  for (const label of ["Combinations", "Notes", "Sessions", "Strategy", "Settings"]) {
    await expect(tools.getByRole("link", { name: label, exact: true })).toBeVisible();
  }
});

test("mobile navigation stays collapsed until opened", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".site-nav--primary")).toBeHidden();
  await expect(page.locator(".nav-toggle")).toBeVisible();
  await page.locator(".nav-toggle summary").click();
  const sections = page.getByRole("navigation", { name: "Sections and tools" });
  await expect(sections).toBeVisible();
  await expect(sections.getByRole("link")).toHaveCount(11);
});

test("homepage reaches all four deeper pillars directly", async ({ page }) => {
  await page.goto("/");
  const deeper = page.locator(".deeper");
  await expect(deeper.getByRole("link", { name: /Learn/ })).toHaveAttribute("href", "/learn");
  await expect(deeper.getByRole("link", { name: /Worksheets/ })).toHaveAttribute("href", "/sheet");
  await expect(deeper.getByRole("link", { name: /Resources/ })).toHaveAttribute("href", "/resources");
  await expect(deeper.getByRole("link", { name: /Deep Work/ })).toHaveAttribute("href", "/learn#deep-work");
});

test("every worksheet route marks Worksheets as current", async ({ page }) => {
  for (const path of ["/sheet", ...guidedWorksheets]) {
    await page.goto(path);
    await expect(page.locator('.site-nav--primary a[aria-current="page"]')).toHaveText("Worksheets");
  }
});

test("Learn separates evidence from Deep Work", async ({ page }) => {
  await page.goto("/learn#deep-work");
  const deepWork = page.locator("#deep-work");
  await expect(deepWork).toBeVisible();
  await expect(deepWork.getByRole("heading", { name: "Looking longer", exact: true })).toBeVisible();
  await expect(deepWork.locator(".card.deep")).toHaveCount(3);
  await expect(page.locator("#evidence")).toBeVisible();
});

test("safety routes and worksheet tools have no 320px overflow", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  for (const path of ["/safety", "/combinations", "/sheet", ...guidedWorksheets]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, path).toBe(0);
  }
});

test("urgent safety route appears before detailed routes and referrals", async ({ page }) => {
  await page.goto("/safety");
  const referrals = page.getByRole("heading", { name: "Where to reach people" });
  const urgent = page.getByRole("heading", { name: "Get urgent help now" });
  await expect(referrals).toBeVisible();
  expect((await referrals.boundingBox())!.y).toBeLessThan((await urgent.boundingBox())!.y);
  await expect(page.getByText("Find a Helpline")).toBeVisible();
});

test("production registers a service worker and serves safety offline", async ({ page, context }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await context.setOffline(true);
  await page.goto("/safety");
  await expect(page.getByRole("heading", { name: "Support & safety" })).toBeVisible();
  await context.setOffline(false);
});

test("guided worksheet can print one part", async ({ page }) => {
  await page.goto("/sheet/preparation");
  await expect(page.getByRole("button", { name: /^Print only / })).toHaveCount(9);
  await page.getByRole("button", { name: "Print only Why now — or why not" }).click();
  await page.emulateMedia({ media: "print" });
  expect(await page.evaluate(() => (window as Window & { __printCalled?: boolean }).__printCalled)).toBe(true);
  await expect(page.locator(".worksheet .block:visible")).toHaveCount(1);
});

test("safety Sheet can print one part", async ({ page }) => {
  await page.goto("/sheet");
  await page.locator("#safety-sheet").scrollIntoViewIfNeeded();
  await expect(page.getByRole("button", { name: /^Print only / })).toHaveCount(8);
  await page.getByRole("button", { name: "Print only Who" }).click();
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".sheet .block:visible")).toHaveCount(1);
});

test("reduce-motion preference immediately stills NightField", async ({ page }) => {
  await page.goto("/settings");
  await page.getByLabel("Reduce all motion").check();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduce");
  await page.waitForTimeout(150);
  const firstFrame = await page.locator("#nightfield").evaluate((canvas) =>
    (canvas as HTMLCanvasElement).toDataURL(),
  );
  await page.waitForTimeout(500);
  const secondFrame = await page.locator("#nightfield").evaluate((canvas) =>
    (canvas as HTMLCanvasElement).toDataURL(),
  );
  expect(firstFrame).toBe(secondFrame);
});

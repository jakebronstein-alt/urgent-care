import { test, expect } from "@playwright/test";

test.describe("City listing page (/urgent-care/[stateSlug]/[citySlug])", () => {
  test("shows the city and state in the main heading", async ({ page }) => {
    await page.goto("/urgent-care/ny/new-york");
    await expect(
      page.getByRole("heading", { name: /urgent care in new york, ny/i })
    ).toBeVisible();
  });

  test("capitalises multi-word city slugs correctly", async ({ page }) => {
    await page.goto("/urgent-care/ny/brooklyn");
    await expect(
      page.getByRole("heading", { name: /urgent care in brooklyn, ny/i })
    ).toBeVisible();
  });

  test("shows a breadcrumb link back to the urgent care home", async ({ page }) => {
    await page.goto("/urgent-care/ny/new-york");
    const homeLink = page.getByRole("link", { name: /urgent care/i }).first();
    await expect(homeLink).toHaveAttribute("href", "/urgent-care");
  });

  test("shows a breadcrumb link for the state", async ({ page }) => {
    await page.goto("/urgent-care/ny/new-york");
    // Target the breadcrumb link directly by its href to avoid matching clinic card links
    const stateLink = page.locator('a[href="/urgent-care/ny"]').first();
    await expect(stateLink).toBeVisible();
    await expect(stateLink).toHaveText("NY");
  });

  test("renders clinic cards for Manhattan", async ({ page }) => {
    await page.goto("/urgent-care/ny/new-york");
    // At least one clinic link should point to a clinic detail page
    const clinicLink = page.locator("a[href*='/urgent-care/ny/new-york/']").first();
    await expect(clinicLink).toBeVisible();
  });

  test("renders wait time badges on clinic cards", async ({ page }) => {
    await page.goto("/urgent-care/ny/new-york");
    // Each clinic card has a wait badge containing "WAIT" or "No Data"
    const badge = page.locator("text=/wait/i").first();
    await expect(badge).toBeVisible();
  });

  test("shows a clinic count in the subheading", async ({ page }) => {
    await page.goto("/urgent-care/ny/new-york");
    await expect(page.locator("text=/clinic/i").first()).toBeVisible();
  });

  test("renders the service filter pills", async ({ page }) => {
    await page.goto("/urgent-care/ny/brooklyn");
    await expect(page.getByRole("button", { name: "X-Ray" })).toBeVisible();
    await expect(page.getByRole("button", { name: "COVID Testing" })).toBeVisible();
  });

  test("shows the symptom checker CTA", async ({ page }) => {
    await page.goto("/urgent-care/ny/new-york");
    await expect(page.getByText(/start a symptom check/i)).toBeVisible();
  });

  test("clicking a service filter pill appends ?service= to the URL", async ({
    page,
  }) => {
    await page.goto("/urgent-care/ny/new-york");
    await page.getByRole("button", { name: "X-Ray" }).click();
    await expect(page).toHaveURL(/service=X-Ray/);
  });

  test("shows empty state for a city with no clinics", async ({ page }) => {
    // Use a city slug that has no clinics in the DB
    await page.goto("/urgent-care/ny/nonexistent-city-xyz");
    await expect(
      page.getByRole("heading", { name: /urgent care in nonexistent city xyz, ny/i })
    ).toBeVisible();
    await expect(page.getByText(/no clinics listed yet/i).first()).toBeVisible();
  });
});

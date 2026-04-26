import { test, expect } from "@playwright/test";

test.describe("Search page — NYC location query", () => {
  test("shows a location-specific heading for a Manhattan query", async ({ page }) => {
    await page.goto("/urgent-care/search?q=manhattan");
    await expect(
      page.getByRole("heading", { name: /urgent care in manhattan/i })
    ).toBeVisible();
  });

  test("shows a breadcrumb link back to the home page", async ({ page }) => {
    await page.goto("/urgent-care/search?q=brooklyn");
    const breadcrumb = page.getByRole("link", { name: /urgent care/i }).first();
    await expect(breadcrumb).toHaveAttribute("href", "/urgent-care");
  });

  test("renders clinic cards with wait time badges for a Brooklyn query", async ({ page }) => {
    await page.goto("/urgent-care/search?q=brooklyn");
    const cards = page.locator("a[href*='/urgent-care/ny/brooklyn/']");
    await expect(cards.first()).toBeVisible();
    // Wait time badge text is always present (short/moderate/long/unknown)
    const badge = page.locator("text=/wait/i").first();
    await expect(badge).toBeVisible();
  });

  test("shows the clinic count in the subheading", async ({ page }) => {
    await page.goto("/urgent-care/search?q=manhattan");
    await expect(page.locator("text=/clinic/i").first()).toBeVisible();
  });

  test("shows the symptom checker CTA", async ({ page }) => {
    await page.goto("/urgent-care/search?q=queens");
    await expect(page.getByText(/start a symptom check/i)).toBeVisible();
  });
});

test.describe("Search page — out-of-area query", () => {
  test("shows 'We're not in [city] yet' for a non-NYC location", async ({ page }) => {
    await page.goto("/urgent-care/search?q=chicago");
    await expect(
      page.getByRole("heading", { name: /we.re not in chicago yet/i })
    ).toBeVisible();
  });

  test("tells the user the service is NYC-only", async ({ page }) => {
    await page.goto("/urgent-care/search?q=los+angeles");
    await expect(
      page.getByText(/currently only available in new york city/i)
    ).toBeVisible();
  });

  test("offers Ubie Consult as an alternative", async ({ page }) => {
    await page.goto("/urgent-care/search?q=seattle");
    const link = page.getByRole("link", { name: /try ubie consult/i });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "https://ubiehealth.com/consult/");
  });

  test("shows NYC borough links so users can still browse in-area clinics", async ({
    page,
  }) => {
    await page.goto("/urgent-care/search?q=miami");
    await expect(page.getByRole("link", { name: "Manhattan" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Brooklyn" })).toBeVisible();
  });
});

test.describe("Search page — service filter query", () => {
  test("shows the service name in the heading", async ({ page }) => {
    await page.goto("/urgent-care/search?service=X-Ray");
    await expect(
      page.getByRole("heading", { name: /clinics offering x-ray/i })
    ).toBeVisible();
  });

  test("highlights the active service pill", async ({ page }) => {
    await page.goto("/urgent-care/search?service=COVID+Testing");
    const pill = page.getByRole("button", { name: "COVID Testing" });
    // Active pill has white text (bg-ubie-blue class applied)
    await expect(pill).toBeVisible();
    await expect(pill).toHaveClass(/bg-ubie-blue/);
  });

  test("shows no-service prompt when no service is selected", async ({ page }) => {
    await page.goto("/urgent-care/search");
    await expect(
      page.getByText(/select a service above/i)
    ).toBeVisible();
  });
});

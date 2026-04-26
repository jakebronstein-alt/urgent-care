import { test, expect } from "@playwright/test";

test.describe("Home page (/urgent-care)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/urgent-care");
  });

  test("shows the main heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /find urgent care near you/i })
    ).toBeVisible();
  });

  test("has a location search input", async ({ page }) => {
    await expect(
      page.getByPlaceholder(/neighborhood, zip code, or city/i)
    ).toBeVisible();
  });

  test("has a Search button that submits to /urgent-care/search", async ({ page }) => {
    const form = page.locator("form[action='/urgent-care/search']");
    await expect(form).toBeAttached();
    await expect(page.getByRole("button", { name: /search/i })).toBeVisible();
  });

  test("shows the Browse by area section with city links", async ({ page }) => {
    await expect(page.getByText("Browse by area")).toBeVisible();
    await expect(page.getByRole("link", { name: "Manhattan, NY" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Brooklyn, NY" })).toBeVisible();
    await expect(page.getByRole("link", { name: "The Bronx, NY" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Staten Island, NY" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Jersey City, NJ" })).toBeVisible();
  });

  test("Manhattan link points to the correct city URL", async ({ page }) => {
    const link = page.getByRole("link", { name: "Manhattan, NY" });
    await expect(link).toHaveAttribute("href", "/urgent-care/ny/new-york");
  });

  test("shows the Search by service section with filter pills", async ({ page }) => {
    await expect(page.getByText("Search by service")).toBeVisible();
    await expect(page.getByRole("button", { name: "X-Ray" })).toBeVisible();
    await expect(page.getByRole("button", { name: "COVID Testing" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Pediatrics" })).toBeVisible();
  });

  test("shows the symptom checker CTA", async ({ page }) => {
    await expect(page.getByText(/start a symptom check/i)).toBeVisible();
  });

  test("typing a query and submitting navigates to the search page", async ({ page }) => {
    await page.getByPlaceholder(/neighborhood, zip code, or city/i).fill("brooklyn");
    await page.getByRole("button", { name: /search/i }).click();
    await expect(page).toHaveURL(/\/urgent-care\/search\?q=brooklyn/);
  });
});

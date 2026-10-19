import { expect, test } from "@playwright/test";

test.describe("Arabic browser", () => {
  test.use({ locale: "ar-SA" });

  test("uses Arabic with right-to-left layout", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/ar$/);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("منصة تحفيظ القرآن");
  });
});

test("switches to English with left-to-right layout", async ({ page }) => {
  await page.goto("/ar");
  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Quran Learning Platform");
});

test("sends security headers", async ({ request }) => {
  const response = await request.get("/en");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(response.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(response.headers()["x-powered-by"]).toBeUndefined();
});

import { expect, test } from "@playwright/test";

test.describe("Arabic browser", () => {
  test.use({ locale: "ar-SA" });

  test("uses Arabic with right-to-left layout", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/ar$/);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("سجّل حفظ القرآن في ثوانٍ");
  });
});

test("switches to English with left-to-right layout", async ({ page }) => {
  await page.goto("/ar");
  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Quran memorization, recorded in seconds");
});

test("sends security headers", async ({ request }) => {
  const response = await request.get("/en");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(response.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(response.headers()["x-powered-by"]).toBeUndefined();
});

test.describe("legal pages", () => {
  test.use({ locale: "ar-SA" });

  test("footer links to About, Privacy and Terms in both languages", async ({ page }) => {
    await page.goto("/ar");
    const footer = page.getByRole("contentinfo");
    await footer.getByRole("link", { name: "سياسة الخصوصية" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "سياسة الخصوصية" })).toBeVisible();
    await expect(page.getByText("كندا (الوسطى)")).toBeVisible();

    await footer.getByRole("link", { name: "شروط الاستخدام" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "شروط الاستخدام" })).toBeVisible();

    await footer.getByRole("link", { name: "عن المنصة" }).click();
    await expect(page.getByText(/tanzil\.net/)).toBeVisible();

    await page.goto("/en/privacy");
    await expect(page.getByRole("heading", { level: 1, name: "Privacy Policy" })).toBeVisible();
  });

  test("sign-up links to the Terms and Privacy Policy", async ({ page }) => {
    await page.goto("/ar/signup");
    const form = page.getByRole("main");
    await expect(form.getByRole("link", { name: "شروط الاستخدام" })).toHaveAttribute("href", "/ar/terms");
    await expect(form.getByRole("link", { name: "سياسة الخصوصية" })).toHaveAttribute("href", "/ar/privacy");
  });
});

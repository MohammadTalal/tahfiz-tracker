import { expect, type Page, test } from "@playwright/test";

// Full pilot workflow against the local Supabase stack (`npm run db:start`).
// Arabic UI, as most teachers will use it.
test.use({ locale: "ar-SA" });

const PASSWORD = "test-password-123";

async function signUp(page: Page, name: string, email: string) {
  await page.getByLabel("اسمك").fill(name);
  await page.getByLabel("البريد الإلكتروني").fill(email);
  await page.getByLabel("كلمة المرور").fill(PASSWORD);
  await page.getByRole("button", { name: "إنشاء الحساب" }).click();
}

test("teacher records a lesson and a parent follows progress", async ({ page, browser }, testInfo) => {
  test.slow();
  const run = `${testInfo.project.name}-${Date.now()}`;
  const teacherEmail = `teacher-${run}@e2e.local`;
  const parentEmail = `parent-${run}@e2e.local`;
  let studentUrl = "";
  let inviteUrl = "";

  await test.step("teacher signs up and creates a circle", async () => {
    await page.goto("/ar/signup");
    await signUp(page, "الأستاذ سعيد", teacherEmail);
    await expect(page).toHaveURL(/\/ar\/onboarding$/);
    await page.getByLabel("الاسم", { exact: true }).fill("حلقة الاختبار");
    await expect(page.getByLabel("أنا أيضًا أدرّس الطلاب هنا")).toBeChecked();
    await page.getByRole("button", { name: "إنشاء" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "حلقة الاختبار" })).toBeVisible();
  });

  await test.step("adds a class and a student", async () => {
    await page.getByLabel("حلقة جديدة").fill("حلقة الفجر");
    await page.getByRole("button", { name: "إضافة حلقة" }).click();
    await page.getByRole("link", { name: /حلقة الفجر/ }).click();
    await page.getByLabel("اسم الطالب").fill("عمر");
    await page.getByRole("button", { name: "إضافة", exact: true }).click();
    await page.getByRole("link", { name: "عمر" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "عمر" })).toBeVisible();
    studentUrl = page.url();
  });

  await test.step("records a lesson with the surah picker", async () => {
    await page.getByRole("link", { name: "تسجيل درس" }).click();
    await page.getByLabel("السورة", { exact: true }).first().selectOption("67"); // by value
    await page.getByLabel("إلى الآية").first().fill("5");
    await page.getByText("جيد", { exact: true }).click();
    await page.getByLabel("ملاحظات لولي الأمر").fill("أحسنت يا عمر");
    await page.getByLabel("ملاحظة خاصة").fill("ملاحظة سرية للمعلم");
    // Next memorization is suggested automatically from the passage.
    await expect(page.getByLabel("الحفظ القادم")).toBeChecked();
    await expect(page.getByLabel("من الآية").nth(1)).toHaveValue("6");
    await expect(page.getByLabel("إلى الآية").nth(1)).toHaveValue("10");
    await page.getByRole("button", { name: "حفظ الدرس" }).click();

    await expect(page).toHaveURL(studentUrl);
    // Scope to the visible page: Next.js keeps the previous route mounted but hidden.
    const main = page.getByRole("main");
    await expect(main.getByRole("listitem").filter({ hasText: "الملك ١–٥" })).toBeVisible();
    await expect(main.getByRole("listitem").filter({ hasText: "الملك ٦–١٠" })).toBeVisible();
    await expect(main.locator("ol").getByText("ملاحظة سرية للمعلم")).toBeVisible();
  });

  await test.step("records the next lesson while offline, then it saves when back online", async () => {
    await page.getByRole("link", { name: "تسجيل درس" }).click();
    await expect(page.getByText("مأخوذ من المهمة الحالية.")).toBeVisible();
    await expect(page.getByLabel("من الآية").first()).toHaveValue("6");
    await page.getByText("ممتاز", { exact: true }).click();

    await page.context().setOffline(true);
    await page.getByRole("button", { name: "حفظ الدرس" }).click();
    await expect(page.getByText(/لا يوجد اتصال/)).toBeVisible();
    await page.context().setOffline(false);

    await expect(page).toHaveURL(studentUrl);
    await expect(page.getByText("الملك ٦–١٠")).toHaveCount(1); // saved once, assignment closed
    await expect(
      page.getByRole("main").getByRole("listitem").filter({ hasText: "الملك ١١–١٥" }),
    ).toBeVisible(); // new assignment
  });

  await test.step("picks a passage by page", async () => {
    await page.getByRole("link", { name: "تسجيل درس" }).click();
    await page.getByRole("radio", { name: "صفحة" }).first().click();
    await page.getByLabel("من صفحة").fill("562");
    await expect(page.getByText(/^= الملك ١–/)).toBeVisible();
    await page.getByRole("radio", { name: "سورة" }).first().click();
    await expect(page.getByLabel("السورة", { exact: true }).first()).toHaveValue("67");
    await page.goto(studentUrl);
  });

  await test.step("marks an assignment as done", async () => {
    const item = page.getByRole("main").getByRole("listitem").filter({ hasText: "الملك ١١–١٥" });
    await item.getByRole("button", { name: "تم" }).click();
    await expect(item).toHaveCount(0);
  });

  await test.step("admin downloads lessons as CSV", async () => {
    const orgId = new URL(studentUrl).pathname.split("/")[3];
    const response = await page.request.get(`/api/orgs/${orgId}/lessons-csv?locale=ar`);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/csv");
    const csv = await response.text();
    expect(csv).toContain("الملك ١–٥");
    expect(csv).toContain("ملاحظة سرية للمعلم");
  });

  await test.step("invites a parent with a share link", async () => {
    await page.getByRole("button", { name: "دعوة ولي أمر" }).click();
    const link = page.getByRole("textbox", { name: "دعوة ولي أمر" });
    await expect(link).toHaveValue(/\/ar\/invite\/[0-9a-f]{64}$/);
    inviteUrl = await link.inputValue();
    await page.getByRole("button", { name: "رمز QR" }).click();
    await expect(page.getByRole("img", { name: "رمز QR لرابط الدعوة" })).toBeVisible();
    await expect(page.getByRole("link", { name: "مشاركة عبر واتساب" })).toHaveAttribute(
      "href",
      /^https:\/\/wa\.me\/\?text=/,
    );
  });

  const parentContext = await browser.newContext({ locale: "ar-SA" });
  const parent = await parentContext.newPage();

  await test.step("parent signs up through the link and sees only permitted progress", async () => {
    await parent.goto(inviteUrl);
    await parent.getByRole("link", { name: "إنشاء الحساب" }).click();
    await signUp(parent, "أبو عمر", parentEmail);
    await expect(parent).toHaveURL(/\/ar\/invite\//);
    await parent.getByRole("button", { name: "قبول الدعوة" }).click();

    await expect(parent).toHaveURL(/\/ar\/children\//);
    await expect(parent.getByRole("heading", { level: 1, name: "عمر" })).toBeVisible();
    await expect(parent.getByText("الملك ١–٥")).toBeVisible();
    await expect(parent.getByText("أحسنت يا عمر")).toBeVisible();
    await expect(parent.getByText("ملاحظة سرية للمعلم")).toHaveCount(0);
  });

  await test.step("the invite link cannot be used twice", async () => {
    await parent.goto(inviteUrl);
    await parent.getByRole("button", { name: "قبول الدعوة" }).click();
    await expect(parent.getByText(/غير صالحة أو منتهية أو مستخدمة/)).toBeVisible();
  });

  await test.step("parent cannot open the staff pages", async () => {
    await parent.goto(studentUrl);
    await expect(parent.getByText("غير موجود، أو ليست لديك صلاحية.")).toBeVisible();
    await expect(parent.getByText("ملاحظة سرية للمعلم")).toHaveCount(0);
  });
  await parentContext.close();

  await test.step("an admin of another organization cannot open this circle", async () => {
    const other = await browser.newContext({ locale: "ar-SA" });
    const otherPage = await other.newPage();
    await otherPage.goto("/ar/login");
    await otherPage.getByLabel("البريد الإلكتروني").fill("other@demo.local");
    await otherPage.getByLabel("كلمة المرور").fill("password123");
    await otherPage.getByRole("button", { name: "دخول" }).click();
    await expect(otherPage).toHaveURL(/\/ar\/o\//);
    await otherPage.goto(studentUrl);
    await expect(otherPage.getByText("غير موجود، أو ليست لديك صلاحية.")).toBeVisible();
    await other.close();
  });
});

test("seeded student page shows lessons and dated assignments", async ({ page }) => {
  // Uses supabase/seed.sql (admin@demo.local, student أحمد with due-dated assignments).
  await page.goto("/ar/login");
  await page.getByLabel("البريد الإلكتروني").fill("admin@demo.local");
  await page.getByLabel("كلمة المرور").fill("password123");
  await page.getByRole("button", { name: "دخول" }).click();
  await expect(page).toHaveURL(/\/ar\/o\//);
  await page.goto("/ar/o/d1000000-0000-0000-0000-000000000001/students/d3000000-0000-0000-0000-000000000001");
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { level: 1, name: "أحمد" })).toBeVisible();
  await expect(main.getByText(/الموعد/).first()).toBeVisible();
  await expect(main.getByText("النبإ ١ – الناس ٦")).toBeVisible(); // cross-surah revision (Tanzil spelling)
});

test("a teacher adds a student to their own class but cannot export", async ({ page }) => {
  // Uses supabase/seed.sql: teacher@demo.local teaches "حلقة ب" and is not an admin.
  await page.goto("/ar/login");
  await page.getByLabel("البريد الإلكتروني").fill("teacher@demo.local");
  await page.getByLabel("كلمة المرور").fill("password123");
  await page.getByRole("button", { name: "دخول" }).click();
  await expect(page).toHaveURL(/\/ar\/o\//);
  await page.goto("/ar/o/d1000000-0000-0000-0000-000000000001/classes/d2000000-0000-0000-0000-000000000002");
  const name = `طالب ${Date.now()}`;
  await page.getByLabel("اسم الطالب").fill(name);
  await page.getByRole("button", { name: "إضافة", exact: true }).click();
  await expect(page.getByRole("link", { name })).toBeVisible();

  const response = await page.request.get("/api/orgs/d1000000-0000-0000-0000-000000000001/lessons-csv");
  expect(response.status()).toBe(403);
});

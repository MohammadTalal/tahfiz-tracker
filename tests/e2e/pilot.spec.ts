import { expect, test } from "@playwright/test";
import { authEmailLink, PASSWORD, signUpAndGetConfirmLink } from "./helpers";

// Full pilot workflow against the local Supabase stack (`npm run db:start`).
// Arabic UI, as most teachers will use it.
test.use({ locale: "ar-SA" });

test("teacher records a lesson and a parent follows progress", async ({ page, browser }, testInfo) => {
  test.slow();
  const run = `${testInfo.project.name}-${Date.now()}`;
  const teacherEmail = `teacher-${run}@e2e.local`;
  const parentEmail = `parent-${run}@e2e.local`;
  let studentUrl = "";
  let inviteUrl = "";

  await test.step("teacher signs up and creates a circle", async () => {
    await page.goto("/ar/signup");
    const confirmLink = await signUpAndGetConfirmLink(page, "الأستاذ سعيد", teacherEmail);
    await page.goto(confirmLink);
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

  // The parent signs up on one browser and opens the confirmation email on
  // another (like a phone's mail app): the invitation must survive that.
  const signupContext = await browser.newContext({ locale: "ar-SA" });
  const parentContext = await browser.newContext({ locale: "ar-SA" });
  const parent = await parentContext.newPage();

  await test.step("parent signs up through the link and sees only permitted progress", async () => {
    const signupPage = await signupContext.newPage();
    await signupPage.goto(inviteUrl);
    await signupPage.getByRole("link", { name: "إنشاء الحساب" }).click();
    const confirmLink = await signUpAndGetConfirmLink(signupPage, "أبو عمر", parentEmail);
    await signupContext.close();

    await parent.goto(confirmLink);
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

test("an invited teacher joins the organization even when the email is confirmed on another device", async ({
  page,
  browser,
}, testInfo) => {
  test.slow();
  const teacherEmail = `invited-teacher-${testInfo.project.name}-${Date.now()}@e2e.local`;

  // Admin (seed) creates a teacher invitation link.
  await page.goto("/ar/login");
  await page.getByLabel("البريد الإلكتروني").fill("admin@demo.local");
  await page.getByLabel("كلمة المرور").fill("password123");
  await page.getByRole("button", { name: "دخول" }).click();
  await expect(page).toHaveURL(/\/ar\/o\//);
  await page.getByRole("button", { name: "دعوة معلم" }).click();
  const inviteUrl = await page.getByRole("textbox", { name: "دعوة معلم" }).inputValue();

  // Laptop: the teacher opens the link and creates an account.
  const laptop = await (await browser.newContext({ locale: "ar-SA" })).newPage();
  await laptop.goto(inviteUrl);
  await laptop.getByRole("link", { name: "إنشاء الحساب" }).click();
  const confirmLink = await signUpAndGetConfirmLink(laptop, "الأستاذة مريم", teacherEmail);

  // Phone: the confirmation email is opened in a different browser.
  const phoneContext = await browser.newContext({ locale: "ar-SA" });
  const phone = await phoneContext.newPage();
  await phone.goto(confirmLink);
  await expect(phone).toHaveURL(/\/ar\/invite\//);
  // They don't accept yet, and go back to the laptop later.
  await phoneContext.close();

  // Laptop, later: a normal log-in from the home page must lead back to the invitation,
  // not to "create your circle".
  await laptop.goto("/ar/login");
  await laptop.getByLabel("البريد الإلكتروني").fill(teacherEmail);
  await laptop.getByLabel("كلمة المرور").fill(PASSWORD);
  await laptop.getByRole("button", { name: "دخول" }).click();
  await expect(laptop).toHaveURL(/\/ar\/invite\//);
  await laptop.getByRole("button", { name: "قبول الدعوة" }).click();
  await expect(laptop.getByRole("heading", { level: 1, name: "مسجد النور" })).toBeVisible();

  // Afterwards the home page goes straight to the organization, with no loop.
  await laptop.goto("/ar/dashboard");
  await expect(laptop.getByRole("heading", { level: 1, name: "مسجد النور" })).toBeVisible();
});

test("password reset works when the email is opened on another device", async ({
  page,
  browser,
}, testInfo) => {
  test.slow();
  const email = `reset-${testInfo.project.name}-${Date.now()}@e2e.local`;
  await page.goto("/ar/signup");
  await page.goto(await signUpAndGetConfirmLink(page, "مستخدم الاختبار", email));
  await expect(page).toHaveURL(/\/ar\/onboarding$/);

  const other = await (await browser.newContext({ locale: "ar-SA" })).newPage();
  await other.goto("/ar/forgot-password");
  await other.getByLabel("البريد الإلكتروني").fill(email);
  await other.getByRole("button", { name: "إرسال الرابط" }).click();
  await expect(other.getByText(/سيصلك رابط الاستعادة/)).toBeVisible();

  const phone = await (await browser.newContext({ locale: "ar-SA" })).newPage();
  await phone.goto(await authEmailLink(phone.request, email, "Reset"));
  await expect(phone).toHaveURL(/\/ar\/reset-password$/);
  await phone.getByLabel("كلمة المرور الجديدة").fill("a-brand-new-password");
  await phone.getByLabel("تأكيد كلمة المرور").fill("a-brand-new-password");
  await phone.getByRole("button", { name: "حفظ كلمة المرور" }).click();
  await expect(phone).toHaveURL(/\/ar\/onboarding$/);

  // The new password works for a fresh log-in.
  const fresh = await (await browser.newContext({ locale: "ar-SA" })).newPage();
  await fresh.goto("/ar/login");
  await fresh.getByLabel("البريد الإلكتروني").fill(email);
  await fresh.getByLabel("كلمة المرور").fill("a-brand-new-password");
  await fresh.getByRole("button", { name: "دخول" }).click();
  await expect(fresh).toHaveURL(/\/ar\/onboarding$/);
});

test("the reset page explains an expired or wrong-browser link", async ({ page }) => {
  await page.goto("/ar/reset-password");
  await page.getByLabel("كلمة المرور الجديدة").fill("another-new-password");
  await page.getByLabel("تأكيد كلمة المرور").fill("another-new-password");
  await page.getByRole("button", { name: "حفظ كلمة المرور" }).click();
  await expect(page.getByText(/فُتح في متصفح مختلف/)).toBeVisible();
});

import { type APIRequestContext, expect, type Page, test } from "@playwright/test";

/** Local Supabase test inbox (Mailpit), started by `supabase start`. */
const MAILPIT = "http://127.0.0.1:54324";
export const PASSWORD = "test-password-123";

/**
 * Fills the sign-up form, submits it, and returns the link from the
 * confirmation email (rewritten to the test server's address).
 */
export async function signUpAndGetConfirmLink(page: Page, name: string, email: string): Promise<string> {
  await page.getByLabel("اسمك").fill(name);
  await page.getByLabel("البريد الإلكتروني").fill(email);
  await page.getByLabel("كلمة المرور").fill(PASSWORD);
  await page.getByRole("button", { name: "إنشاء الحساب" }).click();
  await expect(page.getByText("تحقق من بريدك")).toBeVisible();
  return authEmailLink(page.request, email, "Confirm");
}

/** The /auth/confirm link in the newest auth email to `email` whose subject contains `subject`. */
export async function authEmailLink(
  request: APIRequestContext,
  email: string,
  subject: string,
): Promise<string> {
  const baseURL = test.info().project.use.baseURL!;
  const query = encodeURIComponent(`to:${email} subject:${subject}`);
  for (let attempt = 0; attempt < 20; attempt++) {
    const search = await request.get(`${MAILPIT}/api/v1/search?query=${query}`);
    const [message] = (await search.json()).messages ?? [];
    if (message) {
      const body = await (await request.get(`${MAILPIT}/api/v1/message/${message.ID}`)).json();
      const href = /href="([^"]+\/auth\/confirm[^"]*)"/.exec(body.HTML)?.[1];
      if (!href) throw new Error("No /auth/confirm link in email");
      const url = new URL(href.replaceAll("&amp;", "&"));
      return `${baseURL}${url.pathname}${url.search}`;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`No "${subject}" email for ${email}`);
}

/**
 * Returns `value` only if it is a same-site path ("/..."), so `?next=` can't
 * redirect users to another website. Otherwise returns `fallback`.
 */
export function safeNextPath(value: unknown, fallback = "/dashboard"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(value)) return fallback;
  return value;
}

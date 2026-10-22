/** Invitation tokens are 32 random bytes, hex-encoded (see create_invitation). */
const TOKEN = /^[0-9a-f]{64}$/;

export function isInviteToken(value: unknown): value is string {
  return typeof value === "string" && TOKEN.test(value);
}

/** The token in an invite path such as "/ar/invite/<token>" or "/invite/<token>", if any. */
export function inviteTokenFrom(path: string): string | undefined {
  const match = /^(?:\/(?:ar|en))?\/invite\/([^/?#]+)$/.exec(path);
  return match && isInviteToken(match[1]) ? match[1] : undefined;
}

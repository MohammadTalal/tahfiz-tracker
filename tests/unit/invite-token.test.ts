import { describe, expect, it } from "vitest";
import { inviteTokenFrom, isInviteToken } from "@/lib/invite-token";

const token = "a".repeat(64);

describe("inviteTokenFrom", () => {
  it("reads the token from invite paths", () => {
    expect(inviteTokenFrom(`/ar/invite/${token}`)).toBe(token);
    expect(inviteTokenFrom(`/en/invite/${token}`)).toBe(token);
    expect(inviteTokenFrom(`/invite/${token}`)).toBe(token);
  });

  it("ignores other paths and malformed tokens", () => {
    expect(inviteTokenFrom("/dashboard")).toBeUndefined();
    expect(inviteTokenFrom("/ar/invite/not-a-token")).toBeUndefined();
    expect(inviteTokenFrom(`/ar/invite/${token}/extra`)).toBeUndefined();
    expect(inviteTokenFrom(`/fr/invite/${token}`)).toBeUndefined();
  });
});

describe("isInviteToken", () => {
  it("accepts only 64 lowercase hex characters", () => {
    expect(isInviteToken(token)).toBe(true);
    expect(isInviteToken("A".repeat(64))).toBe(false);
    expect(isInviteToken(123)).toBe(false);
  });
});

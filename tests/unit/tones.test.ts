import { describe, expect, it } from "vitest";
import { TONES, toneAt, toneClasses, toneFor } from "@/lib/tones";

describe("tones", () => {
  it("gives the same tone for the same key", () => {
    expect(toneFor("حلقة الفجر")).toBe(toneFor("حلقة الفجر"));
    expect(toneClasses("x")).toBe(TONES[toneFor("x")]);
  });

  it("spreads keys over several tones", () => {
    const used = new Set(["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"].map(toneFor));
    expect(used.size).toBeGreaterThan(2);
  });

  it("cycles tones by index", () => {
    expect(toneAt(0)).toBe(TONES.emerald);
    expect(toneAt(6)).toBe(TONES.emerald);
  });
});

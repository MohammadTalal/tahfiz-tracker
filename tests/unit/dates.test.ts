import { describe, expect, it } from "vitest";
import { addDays, daysBetween, todayIn } from "@/lib/dates";
import { dayName, weekdayOf, weekOrder } from "@/lib/weekdays";

describe("dates", () => {
  it("gives today's date in the organization's time zone", () => {
    const lateEvening = new Date("2026-10-23T03:30:00Z"); // still the 22nd in Vancouver
    expect(todayIn("America/Vancouver", lateEvening)).toBe("2026-10-22");
    expect(todayIn("Asia/Riyadh", lateEvening)).toBe("2026-10-23");
  });

  it("falls back to UTC for an unknown time zone", () => {
    expect(todayIn("Not/AZone", new Date("2026-10-23T03:30:00Z"))).toBe("2026-10-23");
  });

  it("adds and counts days across month ends", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(daysBetween("2026-10-20", "2026-10-23")).toBe(3);
  });
});

describe("weekdays", () => {
  it("orders the week by locale and names days", () => {
    expect(weekOrder("ar")[0]).toBe(6);
    expect(weekOrder("en")[0]).toBe(0);
    expect(dayName(5, "en")).toBe("Friday");
    expect(dayName(6, "ar")).toBe("السبت");
    expect(weekdayOf("2026-10-23")).toBe(5); // a Friday
  });
});

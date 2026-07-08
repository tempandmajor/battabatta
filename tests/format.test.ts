import { describe, expect, it } from "vitest";
import { formatAvailability, initialsOf, threadTime, timeAgo } from "@/lib/format";

const NOW = new Date("2026-07-02T12:00:00Z");

describe("timeAgo", () => {
  it("buckets recent times", () => {
    expect(timeAgo("2026-07-02T11:59:40Z", NOW)).toBe("just now");
    expect(timeAgo("2026-07-02T11:45:00Z", NOW)).toBe("15m ago");
    expect(timeAgo("2026-07-02T09:00:00Z", NOW)).toBe("3h ago");
    expect(timeAgo("2026-06-30T12:00:00Z", NOW)).toBe("2d ago");
  });

  it("falls back to a date after a week", () => {
    expect(timeAgo("2026-06-01T12:00:00Z", NOW)).toMatch(/Jun/);
  });
});

describe("threadTime", () => {
  it("shows yesterday and weekday buckets", () => {
    expect(threadTime("2026-07-01T13:00:00Z", NOW)).toBe("Yesterday");
    expect(threadTime("2026-06-29T12:00:00Z", NOW)).toMatch(/Mon|Sun/);
  });
});

describe("initialsOf", () => {
  it("takes the first letters of up to two words", () => {
    expect(initialsOf("Sam Okafor")).toBe("SO");
    expect(initialsOf("Maya")).toBe("M");
    expect(initialsOf("Jordan Tran Lee")).toBe("JT");
  });
});

describe("formatAvailability", () => {
  it("avoids duplicated available wording from imported units", () => {
    expect(formatAvailability({ remaining: 1, total: 1, unit: "slot available this month" })).toBe(
      "1 of 1 slot this month"
    );
    expect(formatAvailability({ remaining: 2, total: 2, unit: "outline slots this month" })).toBe(
      "2 of 2 outline slots this month"
    );
  });

  it("returns null for unlimited posts", () => {
    expect(formatAvailability({ remaining: null, total: null, unit: null })).toBeNull();
  });
});

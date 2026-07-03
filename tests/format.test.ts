import { describe, expect, it } from "vitest";
import { initialsOf, threadTime, timeAgo } from "@/lib/format";

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

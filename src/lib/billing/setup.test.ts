import { describe, expect, it } from "vitest";
import { MANILA_TZ } from "@/lib/date/manila";

describe("test setup", () => {
  it("resolves the @/ path alias", () => {
    expect(MANILA_TZ).toBe("Asia/Manila");
  });

  it("runs in UTC", () => {
    expect(new Date("2026-01-01T00:00:00Z").getTimezoneOffset()).toBe(0);
  });
});

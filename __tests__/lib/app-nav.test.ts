import { describe, expect, it } from "vitest";
import { isCurrentHref } from "@/components/registry/n7-shell/app-nav";

describe("isCurrentHref", () => {
  it("matches the href and anything below it, ignoring query, hash and trailing slashes", () => {
    expect(isCurrentHref("/dashboard", "/dashboard")).toBe(true);
    expect(isCurrentHref("/dashboard/", "/dashboard")).toBe(true);
    expect(isCurrentHref("/dashboard/people?x=1#top", "/dashboard")).toBe(true);
    expect(isCurrentHref("/dashboard", "/dashboard/")).toBe(true);
    expect(isCurrentHref("/dashboardx", "/dashboard")).toBe(false);
    expect(isCurrentHref("/anything", "/")).toBe(false);
    expect(isCurrentHref("/", "/")).toBe(true);
  });

  it("treats a run of slashes as trailing slashes", () => {
    expect(isCurrentHref("/a///", "/a")).toBe(true);
    expect(isCurrentHref("//", "/")).toBe(false);
  });

  it("stays fast on a long run of slashes that does not end the path", () => {
    const evil = "/".repeat(200_000) + "x";
    const t = performance.now();
    expect(isCurrentHref(evil, "/a")).toBe(false);
    expect(performance.now() - t).toBeLessThan(1000);
  });
});

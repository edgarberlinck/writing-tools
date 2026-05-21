import { beforeEach, describe, expect, it } from "vitest";

describe("db/index", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      window.localStorage.clear();
    }
  });

  it("creates repository singleton", async () => {
    const mod = await import("../index");

    expect(mod.repository).toBeInstanceOf(mod.BookRepository);
  });

  it("exports the same singleton across imports", async () => {
    const first = await import("../index");
    const second = await import("../index");

    expect(first.repository).toBe(second.repository);
  });
});

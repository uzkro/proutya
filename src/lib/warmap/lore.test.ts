import { describe, expect, it } from "vitest";
import { blockLoreName } from "./lore";

describe("War Map lore names", () => {
  it("names the first row after the region", () => {
    expect(blockLoreName(0, 0)).toBe("The Doge Den");
    expect(blockLoreName(5, 0)).toBe("Bonk Citadel");
  });
  it("adds a landmark for deeper rows", () => {
    expect(blockLoreName(1, 3)).toBe("Pepe Swamps Trench");
  });
});

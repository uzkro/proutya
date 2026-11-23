import { describe, expect, it } from "vitest";
import { normalizeDiscord, normalizeTelegram, normalizeXHandle } from "./identity";

describe("syndicate identity links", () => {
  it("accepts t.me links and handles", () => {
    expect(normalizeTelegram("t.me/wardog_army")).toBe("https://t.me/wardog_army");
    expect(normalizeTelegram("https://t.me/+AbCdEf123")).toBe("https://t.me/+AbCdEf123");
  });
  it("rejects non-telegram links", () => {
    expect(normalizeTelegram("https://evil.com/wardog")).toBeNull();
  });
  it("empty clears", () => {
    expect(normalizeTelegram("  ")).toBe("");
    expect(normalizeXHandle("")).toBe("");
  });
  it("accepts X urls and @handles", () => {
    expect(normalizeXHandle("@WarDog")).toBe("WarDog");
    expect(normalizeXHandle("https://twitter.com/war_dog")).toBe("war_dog");
    expect(normalizeXHandle("https://x.com/wardog/")).toBe("wardog");
  });
  it("rejects too-long X handles", () => {
    expect(normalizeXHandle("@abcdefghijklmnop")).toBeNull();
  });
});

describe("discord invites", () => {
  it("accepts discord.gg and discord.com/invite", () => {
    expect(normalizeDiscord("discord.gg/wardog")).toBe("https://discord.gg/wardog");
    expect(normalizeDiscord("https://discord.com/invite/AbC-123")).toBe("https://discord.gg/AbC-123");
  });
  it("clears on empty and rejects other hosts", () => {
    expect(normalizeDiscord("  ")).toBe("");
    expect(normalizeDiscord("https://evil.com/discord.gg/x")).toBeNull();
    expect(normalizeDiscord("javascript:alert(1)")).toBeNull();
  });
});

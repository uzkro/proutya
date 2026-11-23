// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { isTapTarget } from "@/lib/audio/tap-feedback";
describe("tap feedback", () => {
  it("fires for enabled buttons, not disabled or opted-out ones", () => {
    document.body.innerHTML = `<button id=a><span id=s>x</span></button><button id=d disabled></button><div data-no-tap-fx><button id=o></button></div><p id=p></p>`;
    expect(isTapTarget(document.getElementById("s"))).toBe(true);
    expect(isTapTarget(document.getElementById("d"))).toBe(false);
    expect(isTapTarget(document.getElementById("o"))).toBe(false);
    expect(isTapTarget(document.getElementById("p"))).toBe(false);
  });
});

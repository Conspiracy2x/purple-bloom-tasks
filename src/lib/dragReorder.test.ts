import { describe, expect, it } from "vitest";
import { getReorderedIdsForDrag, sameOrder } from "./dragReorder";

const bounds = [
  { id: "a", top: 0, height: 100 },
  { id: "b", top: 112, height: 100 },
  { id: "c", top: 224, height: 100 },
  { id: "d", top: 336, height: 100 },
];

describe("drag reorder helpers", () => {
  it("moves the dragged item after the item whose midpoint it crosses", () => {
    expect(getReorderedIdsForDrag(["a", "b", "c", "d"], "a", 280, bounds)).toEqual([
      "b",
      "c",
      "a",
      "d",
    ]);
  });

  it("moves the dragged item to the top when dragged above the first midpoint", () => {
    expect(getReorderedIdsForDrag(["a", "b", "c", "d"], "d", 40, bounds)).toEqual([
      "d",
      "a",
      "b",
      "c",
    ]);
  });

  it("detects unchanged order", () => {
    expect(sameOrder(["a", "b", "c"], ["a", "b", "c"])).toBe(true);
    expect(sameOrder(["a", "b", "c"], ["a", "c", "b"])).toBe(false);
  });
});
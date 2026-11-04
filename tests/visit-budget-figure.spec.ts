import { expect, test } from "@playwright/test";
import { visitBudget } from "../lib/visit-budget-figure";

test("teachable visit-time model counts only legs between stops", () => {
  expect(visitBudget(1, 45, 20, 240)).toEqual({
    visitMinutes: 45, travelMinutes: 0, usedMinutes: 45, remainingMinutes: 195, overMinutes: 0,
  });
  expect(visitBudget(2, 45, 20, 240).usedMinutes).toBe(110);
  expect(visitBudget(3, 45, 20, 240).usedMinutes).toBe(175);
  expect(visitBudget(4, 120, 60, 240).overMinutes).toBe(420);
  expect(() => visitBudget(-1, 45, 20, 240)).toThrow(RangeError);
  expect(() => visitBudget(1, 45, 20, 0)).toThrow(RangeError);
});

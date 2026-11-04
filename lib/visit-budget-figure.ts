/** An illustrative day budget, not live routing or confirmed venue opening data. */
export function visitBudget(
  stops: number,
  minutesPerVisit: number,
  travelPerLeg: number,
  budgetMinutes: number,
) {
  if (![stops, minutesPerVisit, travelPerLeg, budgetMinutes].every(
    (value) => Number.isInteger(value) && value >= 0,
  ) || stops > 20 || budgetMinutes < 1) {
    throw new RangeError("Invalid visit-budget values");
  }
  const visitMinutes = stops * minutesPerVisit;
  const travelMinutes = Math.max(0, stops - 1) * travelPerLeg;
  const usedMinutes = visitMinutes + travelMinutes;
  return {
    visitMinutes,
    travelMinutes,
    usedMinutes,
    remainingMinutes: Math.max(0, budgetMinutes - usedMinutes),
    overMinutes: Math.max(0, usedMinutes - budgetMinutes),
  };
}

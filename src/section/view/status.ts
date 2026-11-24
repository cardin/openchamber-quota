export type BarState = "default" | "warning" | "danger";

export const barState = (
  remainingPercent: number,
  benchmarkPercent: number | null,
  cutoffPercent: number,
): BarState => {
  if (remainingPercent < cutoffPercent) return "danger";
  if (benchmarkPercent !== null && remainingPercent < benchmarkPercent) return "warning";
  return "default";
};

export const stateClass = (state: BarState): string => `state-${state}`;

import { useMemo } from "react";
import { QUARTERS } from "../constants";

export const useRoadmapDimensions = () => {
  // All weeks now have uniform weight of 1
  const { weekWeights, cumulativeFr, totalFr } = useMemo(() => {
    const weights = Array(52).fill(1);
    let sum = 0;
    const cumulative = [0];
    weights.forEach((w) => {
      sum += w;
      cumulative.push(sum);
    });

    return { weekWeights: weights, cumulativeFr: cumulative, totalFr: sum }; // totalFr is now 52
  }, []);

  // Generate Uniform Grid Columns CSS (52 columns)
  const gridTemplateColumns = useMemo(() => {
    return Array(52).fill("1fr").join(" ");
  }, []);

  const allMonths = useMemo(() => QUARTERS.flatMap((q) => q.months), []);

  return {
    weekWeights,
    cumulativeFr,
    totalFr,
    gridTemplateColumns,
    allMonths,
  };
};

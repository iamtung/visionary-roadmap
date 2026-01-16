import React from "react";
import { QUARTERS } from "../../constants";
import { MonthConfig } from "../../types";

interface RoadmapHeaderProps {
  allMonths: MonthConfig[];
}

export const RoadmapHeader: React.FC<RoadmapHeaderProps> = ({ allMonths }) => {
  return (
    <div className="flex border-b border-gray-200 dark:border-slate-800 z-10 bg-white dark:bg-slate-900 sticky top-0 shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors duration-200">
      <div className="w-40 flex-shrink-0 border-r border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 flex items-center justify-center px-2">
        <span className="font-bold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">
          Area
        </span>
      </div>

      <div className="flex-grow overflow-hidden relative">
        <div className="grid grid-cols-[repeat(52,minmax(0,1fr))] border-b border-gray-100 dark:border-slate-800">
          {QUARTERS.map((quarter) => {
            const totalWeeks = quarter.months.reduce(
              (acc, m) => acc + m.weeks,
              0
            );
            return (
              <div
                key={quarter.name}
                className="text-center py-2 text-xs font-bold text-slate-700 dark:text-slate-300 border-r border-gray-100 dark:border-slate-800 uppercase tracking-wider bg-gray-50/50 dark:bg-slate-800/30"
                style={{
                  gridColumn: `span ${totalWeeks} / span ${totalWeeks}`,
                }}
              >
                {quarter.name}
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-[repeat(52,minmax(0,1fr))]">
          {allMonths.map((month, idx) => (
            <div
              key={`${month.name}-${idx}`}
              className="text-center py-1.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 border-r border-gray-100 dark:border-slate-800 uppercase tracking-wide"
              style={{
                gridColumn: `span ${month.weeks} / span ${month.weeks}`,
              }}
            >
              {month.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React from 'react';

interface PriceTrendChartProps {
  data?: number[];
}

export default function PriceTrendChart({ data = [1200, 1250, 1180, 1300, 1280, 1350, 1320, 1400, 1380, 1450] }: PriceTrendChartProps) {
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);

  return (
    <div className="bg-slate-900 rounded-xl p-4">
      <h3 className="font-bold text-white mb-3">اتجاه الأسعار الشهري</h3>
      <div className="bg-slate-800 rounded-lg p-3 h-64">
        <div className="h-full relative">
          {/* Grid lines - visible */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border-t border-slate-600/50"></div>
            ))}
          </div>

          {/* Horizontal grid lines */}
          <div className="absolute inset-0 flex justify-between px-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border-r border-slate-600/50"></div>
            ))}
          </div>

          {/* Line Chart - Visible lines */}
          <div className="h-full flex items-end justify-between px-2">
            {data.map((value, index) => {
              const percentage = ((value - minValue) / (maxValue - minValue)) * 85;

              return (
                <div key={index} className="flex flex-col items-center w-full">
                  <div className="relative w-full flex-1 flex items-end">
                    {/* Connect lines - thicker and visible */}
                    {index < data.length - 1 && (
                      <svg className="absolute top-0 left-1/2 w-full h-full" style={{ transform: 'translateX(-50%)' }}>
                        <line
                          x1="50%"
                          y1={`${100 - percentage}%`}
                          x2="150%"
                          y2={`${100 - ((data[index + 1] - minValue) / (maxValue - minValue)) * 85}%`}
                          stroke="#3b82f6"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                    {/* Data point - larger and visible */}
                    <div
                      className="absolute left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-lg"
                      style={{ bottom: `${percentage}%` }}
                    ></div>
                  </div>
                  {/* Month labels */}
                  <span className="text-xs text-white/60 mt-2">{['ي', 'ف', 'م', 'أ', 'م', 'ي', 'ي', 'أ', 'س', 'أ'][index]}</span>
                </div>
              );
            })}
          </div>

          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-white/60 pr-2">
            <span className="font-bold">{maxValue}</span>
            <span>{Math.round((maxValue + minValue) / 2)}</span>
            <span className="font-bold">{minValue}</span>
          </div>
        </div>
        <p className="text-center text-sm text-white/60 mt-2">ريال/م²</p>
      </div>
    </div>
  );
}

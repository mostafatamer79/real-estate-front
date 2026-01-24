import React from 'react';

interface PropertyType {
  name: string;
  value: number;
  color: string;
}

interface PropertyDistributionChartProps {
  data?: PropertyType[];
}

export default function PropertyDistributionChart({ 
  data = [
    { name: 'سكني', value: 40, color: 'bg-blue-500' },
    { name: 'تجاري', value: 30, color: 'bg-green-500' },
    { name: 'مكاتب', value: 20, color: 'bg-purple-500' },
    { name: 'أخرى', value: 10, color: 'bg-yellow-500' }
  ] 
}: PropertyDistributionChartProps) {
  return (
    <div className="bg-slate-900 rounded-xl p-4">
      <h3 className="font-bold text-white mb-3">توزيع أنواع العقارات</h3>
      <div className="bg-slate-800 rounded-lg p-3 h-64">
        <div className="h-full flex flex-col items-center justify-center">
          {/* Pie Chart */}
          <div className="relative w-40 h-40 mb-4">
            {/* Pie segments - visible */}
            <div className="absolute inset-0 rounded-full border-[20px] border-blue-500"></div>
            <div className="absolute inset-0 rounded-full border-[20px] border-green-500" style={{ clipPath: 'inset(0 50% 0 0)' }}></div>
            <div className="absolute inset-0 rounded-full border-[20px] border-purple-500" style={{ clipPath: 'inset(0 0 50% 50%)' }}></div>
            <div className="absolute inset-0 rounded-full border-[20px] border-yellow-500" style={{ clipPath: 'inset(50% 0 0 50%)' }}></div>

            {/* Center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-slate-800 rounded-full w-20 h-20 flex items-center justify-center shadow-inner">
                <div className="text-white font-bold text-lg">100%</div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
            {data.map((type, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${type.color}`}></div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="text-white text-sm">{type.name}</span>
                    <span className="text-white/70 text-sm">{type.value}%</span>
                  </div>
                  <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full ${type.color}`}
                      style={{ width: `${type.value}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-center text-sm text-white/60 mt-2">مجموع: ٢٣٤ عقار</p>
      </div>
    </div>
  );
}

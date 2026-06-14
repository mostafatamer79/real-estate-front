import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface PropertyType {
  name: string;
  value: number;
  color: string;
}

interface PropertyDistributionChartProps {
  data?: PropertyType[];
}

export default function PropertyDistributionChart({ data }: PropertyDistributionChartProps) {
  const { t, language } = useLanguage();

  const chartData = (data || [])
    .map((d, i) => ({ ...d, value: Number(d.value) || 0, hex: ['#818cf8','#94a3b8','#9ca3af','#475569'][i % 4] }))
    .filter((d) => d.value > 0);

  const totalValue = chartData.reduce((acc, curr) => acc + curr.value, 0);
  if (totalValue <= 0) {
    return (
      <div className="bg-gradient-to-b from-slate-800/60 to-slate-900/40 rounded-3xl p-6 h-full min-h-[340px] font-sans border border-slate-700/40 flex flex-col">
        <div className="flex flex-col mb-6">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {t('chart.property_dist_title')}
          </p>
          <p className="mt-2 text-2xl font-black text-slate-100">
            {language === 'ar' ? 'لا توجد بيانات' : 'No data'}
          </p>
        </div>
        <div className="flex flex-1 items-center justify-center rounded-3xl border border-dashed border-slate-700/60 bg-slate-950/30 px-6 text-center text-sm font-semibold text-slate-500">
          {language === 'ar' ? 'سيتم عرض التوزيع عند إضافة أملاك فعلية.' : 'The distribution will appear when real properties are available.'}
        </div>
      </div>
    );
  }

  const circumference = 2 * Math.PI * 42; // r=42

  // Build segments
  let cumulativePercent = 0;
  const segments = chartData.map((item) => {
    const pct = item.value / totalValue;
    const dashArray = pct * circumference;
    const dashOffset = cumulativePercent * circumference;
    cumulativePercent += pct;
    return { ...item, dashArray, dashOffset };
  });

  return (
    <div className="bg-gradient-to-b from-slate-800/60 to-slate-900/40 rounded-3xl p-6 h-full font-sans border border-slate-700/40">
      {/* Header */}
      <div className="flex flex-col mb-6">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          {t('chart.property_dist_title')}
        </p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-3xl font-black text-slate-100 tracking-tighter">
            {totalValue.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 font-bold">Total Volume MTD</span>
        </div>
      </div>

      <div className="flex flex-col items-center">
        {/* Donut Chart */}
        <div className="relative w-44 h-44 mb-6 group cursor-pointer">
          {/* Glow behind donut */}
          <div className="absolute inset-0 rounded-full bg-indigo-500/5 blur-2xl group-hover:bg-indigo-500/10 transition-all duration-700" />

          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Track ring */}
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke="rgba(51,65,85,0.5)"
              strokeWidth="10"
            />
            {/* Segments */}
            {segments.map((seg, i) => (
              <circle
                key={i}
                cx="50" cy="50" r="42"
                fill="none"
                stroke={seg.hex}
                strokeWidth="10"
                strokeDasharray={`${seg.dashArray} ${circumference}`}
                strokeDashoffset={-seg.dashOffset}
                strokeLinecap="butt"
                className="transition-all duration-700 group-hover:opacity-90"
                style={{ filter: `drop-shadow(0 0 4px ${seg.hex}55)` }}
              />
            ))}
            {/* Gap overlay for spacing between segments */}
          </svg>

          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Total</span>
            <span className="text-2xl font-black text-slate-100 tracking-tighter leading-tight">
              {totalValue.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 w-full max-w-xs px-2">
          {chartData.map((type, index) => {
            const seg = segments[index];
            return (
              <div key={index} className="flex items-center justify-between gap-2 group/leg cursor-default">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full shrink-0 transition-transform duration-200 group-hover/leg:scale-125"
                    style={{ backgroundColor: seg.hex, boxShadow: `0 0 6px ${seg.hex}80` }}
                  />
                  <span className="text-[11px] text-slate-400 font-semibold group-hover/leg:text-slate-200 transition-colors">
                    {type.name}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-bold group-hover/leg:text-slate-300 transition-colors">
                  {type.value.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-slate-600 mt-5">
          {t('chart.total_properties', { count: totalValue })}
        </p>
      </div>
    </div>
  );
}

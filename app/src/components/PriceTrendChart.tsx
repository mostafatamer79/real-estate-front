import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { SaudiRiyalSymbol } from '@/components/ui/saudi-riyal';

interface PriceTrendChartProps {
  data?: number[];
  labels?: string[];
  color?: string;
}

export default function PriceTrendChart({
  data = [],
  labels,
  color = '#818cf8',
}: PriceTrendChartProps) {
  const { t, language } = useLanguage();
  const hasData = data.some((value) => Number(value) > 0);

  if (!hasData) {
    return (
      <div className="bg-gradient-to-b from-slate-800/60 to-slate-900/40 rounded-3xl p-3 sm:p-6 h-full min-h-[340px] font-sans border border-slate-700/40 flex flex-col">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {t('chart.monthly_trend')}
            </p>
            <p className="mt-2 text-xl sm:text-2xl font-black text-slate-100">
              {language === 'ar' ? 'لا توجد بيانات' : 'No data'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold">
            <span className="w-3 h-0.5 rounded bg-indigo-400 inline-block" />
            <SaudiRiyalSymbol iconClassName="h-3 w-3" /> / m²
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center rounded-3xl border border-dashed border-slate-700/60 bg-slate-950/30 px-6 text-center text-sm font-semibold text-slate-500">
          {language === 'ar' ? 'سيتم عرض الرسم عند توفر عمليات مالية فعلية.' : 'The chart will appear when real financial transactions are available.'}
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;

  const toY = (v: number) => 100 - ((v - minValue) / range) * 78;

  const linePath = data
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i / (data.length - 1)) * 100} ${toY(v)}`)
    .join(' ');

  const areaPath = `M 0 ${toY(data[0])} ${data
    .map((v, i) => `L ${(i / (data.length - 1)) * 100} ${toY(v)}`)
    .join(' ')} L 100 100 L 0 100 Z`;

  const latest = data[data.length - 1];
  const previous = data[data.length - 2];
  const pctChange = previous ? (((latest - previous) / previous) * 100).toFixed(1) : '0.0';
  const isUp = latest >= (previous ?? latest);

  return (
    <div className="bg-gradient-to-b from-slate-800/60 to-slate-900/40 rounded-3xl p-3 sm:p-6 h-full font-sans border border-slate-700/40">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {t('chart.monthly_trend')}
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl sm:text-3xl font-black text-slate-100 tracking-tighter">
              {latest?.toLocaleString()}
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              isUp
                ? 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/20'
                : 'text-rose-300   bg-rose-500/10   border border-rose-500/20'
            }`}>
              {isUp ? '+' : ''}{pctChange}%
            </span>
          </div>
          <p className="text-[10px] text-slate-600 font-semibold mt-1">{t('chart.unit_price')}</p>
        </div>

        {/* Mini legend */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold">
          <span className="w-3 h-0.5 rounded bg-indigo-400 inline-block" />
          <SaudiRiyalSymbol iconClassName="h-3 w-3" /> / m²
        </div>
      </div>

      {/* Chart area */}
      <div className="relative h-44">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border-t border-slate-700/30" />
          ))}
        </div>

        {/* SVG chart */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0"    />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Area fill */}
          <path
            d={areaPath}
            fill="url(#areaGrad)"
            className="transition-all duration-700"
          />

          {/* Main line */}
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
            className="drop-shadow-lg transition-all duration-700"
          />

          {/* Data dots */}
          {data.map((v, i) => (
            <circle
              key={i}
              cx={(i / (data.length - 1)) * 100}
              cy={toY(v)}
              r="1.8"
              fill={color}
              stroke="#1e293b"
              strokeWidth="1.2"
              className="opacity-0 hover:opacity-100 transition-opacity"
            />
          ))}
        </svg>

        {/* Y-axis: max/min labels */}
        <div className="absolute top-0 right-0 text-[9px] text-slate-600 font-bold leading-none">
          {maxValue.toLocaleString()}
        </div>
        <div className="absolute bottom-0 right-0 text-[9px] text-slate-600 font-bold leading-none">
          {minValue.toLocaleString()}
        </div>
      </div>

      {/* Month labels */}
      <div className="flex items-center justify-between mt-3 px-1">
        {data.map((_, index) => (
          <span key={index} className="text-[9px] text-slate-600 font-bold uppercase tracking-wide">
            {labels && labels[index] ? labels[index] : t(`chart.months.short.${index + 1}`)}
          </span>
        ))}
      </div>
    </div>
  );
}

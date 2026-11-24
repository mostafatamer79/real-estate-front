import React, { useId, useState } from 'react';
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
  color = 'var(--chart-line)',
}: PriceTrendChartProps) {
  const { t, language } = useLanguage();
  const chartId = useId();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const labelFor = (index: number) => labels?.[index] || t(`chart.months.short.${index + 1}`);
  const hasData = data.some((value) => Number.isFinite(Number(value)) && Number(value) !== 0);

  if (!hasData) {
    return (
      <div data-details-chart-empty className="calm-chart bg-gradient-to-b from-muted/60 dark:from-slate-800/60 to-card/40 dark:to-slate-900/40 rounded-3xl p-3 sm:p-6 h-full min-h-[340px] font-sans border border-border dark:border-slate-700/40 flex flex-col wow-reveal">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground dark:text-slate-500 uppercase tracking-widest">
              {t('chart.monthly_transactions')}
            </p>
            <p className="mt-2 text-xl sm:text-2xl font-black text-foreground dark:text-slate-100">
              {language === 'ar' ? 'لا توجد بيانات' : 'No data'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground dark:text-slate-500 font-semibold">
            <span className="w-3 h-0.5 rounded bg-[var(--chart-line)] inline-block" />
            <SaudiRiyalSymbol iconClassName="h-3 w-3" />
          </div>
        </div>
        <div className="calm-panel flex flex-1 items-center justify-center rounded-3xl border border-dashed border-border dark:border-slate-700/60 bg-background/30 dark:bg-slate-950/30 px-6 text-center text-sm font-semibold text-muted-foreground dark:text-slate-500">
          {language === 'ar' ? 'سيتم عرض الرسم عند توفر عمليات مالية فعلية.' : 'The chart will appear when real financial transactions are available.'}
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;

  const toY = (v: number) => 90 - ((v - minValue) / range) * 76;

  const linePath = data
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i / Math.max(data.length - 1, 1)) * 100} ${toY(v)}`)
    .join(' ');

  const areaPath = `M 0 ${toY(data[0])} ${data
    .map((v, i) => `L ${(i / Math.max(data.length - 1, 1)) * 100} ${toY(v)}`)
    .join(' ')} L 100 100 L 0 100 Z`;

  const latest = data[data.length - 1];
  const previous = data[data.length - 2];
  const pctChange = previous ? (((latest - previous) / previous) * 100).toFixed(1) : '0.0';
  const isUp = latest >= (previous ?? latest);

  return (
    <div className="calm-chart bg-gradient-to-b from-muted/60 dark:from-slate-800/60 to-card/40 dark:to-slate-900/40 rounded-3xl p-3 sm:p-6 h-full font-sans border border-border dark:border-slate-700/40 wow-reveal">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[10px] font-bold text-muted-foreground dark:text-slate-500 uppercase tracking-widest">
            {t('chart.monthly_transactions')}
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl sm:text-3xl font-black text-foreground dark:text-slate-100 tracking-tighter">
              {latest?.toLocaleString()}
            </span>
            <span dir="ltr" className={`text-[11px] font-bold px-2 py-0.5 rounded-full transition-all duration-300 ${
              isUp
                ? 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/20'
                : 'text-rose-300   bg-rose-500/10   border border-rose-500/20'
            }`}>
              {isUp ? '+' : ''}{pctChange}%
            </span>
          </div>
          <p className="flex items-center gap-1 text-[10px] text-slate-600 font-semibold mt-1">{language === 'ar' ? 'آخر شهر' : 'Latest month'}</p>
        </div>

        {/* Mini legend */}
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground dark:text-slate-500 font-semibold">
          <span className="w-3 h-0.5 rounded bg-[var(--chart-line)] inline-block" />
          <SaudiRiyalSymbol iconClassName="h-3 w-3" />
        </div>
      </div>

      <p className="mb-4 text-xs leading-6 text-muted-foreground dark:text-slate-400">{language === 'ar' ? 'إجمالي مبالغ المعاملات حسب المرشحات المحددة، بالريال.' : 'Transaction amounts for the selected filters, in SAR.'}</p>
      {/* Chart area */}
      <div className="relative h-44">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border-t border-border dark:border-slate-700/30" />
          ))}
        </div>

        {/* SVG chart */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          <defs>
            <linearGradient id={`${chartId}-area`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0"    />
            </linearGradient>
            <filter id={`${chartId}-glow`}>
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Area fill */}
          <path
            d={areaPath}
            fill={`url(#${chartId}-area)`}
            className="transition-all duration-700"
          />

          {/* Main line */}
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            filter={`url(#${chartId}-glow)`}
            className="chart-line dark:drop-shadow-lg"
          />

          {/* Data dots */}
          {data.map((v, i) => (
            <circle
              key={i}
              cx={(i / Math.max(data.length - 1, 1)) * 100}
              cy={toY(v)}
              r="1.8"
              fill={color}
              stroke="var(--card)"
              strokeWidth="1.2"
              vectorEffect="non-scaling-stroke"
              className={activeIndex === i || data.length === 1 ? "opacity-100" : "opacity-0"}
            />
          ))}
        </svg>

        <div className="absolute inset-0 flex" dir="ltr">
          {data.map((value, index) => (
            <button
              key={index}
              type="button"
              className="chart-point-trigger flex-1 min-w-0 rounded-none bg-transparent p-0"
              aria-label={`${labelFor(index)}: ${value.toLocaleString()} ${language === 'ar' ? 'ريال' : 'SAR'}`}
              aria-describedby={activeIndex === index ? `${chartId}-tooltip` : undefined}
              onPointerEnter={() => setActiveIndex(index)}
              onPointerLeave={() => setActiveIndex(null)}
              onFocus={() => setActiveIndex(index)}
              onBlur={() => setActiveIndex(null)}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
        {activeIndex !== null && data[activeIndex] !== undefined && (
          <div id={`${chartId}-tooltip`} role="tooltip" className="pointer-events-none absolute top-2 start-2 z-10 rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground shadow-md dark:bg-slate-900 dark:text-slate-100">
            <span>{labelFor(activeIndex)}</span>: <strong>{data[activeIndex].toLocaleString()}</strong>
          </div>
        )}

        {/* Y-axis: max/min labels */}
        <div className="absolute top-0 right-0 text-[9px] text-slate-600 font-bold leading-none">
          {maxValue.toLocaleString()}
        </div>
        <div className="absolute bottom-0 right-0 text-[9px] text-slate-600 font-bold leading-none">
          {minValue.toLocaleString()}
        </div>
      </div>

      {/* Label a maximum of six months so mobile labels remain readable. */}
      <div className="chart-month-labels relative mt-3 h-6" dir="ltr">
        {Array.from(new Set(Array.from({ length: Math.min(6, data.length) }, (_, i) =>
          Math.round(i * (data.length - 1) / Math.max(Math.min(6, data.length) - 1, 1))
        ))).map((index) => (
          <span key={index} className="absolute -translate-x-1/2 whitespace-nowrap text-[10px] text-slate-600 font-medium"
            style={{ left: `${Math.min(94, Math.max(6, index / Math.max(data.length - 1, 1) * 100))}%` }}>
            {labelFor(index)}
          </span>
        ))}
      </div>
    </div>
  );
}

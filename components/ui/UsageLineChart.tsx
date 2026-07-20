"use client";

import { useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Activity, DollarSign, Layers } from "lucide-react";
import { formatMoney, type DisplayCurrency } from "@/lib/currency";

export interface UsageDetailPoint {
  bucket: string; // ISO date
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  amountUsd: number;
  requestCount: number;
}

type Granularity = "day" | "week" | "month" | "all";
type Metric = "cost" | "tokens";

interface UsageLineChartProps {
  granularity: Granularity;
  timeseries: UsageDetailPoint[];
  currency?: DisplayCurrency;
  usdToIdr?: number | null;
}

interface ChartPoint {
  dateKey: string;
  label: string;
  fullLabel: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  amountUsd: number;
  requestCount: number;
}

function startOfWeek(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  const dayIndex = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - dayIndex);
  return copy;
}

export function UsageLineChart({ granularity, timeseries, currency = "USD", usdToIdr = null }: UsageLineChartProps) {
  const cost = (usd: number) => formatMoney(usd, currency, usdToIdr);
  const [metric, setMetric] = useState<Metric>("cost");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chartData: ChartPoint[] = useMemo(() => {
    const keyLength = granularity === "month" || granularity === "all" ? 7 : 10;
    const byKey = new Map(timeseries.map((p) => [p.bucket.slice(0, keyLength), p]));

    const toPoint = (dateKey: string, date: Date, label: string, fullLabel: string): ChartPoint => {
      const point = byKey.get(dateKey);
      return {
        dateKey,
        label,
        fullLabel,
        tokensIn: point?.tokensIn ?? 0,
        tokensOut: point?.tokensOut ?? 0,
        costUsd: point?.costUsd ?? 0,
        amountUsd: point?.amountUsd ?? 0,
        requestCount: point?.requestCount ?? 0,
      };
    };

    if (granularity === "day") {
      const today = new Date();
      const days: ChartPoint[] = [];
      for (let day = 1; day <= today.getDate(); day++) {
        const date = new Date(today.getFullYear(), today.getMonth(), day);
        const dateKey = format(date, "yyyy-MM-dd");
        days.push(toPoint(dateKey, date, String(day), format(date, "d MMMM yyyy", { locale: localeId })));
      }
      return days;
    }

    if (granularity === "week") {
      const weeks: ChartPoint[] = [];
      const currentWeekStart = startOfWeek(new Date());
      for (let i = 11; i >= 0; i--) {
        const date = new Date(currentWeekStart);
        date.setDate(date.getDate() - i * 7);
        const dateKey = format(date, "yyyy-MM-dd");
        weeks.push(toPoint(dateKey, date, format(date, "d MMM", { locale: localeId }), `Minggu ${format(date, "d MMMM yyyy", { locale: localeId })}`));
      }
      return weeks;
    }

    if (granularity === "month") {
      const months: ChartPoint[] = [];
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const dateKey = format(date, "yyyy-MM");
        months.push(toPoint(dateKey, date, format(date, "MMM yy", { locale: localeId }), format(date, "MMMM yyyy", { locale: localeId })));
      }
      return months;
    }

    // "all": plot whatever months actually have data, oldest first.
    return timeseries.map((p) => {
      const date = new Date(p.bucket);
      return toPoint(p.bucket.slice(0, 7), date, format(date, "MMM yy", { locale: localeId }), format(date, "MMMM yyyy", { locale: localeId }));
    });
  }, [granularity, timeseries]);

  const isEmpty = chartData.every((d) => d.costUsd === 0 && d.tokensIn === 0 && d.tokensOut === 0);

  const maxVal = useMemo(() => {
    const max =
      metric === "cost"
        ? Math.max(...chartData.map((d) => d.costUsd), 0)
        : Math.max(...chartData.map((d) => Math.max(d.tokensIn, d.tokensOut)), 0);
    return max > 0 ? max * 1.15 : metric === "cost" ? 0.0001 : 8;
  }, [chartData, metric]);

  const labelStride = Math.max(1, Math.ceil(chartData.length / 10));
  const n = Math.max(chartData.length, 1);
  const chartWidth = Math.max(500, n * 34);
  const barSlot = chartWidth / n;

  const PLOT_TOP = 10;
  const PLOT_BOTTOM = 180;
  const PLOT_HEIGHT = PLOT_BOTTOM - PLOT_TOP;

  const yFor = (val: number) => PLOT_BOTTOM - (val / maxVal) * PLOT_HEIGHT;

  const buildPath = (values: number[]) =>
    values.map((v, i) => `${i === 0 ? "M" : "L"}${barSlot / 2 + i * barSlot},${yFor(v)}`).join(" ");

  const buildAreaPath = (values: number[]) => {
    if (values.length === 0) return "";
    const first = barSlot / 2;
    const last = barSlot / 2 + (values.length - 1) * barSlot;
    return `M${first},${PLOT_BOTTOM} ${buildPath(values).slice(1)} L${last},${PLOT_BOTTOM} Z`;
  };

  const costValues = chartData.map((d) => d.costUsd);
  const tokensInValues = chartData.map((d) => d.tokensIn);
  const tokensOutValues = chartData.map((d) => d.tokensOut);

  const gradientId = useMemo(() => `usage-line-gradient-${Math.random().toString(36).slice(2)}`, []);

  return (
    <div className="card p-6 rounded-2xl flex flex-col space-y-6 transition-all duration-300 hover:border-primary-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center space-x-2 text-ink-soft font-bold text-xs uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4 text-ink-soft" />
            <span>Tren Penggunaan</span>
          </div>
          <h3 className="font-extrabold text-ink text-base sm:text-lg">
            {metric === "cost" ? "Biaya Riil dari Waktu ke Waktu" : "Token In/Out dari Waktu ke Waktu"}
          </h3>
        </div>

        <div className="flex items-center gap-1.5 bg-background p-1 rounded-lg border border-border">
          <button
            onClick={() => setMetric("cost")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              metric === "cost" ? "bg-primary-600 text-white" : "text-ink-soft hover:text-ink"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Biaya
          </button>
          <button
            onClick={() => setMetric("tokens")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              metric === "tokens" ? "bg-primary-600 text-white" : "text-ink-soft hover:text-ink"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Token
          </button>
        </div>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-[220px] text-ink-soft space-y-2">
          <Activity className="w-8 h-8 text-ink-soft" />
          <p className="text-sm font-semibold">Belum ada pemakaian AI pada periode ini</p>
        </div>
      ) : (
        <div className="relative w-full h-[220px] pt-4 select-none">
          <div
            ref={scrollRef}
            onScroll={(e) => setScrollLeft(e.currentTarget.scrollLeft)}
            className="w-full h-full overflow-x-auto overflow-y-hidden"
          >
            <svg viewBox={`0 0 ${chartWidth} 220`} className="h-full overflow-visible" style={{ width: chartWidth, minWidth: "100%" }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary-600)" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="var(--color-primary-600)" stopOpacity="0" />
                </linearGradient>
                <linearGradient id={`${gradientId}-out`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-accent-600)" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="var(--color-accent-600)" stopOpacity="0" />
                </linearGradient>
              </defs>

              {Array.from({ length: 5 }).map((_, i) => {
                const y = 20 + i * 40;
                const gridVal = maxVal - (i * maxVal) / 4;
                return (
                  <g key={i} className="opacity-40">
                    <line x1="35" y1={y} x2={chartWidth - 10} y2={y} stroke="var(--color-border)" strokeWidth="1" strokeDasharray="4 4" />
                    <text x="15" y={y + 4} fill="var(--color-ink-soft)" className="text-[10px] font-bold font-mono" textAnchor="middle">
                      {metric === "cost" ? cost(gridVal) : Math.round(gridVal).toLocaleString("id-ID")}
                    </text>
                  </g>
                );
              })}

              {metric === "cost" ? (
                <>
                  <path d={buildAreaPath(costValues)} fill={`url(#${gradientId})`} />
                  <path d={buildPath(costValues)} fill="none" stroke="var(--color-primary-600)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <path d={buildAreaPath(tokensOutValues)} fill={`url(#${gradientId}-out)`} />
                  <path d={buildAreaPath(tokensInValues)} fill={`url(#${gradientId})`} />
                  <path d={buildPath(tokensOutValues)} fill="none" stroke="var(--color-accent-600)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                  <path d={buildPath(tokensInValues)} fill="none" stroke="var(--color-primary-600)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                </>
              )}

              {chartData.map((d, i) => {
                const xCenter = barSlot / 2 + i * barSlot;
                const isHovered = hoveredIndex === i;
                const showLabel = i % labelStride === 0 || i === chartData.length - 1;
                const primaryVal = metric === "cost" ? d.costUsd : d.tokensIn;
                const secondaryVal = metric === "cost" ? null : d.tokensOut;

                return (
                  <g
                    key={d.dateKey}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <rect
                      x={xCenter - barSlot / 2 + 2}
                      y="10"
                      width={Math.max(barSlot - 4, 0)}
                      height="180"
                      fill={isHovered ? "var(--color-primary-100)" : "transparent"}
                      className="transition-colors duration-200"
                      rx="6"
                    />
                    <circle cx={xCenter} cy={yFor(primaryVal)} r={isHovered ? 4.5 : 3} fill="var(--color-primary-600)" className="transition-all duration-150" />
                    {secondaryVal !== null && (
                      <circle cx={xCenter} cy={yFor(secondaryVal)} r={isHovered ? 4.5 : 3} fill="var(--color-accent-600)" className="transition-all duration-150" />
                    )}
                    {isHovered && (
                      <line x1={xCenter} y1="10" x2={xCenter} y2="180" stroke="var(--color-primary-600)" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
                    )}
                    {showLabel && (
                      <text
                        x={xCenter}
                        y="202"
                        fill={isHovered ? "var(--color-primary-700)" : "var(--color-ink-soft)"}
                        className="text-[10px] font-bold transition-colors duration-200"
                        textAnchor="middle"
                      >
                        {d.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {hoveredIndex !== null && (
            <div
              className="absolute z-10 bg-surface text-ink rounded-xl p-3 shadow-premium border border-border text-xs pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95 duration-100"
              style={{
                left: `${barSlot / 2 + hoveredIndex * barSlot - scrollLeft}px`,
                bottom: "75px",
                transform: "translateX(-50%)",
              }}
            >
              <p className="font-bold border-b border-border pb-1 mb-1.5 text-ink-soft text-center whitespace-nowrap">
                {chartData[hoveredIndex].fullLabel}
              </p>
              <div className="space-y-1">
                <div className="flex justify-between items-center space-x-6">
                  <span className="flex items-center space-x-1.5 text-primary-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-600"></span>
                    <span>{metric === "cost" ? "Biaya Riil" : "Token In"}</span>
                  </span>
                  <span className="font-extrabold text-ink">
                    {metric === "cost" ? cost(chartData[hoveredIndex].costUsd) : chartData[hoveredIndex].tokensIn.toLocaleString("id-ID")}
                  </span>
                </div>
                {metric === "tokens" && (
                  <div className="flex justify-between items-center space-x-6">
                    <span className="flex items-center space-x-1.5 text-accent-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-600"></span>
                      <span>Token Out</span>
                    </span>
                    <span className="font-extrabold text-ink">{chartData[hoveredIndex].tokensOut.toLocaleString("id-ID")}</span>
                  </div>
                )}
                {metric === "cost" && (
                  <div className="flex justify-between items-center space-x-6">
                    <span className="text-ink-soft">Harga ke User</span>
                    <span className="font-extrabold text-ink">{cost(chartData[hoveredIndex].amountUsd)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center space-x-6 pt-1 border-t border-border">
                  <span className="text-ink-soft">Request</span>
                  <span className="font-extrabold text-ink">{chartData[hoveredIndex].requestCount}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

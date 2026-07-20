"use client";

import { useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Activity } from "lucide-react";

export interface UsageTimeseriesPoint {
  bucket: string; // ISO date
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  requestCount: number;
}

interface UsageChartProps {
  scope: "month" | "all";
  timeseries: UsageTimeseriesPoint[];
}

interface ChartPoint {
  dateKey: string;
  label: string;
  fullLabel: string;
  tokensIn: number;
  tokensOut: number;
  requestCount: number;
}

export function UsageChart({ scope, timeseries }: UsageChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chartData: ChartPoint[] = useMemo(() => {
    const byKey = new Map(
      timeseries.map((p) => [
        scope === "month" ? p.bucket.slice(0, 10) : p.bucket.slice(0, 7),
        p,
      ])
    );

    if (scope === "month") {
      // Continuous daily timeline from the 1st of the month through today,
      // so gaps (no usage that day) read as zero rather than being skipped.
      const today = new Date();
      const days: ChartPoint[] = [];
      for (let day = 1; day <= today.getDate(); day++) {
        const date = new Date(today.getFullYear(), today.getMonth(), day);
        const dateKey = format(date, "yyyy-MM-dd");
        const point = byKey.get(dateKey);
        days.push({
          dateKey,
          label: String(day),
          fullLabel: format(date, "d MMMM yyyy", { locale: localeId }),
          tokensIn: point?.tokensIn ?? 0,
          tokensOut: point?.tokensOut ?? 0,
          requestCount: point?.requestCount ?? 0,
        });
      }
      return days;
    }

    // "all" scope: plot whatever months actually have data, oldest first.
    return timeseries.map((p) => {
      const date = new Date(p.bucket);
      return {
        dateKey: p.bucket.slice(0, 7),
        label: format(date, "MMM yy", { locale: localeId }),
        fullLabel: format(date, "MMMM yyyy", { locale: localeId }),
        tokensIn: p.tokensIn,
        tokensOut: p.tokensOut,
        requestCount: p.requestCount,
      };
    });
  }, [scope, timeseries]);

  const isEmpty = chartData.every((d) => d.tokensIn === 0 && d.tokensOut === 0);
  const totalIn = chartData.reduce((sum, d) => sum + d.tokensIn, 0);
  const totalOut = chartData.reduce((sum, d) => sum + d.tokensOut, 0);

  const maxVal = useMemo(() => {
    const max = Math.max(...chartData.map((d) => Math.max(d.tokensIn, d.tokensOut)), 0);
    return max > 0 ? max * 1.15 : 8;
  }, [chartData]);

  // Thin x-axis labels when there are many bars (e.g. a 31-day month) so they
  // don't collide; every bar still gets its own hover tooltip regardless.
  const labelStride = Math.max(1, Math.ceil(chartData.length / 10));

  const n = Math.max(chartData.length, 1);
  const chartWidth = Math.max(500, n * 34);
  const barSlot = chartWidth / n;
  const barWidth = Math.min(14, barSlot * 0.28);
  const gap = Math.min(4, barSlot * 0.08);

  return (
    <div className="card p-6 rounded-2xl flex flex-col space-y-6 transition-all duration-300 hover:border-primary-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center space-x-2 text-ink-soft font-bold text-xs uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4 text-ink-soft" />
            <span>Grafik Penggunaan Token</span>
          </div>
          <h3 className="font-extrabold text-ink text-base sm:text-lg">
            {scope === "month" ? "Tren Harian Bulan Ini" : "Tren Bulanan Sepanjang Waktu"}
          </h3>
        </div>

        <div className="flex items-center space-x-3 text-xs font-semibold">
          <div className="flex items-center space-x-1.5 bg-primary-50 text-primary-700 px-3 py-1 rounded-lg border border-primary-100">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-600"></span>
            <span>Token In ({totalIn.toLocaleString("id-ID")})</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-accent-50 text-accent-700 px-3 py-1 rounded-lg border border-accent-100">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-600"></span>
            <span>Token Out ({totalOut.toLocaleString("id-ID")})</span>
          </div>
        </div>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-[220px] text-ink-soft space-y-2">
          <Activity className="w-8 h-8 text-ink-soft" />
          <p className="text-sm font-semibold">Belum ada pemakaian AI pada periode ini</p>
        </div>
      ) : (
        // Two layers on purpose: the inner div owns horizontal scrolling for
        // wide (e.g. 31-day) charts, and the tooltip lives in the outer,
        // non-scrolling layer. A tooltip absolutely positioned *inside* the
        // scrolling div would count toward its scrollable overflow — since
        // `overflow-x: auto` forces `overflow-y` to compute as `auto` too,
        // and the tooltip can poke past the div's edges near the first/last
        // bar, that made a scrollbar flash in only while hovering.
        <div className="relative w-full h-[220px] pt-4 select-none">
          <div
            ref={scrollRef}
            onScroll={(e) => setScrollLeft(e.currentTarget.scrollLeft)}
            className="w-full h-full overflow-x-auto overflow-y-hidden"
          >
          <svg viewBox={`0 0 ${chartWidth} 220`} className="h-full overflow-visible" style={{ width: chartWidth, minWidth: "100%" }}>
            {Array.from({ length: 5 }).map((_, i) => {
              const y = 20 + i * 40;
              const gridVal = Math.round(maxVal - (i * maxVal) / 4);
              return (
                <g key={i} className="opacity-40">
                  <line x1="35" y1={y} x2={chartWidth - 10} y2={y} stroke="var(--color-border)" strokeWidth="1" strokeDasharray="4 4" />
                  <text x="15" y={y + 4} fill="var(--color-ink-soft)" className="text-[10px] font-bold font-mono" textAnchor="middle">
                    {gridVal}
                  </text>
                </g>
              );
            })}

            {chartData.map((d, i) => {
              const xCenter = barSlot / 2 + i * barSlot;
              const hIn = (d.tokensIn / maxVal) * 160;
              const hOut = (d.tokensOut / maxVal) * 160;
              const yIn = 180 - hIn;
              const yOut = 180 - hOut;
              const isHovered = hoveredIndex === i;
              const showLabel = i % labelStride === 0 || i === chartData.length - 1;

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
                    width={barSlot - 4}
                    height="180"
                    fill={isHovered ? "var(--color-primary-100)" : "transparent"}
                    className="transition-colors duration-200"
                    rx="6"
                  />
                  <rect
                    x={xCenter - barWidth - gap / 2}
                    y={yIn}
                    width={barWidth}
                    height={Math.max(hIn, d.tokensIn > 0 ? 2 : 0)}
                    fill="var(--color-primary-600)"
                    rx="3"
                    className="transition-all duration-300 origin-bottom"
                    style={{ opacity: hoveredIndex !== null && !isHovered ? 0.5 : 1 }}
                  />
                  <rect
                    x={xCenter + gap / 2}
                    y={yOut}
                    width={barWidth}
                    height={Math.max(hOut, d.tokensOut > 0 ? 2 : 0)}
                    fill="var(--color-accent-600)"
                    rx="3"
                    className="transition-all duration-300 origin-bottom"
                    style={{ opacity: hoveredIndex !== null && !isHovered ? 0.5 : 1 }}
                  />
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
                    <span>Token In</span>
                  </span>
                  <span className="font-extrabold text-ink">{chartData[hoveredIndex].tokensIn.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between items-center space-x-6">
                  <span className="flex items-center space-x-1.5 text-accent-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-600"></span>
                    <span>Token Out</span>
                  </span>
                  <span className="font-extrabold text-ink">{chartData[hoveredIndex].tokensOut.toLocaleString("id-ID")}</span>
                </div>
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

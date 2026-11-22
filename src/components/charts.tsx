"use client";

import { useRef, useState } from "react";
import { duration, num, pct } from "@/lib/model";

export type ChartSeries = { name: string; values: number[]; color: string; unit?: "pct" | "sec" };

function formatPoint(item: ChartSeries, value: number) {
  if (item.unit === "pct") return (value * 100).toFixed(1) + "%";
  if (item.unit === "sec") return duration(value);
  return num(value);
}
function tickLabel(value: number, unit?: string) {
  if (unit === "pct") return (value * 100).toFixed(0) + "%";
  if (unit === "sec") return duration(value);
  return num(Math.round(value));
}

export function GroupedChart({
  series,
  label,
  labels,
  whens,
  onPin,
}: {
  series: ChartSeries[];
  label: string;
  labels: string[];
  whens: string[];
  onPin?: (index: number | null) => void;
}) {
  const chart = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ index: number; left: number; top: number } | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const count = series[0]?.values.length ?? 0;
  const max = Math.max(...series.flatMap((item) => item.values), 1);
  const totals = series.map((item) => item.values.reduce((total, value) => total + value, 0) || 1);
  const latest = count > 0 ? count - 1 : null;
  const active = hover?.index ?? pinned ?? latest;
  const focusPinned = pinned != null || (hover == null && latest != null);

  function pin(index: number) {
    const next = pinned === index ? null : index;
    setPinned(next);
    onPin?.(next);
  }

  function place(event: React.MouseEvent<HTMLDivElement> | React.FocusEvent<HTMLDivElement>, index: number) {
    const box = chart.current?.getBoundingClientRect();
    const column = event.currentTarget.getBoundingClientRect();
    if (!box) return;
    let left = column.left - box.left + column.width / 2;
    left = Math.max(88, Math.min(left, box.width - 88));
    setHover({ index, left, top: Math.max(12, column.top - box.top - 8) });
  }

  function lines(index: number) {
    return series.map((item, seriesIndex) => (
      <div key={item.name}>
        <i className="swatch" style={{ background: item.color }} />
        {item.name}
        <b>{formatPoint(item, item.values[index] || 0)}</b>
        {item.unit ? null : <em>{pct((item.values[index] || 0) / totals[seriesIndex])}</em>}
      </div>
    ));
  }

  return (
    <div
      className="hover-chart"
      ref={chart}
      aria-label={label}
      onMouseLeave={() => setHover(null)}
    >
      <div className="plot">
        <div className="yticks">
          {[1, 0.67, 0.33, 0].map((ratio) => (
            <span key={ratio}>{tickLabel(max * ratio, series[0]?.unit)}</span>
          ))}
        </div>
        <div className="bars-hit">
          {Array.from({ length: count }, (_, index) => (
            <div
              key={index}
              className={"hit" + ((pinned === index || hover?.index === index || (pinned == null && hover == null && index === latest)) ? " on" : "")}
              tabIndex={0}
              aria-label={whens[index] || "Point " + (index + 1)}
              onMouseMove={(event) => place(event, index)}
              onFocus={(event) => place(event, index)}
              onClick={() => pin(index)}
            >
              <div className="pair">
                {series.map((item) => (
                  <i
                    key={item.name}
                    style={{ height: Math.max(1, ((item.values[index] || 0) / max) * 100).toFixed(2) + "%", background: item.color }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="axis dense" style={{ marginLeft: 52 }}>
        {labels.map((item, index) => (
          <span key={index}>{item}</span>
        ))}
      </div>
      <div className="legend-row" style={{ justifyContent: "center", marginTop: 10 }}>
        {series.map((item) => (
          <span key={item.name}>
            <i style={{ background: item.color }} />
            {item.name}
          </span>
        ))}
      </div>
      {hover ? (
        <div className="tip" style={{ left: hover.left, top: hover.top }}>
          <strong>{whens[hover.index]}</strong>
          {lines(hover.index)}
        </div>
      ) : null}
      <div className="chart-focus" aria-live="polite">
        {active != null ? (
          <>
            <strong>
              {whens[active]}
              {pinned === active ? " · pinned" : hover?.index === active ? "" : focusPinned && active === latest ? " · latest" : ""}
            </strong>
            <div className="chart-focus-rows">{lines(active)}</div>
          </>
        ) : (
          <span className="quiet">No points in this range.</span>
        )}
      </div>
    </div>
  );
}

export function Donut({
  rows,
  label,
  large,
  active,
  onPick,
  colors,
}: {
  rows: { id?: string; name: string; count: number; detail?: string }[];
  label?: string;
  large?: boolean;
  active?: string;
  onPick?: (name: string) => void;
  colors?: string[];
}) {
  const palette = colors || PIE_COLORS;
  const drawn = rows.filter((row) => row.count > 0);
  const [hover, setHover] = useState<string | null>(null);
  if (!drawn.length) return null;
  const total = drawn.reduce((summed, row) => summed + row.count, 0) || 1;
  const size = large ? 168 : 72;
  const radius = large ? 58 : 24;
  const width = large ? 18 : 10;
  const center = size / 2;
  const circ = 2 * Math.PI * radius;
  let offset = 0;
  const current = drawn.find((row) => (row.id ?? row.name) === hover);
  return (
    <div className="pie-wrap" onMouseLeave={() => setHover(null)}>
      <svg className={"donut" + (large ? " large" : "")} viewBox={"0 0 " + size + " " + size} role="img" aria-label={label}>
        {drawn.length === 1 ? (
          <circle cx={center} cy={center} r={radius} fill="none" stroke={palette[0]} strokeWidth={width} onMouseMove={() => setHover(drawn[0].id ?? drawn[0].name)} />
        ) : (
          drawn.map((row, index) => {
            const len = (row.count / total) * circ;
            const gap = Math.min(2.5, len * 0.06);
            const visible = Math.max(0, len - gap);
            const dash = visible.toFixed(2) + " " + (circ - visible).toFixed(2);
            const node = (
              <circle
                key={row.id ?? row.name}
                className={onPick ? "slice interactive" : "slice"}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={palette[index % palette.length]}
                strokeWidth={active === row.name ? width + 3 : width}
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                transform={"rotate(-90 " + center + " " + center + ")"}
                onMouseMove={() => setHover(row.id ?? row.name)}
                onClick={() => onPick?.(row.name)}
              />
            );
            offset += len;
            return node;
          })
        )}
      </svg>
      {current ? (
        <div className="tip">
          <strong>{current.name}</strong>
          {current.detail ? <div>{current.detail}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

const PIE_COLORS = ["#d4c4ff", "#f0a090", "#9ed9bc", "#e4c48a", "#8f82b8", "#6d6558", "#7eb6d6", "#c4b4a4"];

export function Bars({ rows, mono }: { rows: { name?: string; path?: string; label?: string; count?: number; views?: number }[]; mono?: boolean }) {
  if (!rows.length) return <p className="empty">No rows in this range.</p>;
  const max = Math.max(...rows.map((row) => row.count ?? row.views ?? 0), 1);
  return (
    <div className="bars">
      {rows.map((row) => {
        const count = row.count ?? row.views ?? 0;
        const width = Math.max(3, Math.round((count / max) * 100));
        const label = row.label || row.name || row.path || "";
        return (
          <div key={label} title={label + " · " + num(count)}>
            <div className="bar-meta">
              <span>{mono && row.path ? <code>{row.path}</code> : label}</span>
              <span>{num(count)}</span>
            </div>
            <div className="track">
              <div className="fill" style={{ width: width + "%" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Stack({ parts }: { parts: { label: string; value: number; className: string }[] }) {
  const total = parts.reduce((summed, part) => summed + part.value, 0) || 1;
  return (
    <>
      <div className="stack" aria-hidden="true">
        {parts
          .filter((part) => part.value > 0)
          .map((part) => (
            <span key={part.label} className={part.className} style={{ width: (part.value / total) * 100 + "%" }} />
          ))}
      </div>
      <div className="legend">
        {parts.map((part) => (
          <div key={part.label}>
            <i className={"swatch " + part.className} />
            {part.label} · {pct(part.value / total)}
          </div>
        ))}
      </div>
    </>
  );
}

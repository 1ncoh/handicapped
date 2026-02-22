"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = { date: string; value: number | null };

export function MetricLineChart({
  data,
  color,
  emptyLabel,
}: {
  data: Point[];
  color: string;
  emptyLabel: string;
}) {
  const cleaned = data.filter((d) => d.value != null) as Array<{ date: string; value: number }>;

  if (cleaned.length === 0) {
    return <div className="text-sm text-zinc-500">{emptyLabel}</div>;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={cleaned} margin={{ top: 8, right: 16, left: 14, bottom: 8 }}>
          <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(v) =>
              new Date(`${v}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })
            }
          />
          <YAxis width={44} domain={["auto", "auto"]} />
          <Tooltip
            formatter={(v) => Number(v).toFixed(1)}
            labelFormatter={(label) => new Date(`${label}T00:00:00`).toLocaleDateString()}
          />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

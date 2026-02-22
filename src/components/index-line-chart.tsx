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

type Point = { date: string; index: number | null };

export function IndexLineChart({ data, tiny = false }: { data: Point[]; tiny?: boolean }) {
  const cleaned = data.filter((d) => d.index != null) as Array<{ date: string; index: number }>;

  if (cleaned.length === 0) {
    return <div className="text-sm text-zinc-500">No index data yet.</div>;
  }

  return (
    <div className={tiny ? "h-24 w-full" : "h-64 w-full"}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={cleaned} margin={{ top: 8, right: 8, left: -15, bottom: 8 }}>
          {!tiny && <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" />}
          <XAxis
            dataKey="date"
            tickFormatter={(v) => new Date(`${v}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            hide={tiny}
          />
          <YAxis width={36} hide={tiny} domain={["auto", "auto"]} />
          {!tiny && (
            <Tooltip
              formatter={(v) => Number(v).toFixed(1)}
              labelFormatter={(label) => new Date(`${label}T00:00:00`).toLocaleDateString()}
            />
          )}
          <Line
            type="monotone"
            dataKey="index"
            stroke="#3f6212"
            strokeWidth={2}
            dot={!tiny}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

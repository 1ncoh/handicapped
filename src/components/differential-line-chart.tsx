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

type Point = { date: string; differential: number | null };

export function DifferentialLineChart({ data }: { data: Point[] }) {
  const cleaned = data.filter((d) => d.differential != null) as Array<{ date: string; differential: number }>;

  if (cleaned.length === 0) {
    return <div className="text-sm text-zinc-500">No differential data yet.</div>;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={cleaned} margin={{ top: 8, right: 8, left: -15, bottom: 8 }}>
          <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(v) =>
              new Date(`${v}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })
            }
          />
          <YAxis width={36} domain={["auto", "auto"]} />
          <Tooltip
            formatter={(v) => Number(v).toFixed(1)}
            labelFormatter={(label) => new Date(`${label}T00:00:00`).toLocaleDateString()}
          />
          <Line
            type="monotone"
            dataKey="differential"
            stroke="#1d4ed8"
            strokeWidth={2}
            dot
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

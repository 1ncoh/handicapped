"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = {
  date: string;
  randall: number | null;
  jaden: number | null;
};

function HomeDateTick({
  x,
  y,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
}) {
  if (x == null || y == null || !payload?.value) return null;
  const date = new Date(`${payload.value}T00:00:00`);
  const monthDay = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const year = String(date.getFullYear());

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} textAnchor="middle" fill="#334155" fontSize={11}>
        <tspan x={0} dy={0}>
          {monthDay}
        </tspan>
        <tspan x={0} dy={13} fill="#64748b">
          {year}
        </tspan>
      </text>
    </g>
  );
}

export function HomeComparisonChart({ data }: { data: Point[] }) {
  const hasData = data.some((d) => d.randall != null || d.jaden != null);

  if (!hasData) {
    return <div className="text-sm text-zinc-500">No handicap index history yet.</div>;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 14, bottom: 20 }}>
          <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={<HomeDateTick />} height={44} />
          <YAxis width={44} domain={["auto", "auto"]} />
          <Tooltip
            formatter={(v) => (v == null ? "-" : Number(v).toFixed(1))}
            labelFormatter={(label) => new Date(`${label}T00:00:00`).toLocaleDateString()}
          />
          <Legend />
          <Line type="monotone" dataKey="randall" name="Randall" stroke="#3f6212" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="jaden" name="Jaden" stroke="#1d4ed8" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

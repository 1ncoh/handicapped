export type TimeframeOption = "90d" | "6m" | "1y" | "all" | "custom";

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(base: Date, months: number) {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  return d;
}

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00`);
}

function toDateOnly(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function filterSeriesByTimeframe<T extends { date: string }>(
  data: T[],
  timeframe: TimeframeOption,
  customStart?: string,
  customEnd?: string,
) {
  if (data.length === 0) return data;

  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const maxDate = parseDateOnly(sorted[sorted.length - 1].date);

  let start = "";
  let end = toDateOnly(maxDate);

  if (timeframe === "90d") {
    start = toDateOnly(addDays(maxDate, -90));
  } else if (timeframe === "6m") {
    start = toDateOnly(addMonths(maxDate, -6));
  } else if (timeframe === "1y") {
    start = toDateOnly(addMonths(maxDate, -12));
  } else if (timeframe === "all") {
    start = sorted[0].date;
    end = sorted[sorted.length - 1].date;
  } else if (timeframe === "custom") {
    start = customStart ?? sorted[0].date;
    end = customEnd ?? sorted[sorted.length - 1].date;
  }

  return sorted.filter((row) => {
    if (start && row.date < start) return false;
    if (end && row.date > end) return false;
    return true;
  });
}

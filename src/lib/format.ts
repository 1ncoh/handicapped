export function formatNumber(value: number | null, digits = 1) {
  if (value == null || Number.isNaN(value)) return "N/A";
  return value.toFixed(digits);
}

export function formatPercent(value: number | null) {
  if (value == null || Number.isNaN(value)) return "N/A";
  return `${value.toFixed(1)}%`;
}

export function toDateInput(value: string) {
  return value.slice(0, 10);
}

export function readableDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString();
}

/** Shared CSV parsing utilities */

export function parseCsvRowsFromText(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i]?.trim() ?? "";
    });
    return row;
  });
}

export function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  result.push(current);
  return result;
}

export function parseNumber(value: string | undefined): number {
  if (!value) return 0;
  const cleaned = value.replace(/[₹,\s()]/g, "").replace(/^-$/, "0").trim();
  const negative = value.includes("(") && value.includes(")");
  const n = parseFloat(cleaned);
  if (!Number.isFinite(n)) return 0;
  return negative ? -Math.abs(n) : n;
}

export function pick(row: Record<string, string>, keys: string[]): string | undefined {
  const normalized = Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.toLowerCase().trim().replace(/_/g, " "), v])
  );
  for (const key of keys) {
    const val = normalized[key.toLowerCase().replace(/_/g, " ")];
    if (val !== undefined && val !== "") return val;
  }
  return undefined;
}

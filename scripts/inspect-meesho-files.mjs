import XLSX from "xlsx";
import fs from "fs";

const ordersPath =
  "c:/Users/WIN 11X1/Downloads/Orders_2026-04-01_2026-04-30_2026-05-23_13_24-13_29_4118160 (1).csv";

function parseCsvLine(line) {
  const result = [];
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

const text = fs.readFileSync(ordersPath, "utf8");
const lines = text.split(/\r?\n/).filter(Boolean);
const headers = parseCsvLine(lines[0]);
console.log("Order columns:", headers.length);
headers.forEach((h, i) => console.log(`${i + 1}. ${h}`));

const counts = {};
for (let i = 1; i < lines.length; i++) {
  const row = parseCsvLine(lines[i]);
  const reason = row[0] || "unknown";
  counts[reason] = (counts[reason] || 0) + 1;
}
console.log("\nReason counts:", counts);

// sample rows by type
for (const type of Object.keys(counts)) {
  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    if (row[0] === type) {
      const obj = Object.fromEntries(headers.map((h, idx) => [h, row[idx]]));
      console.log(`\nSample ${type}:`, JSON.stringify(obj, null, 2).slice(0, 800));
      break;
    }
  }
}

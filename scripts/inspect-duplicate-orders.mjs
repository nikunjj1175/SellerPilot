import fs from "fs";

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

const text = fs.readFileSync(
  "c:/Users/WIN 11X1/Downloads/Orders_2026-04-01_2026-04-30_2026-05-23_13_24-13_29_4118160 (1).csv",
  "utf8"
);
const lines = text.split(/\r?\n/).filter(Boolean);
const headers = parseCsvLine(lines[0]);
const subIdx = headers.indexOf("Sub Order No");
const reasonIdx = headers.indexOf("Reason for Credit Entry");

const bySub = new Map();
for (let i = 1; i < lines.length; i++) {
  const row = parseCsvLine(lines[i]);
  const sub = row[subIdx];
  const reason = row[reasonIdx];
  if (!bySub.has(sub)) bySub.set(sub, []);
  bySub.get(sub).push(reason);
}

let multi = 0;
for (const [sub, reasons] of bySub) {
  if (reasons.length > 1) {
    multi++;
    if (multi <= 5) console.log(sub, reasons);
  }
}
console.log("Unique sub orders:", bySub.size);
console.log("Sub orders with multiple rows:", multi);

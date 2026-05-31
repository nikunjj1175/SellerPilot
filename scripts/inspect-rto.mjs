import XLSX from "xlsx";
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

const rtoSubs = new Set();
for (let i = 1; i < lines.length; i++) {
  const row = parseCsvLine(lines[i]);
  if (/RTO/i.test(row[reasonIdx])) rtoSubs.add(row[subIdx]);
}

const retWb = XLSX.readFile("c:/Users/WIN 11X1/Downloads/tcs_sales_return.xlsx");
const returns = XLSX.utils.sheet_to_json(retWb.Sheets[retWb.SheetNames[0]]);
const returnSubs = new Set(returns.map((r) => r.sub_order_num));

let rtoInReturn = 0;
let rtoInSale = 0;
const saleWb = XLSX.readFile("c:/Users/WIN 11X1/Downloads/tcs_sales.xlsx");
const sales = XLSX.utils.sheet_to_json(saleWb.Sheets[saleWb.SheetNames[0]]);
const saleSubs = new Set(sales.map((r) => r.sub_order_num));

for (const s of rtoSubs) {
  if (returnSubs.has(s)) rtoInReturn++;
  if (saleSubs.has(s)) rtoInSale++;
}
console.log("RTO sub orders:", rtoSubs.size);
console.log("RTO also in gst_return:", rtoInReturn);
console.log("RTO also in gst_sale:", rtoInSale);

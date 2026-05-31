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

const ordersPath =
  "c:/Users/WIN 11X1/Downloads/Orders_2026-04-01_2026-04-30_2026-05-23_13_24-13_29_4118160 (1).csv";
const text = fs.readFileSync(ordersPath, "utf8");
const lines = text.split(/\r?\n/).filter(Boolean);
const headers = parseCsvLine(lines[0]);

const orders = new Map();
for (let i = 1; i < lines.length; i++) {
  const row = parseCsvLine(lines[i]);
  const obj = Object.fromEntries(headers.map((h, idx) => [h, row[idx]]));
  orders.set(obj["Sub Order No"], obj);
}

const saleWb = XLSX.readFile("c:/Users/WIN 11X1/Downloads/tcs_sales.xlsx");
const sales = XLSX.utils.sheet_to_json(saleWb.Sheets[saleWb.SheetNames[0]]);

let matched = 0;
let samples = [];
for (const s of sales.slice(0, 5)) {
  const o = orders.get(s.sub_order_num);
  if (o) {
    matched++;
    samples.push({
      sub: s.sub_order_num,
      gstTaxable: s.total_taxable_sale_value,
      gstTax: s.tax_amount,
      gstShip: s.taxable_shipping,
      orderPrice: o["Supplier Discounted Price (Incl GST and Commision)"],
      reason: o["Reason for Credit Entry"],
      orderState: o["Customer State"],
      gstState: s.end_customer_state_new,
    });
  }
}
console.log("Matched samples:", samples);

// How many gst sale match orders
let m = 0;
for (const s of sales) if (orders.has(s.sub_order_num)) m++;
console.log("GST sale matched to orders:", m, "/", sales.length);

// Delivered orders in CSV vs gst sale count
let delivered = [...orders.values()].filter((o) => o["Reason for Credit Entry"] === "DELIVERED").length;
console.log("Delivered in orders:", delivered);
console.log("GST sale rows:", sales.length);

// Compare totals for delivered only
let orderDeliveredTotal = 0;
for (const o of orders.values()) {
  if (o["Reason for Credit Entry"] === "DELIVERED") {
    orderDeliveredTotal += Number(o["Supplier Discounted Price (Incl GST and Commision)"]) || 0;
  }
}
console.log("Sum delivered order prices:", orderDeliveredTotal);

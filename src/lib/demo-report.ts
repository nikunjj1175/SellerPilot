import { parseMeeshoCsv, aggregateBySku } from "@/lib/meesho-parser";
import { generateInsights } from "@/lib/ai-insights";
import { buildMeeshoAnalytics } from "@/lib/meesho-analytics";
import type { ReportDetailData } from "@/lib/report-data";

const DEMO_CSV = `Order ID,SKU,Product Name,Quantity,Sale Amount,Commission,Shipping,Return Amount,RTO Amount,GST,Status,Order Date,State,Pincode
ORD001,SKU-A,Cotton T-Shirt Blue,2,1200,120,80,0,0,54,Delivered,2026-01-05,Maharashtra,400001
ORD002,SKU-B,Women Kurti Set,1,899,90,45,0,0,40,Delivered,2026-01-06,Gujarat,380001
ORD003,SKU-C,Mens Jeans Slim,1,1499,150,60,0,0,67,Delivered,2026-01-07,Karnataka,560001
ORD004,SKU-A,Cotton T-Shirt Blue,1,600,60,40,600,0,27,Return,2026-01-08,Delhi,110001
ORD005,SKU-D,Saree Silk Premium,1,2499,250,100,0,2499,112,RTO,2026-01-09,Uttar Pradesh,226001
ORD006,SKU-E,Kids Dress Pack,2,1800,180,90,0,0,81,Delivered,2026-01-10,Tamil Nadu,600001
ORD007,SKU-B,Women Kurti Set,1,899,90,45,0,0,40,Delivered,2026-01-11,Rajasthan,302001
ORD008,SKU-F,Sports Shoes,1,2199,220,85,0,0,99,Delivered,2026-01-12,Telangana,500001
ORD009,SKU-G,Handbag Leather,1,1299,130,55,1299,0,58,Return,2026-01-13,West Bengal,700001
ORD010,SKU-H,Wall Clock,1,499,50,35,0,0,22,Delivered,2026-01-14,Kerala,682001
ORD011,SKU-A,Cotton T-Shirt Blue,3,1800,180,100,0,0,81,Delivered,2026-01-15,Maharashtra,411001
ORD012,SKU-I,Bluetooth Earbuds,1,999,100,40,0,0,45,Delivered,2026-01-16,Punjab,141001
ORD013,SKU-C,Mens Jeans Slim,1,1499,150,60,0,0,67,Delivered,2026-01-17,Madhya Pradesh,462001
ORD014,SKU-J,Home Bedsheet,2,1600,160,70,0,0,72,Delivered,2026-01-18,Andhra Pradesh,500002
ORD015,SKU-K,Steel Lunch Box,1,399,40,30,399,0,18,Return,2026-01-19,Bihar,800001
ORD016,SKU-L,LED Bulb Pack,3,897,90,45,0,0,40,Delivered,2026-01-20,Haryana,122001
ORD017,SKU-D,Saree Silk Premium,1,2499,250,100,0,0,112,Delivered,2026-01-21,Gujarat,395001
ORD018,SKU-M,Yoga Mat,1,599,60,35,0,599,27,RTO,2026-01-22,Odisha,751001
ORD019,SKU-N,Phone Cover,2,598,60,30,0,0,27,Delivered,2026-01-23,Assam,781001
ORD020,SKU-O,Winter Jacket,1,1899,190,75,0,0,85,Delivered,2026-01-24,Jharkhand,834001
ORD021,SKU-B,Women Kurti Set,2,1798,180,80,0,0,81,Delivered,2026-01-25,Maharashtra,400002
ORD022,SKU-P,Coffee Mug Set,1,449,45,25,0,0,20,Delivered,2026-01-26,Karnataka,570001
ORD023,SKU-Q,Face Cream,1,349,35,25,349,0,16,Return,2026-01-27,Delhi,110002
ORD024,SKU-R,Table Lamp,1,799,80,40,0,0,36,Delivered,2026-01-28,Tamil Nadu,641001
ORD025,SKU-S,Backpack Travel,1,1099,110,50,0,0,49,Delivered,2026-01-29,Uttar Pradesh,201001
ORD026,SKU-T,Kitchen Knife Set,1,699,70,35,0,699,31,RTO,2026-01-30,Rajasthan,313001
ORD027,SKU-U,Sunglasses,1,499,50,30,0,0,22,Delivered,2026-01-31,Goa,403001
ORD028,SKU-V,Protein Shaker,1,299,30,25,0,0,13,Delivered,2026-02-01,Telangana,500003
ORD029,SKU-W,Plant Pot Set,2,998,100,45,0,0,45,Delivered,2026-02-02,West Bengal,700002
ORD030,SKU-X,Smart Watch Band,1,399,40,25,0,0,18,Delivered,2026-02-03,Maharashtra,422001`;

let cached: ReportDetailData | null = null;

export function getDemoReportData(): ReportDetailData {
  if (cached) return cached;

  const { lines, summary } = parseMeeshoCsv(DEMO_CSV);
  const insights = generateInsights(lines, summary);
  const orders = lines.map((l) => ({
    ...l,
    orderStatus: l.isRto ? "RTO" : l.isReturn ? "RETURN" : "DELIVERED",
  }));

  cached = {
    id: "demo",
    name: "Demo — Jan 2026 Meesho P&L",
    createdAt: new Date("2026-02-03").toISOString(),
    summary,
    ordersByState: summary.ordersByState ?? [],
    skuData: aggregateBySku(lines),
    orders,
    analytics: buildMeeshoAnalytics(orders, summary, lines.length),
    insights,
    isDemo: true,
    orderRowCount: lines.length,
  };

  return cached;
}

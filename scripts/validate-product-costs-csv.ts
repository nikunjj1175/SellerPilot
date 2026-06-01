import assert from "node:assert/strict";
import { parseSkuCostCsv, skuRowsToCsv, normalizeSku } from "../src/lib/product-costs";

const weirdSku = "2059,'^.SKU";

const csv = skuRowsToCsv([
  {
    id: "507f1f77bcf86cd799439011",
    sku: weirdSku,
    size: "M",
    productName: "Test",
    productCost: 360,
    packCost: 2,
  },
]);

assert.ok(csv.includes(`"${weirdSku.replace(/"/g, '""')}"`) || csv.includes(weirdSku));

const { rows: parsed } = parseSkuCostCsv(csv);
assert.equal(parsed.length, 1);
assert.equal(normalizeSku(parsed[0].sku), weirdSku);
assert.equal(parsed[0].productCost, 360);

const { rows: quoted } = parseSkuCostCsv(`Cost Row ID,SKU,Size,Product Name,Product Cost (Incl GST),Packaging Cost (Incl GST)
,"2059,'^.SKU",M,Test,100.50,3.00`);
assert.equal(normalizeSku(quoted[0].sku), "2059,'^.SKU");
assert.equal(quoted[0].packCost, 3);

console.log("✓ Special-character SKU CSV OK:", weirdSku);

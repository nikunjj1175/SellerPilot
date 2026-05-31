import * as XLSX from "xlsx";
import { parseCsvRowsFromText } from "@/lib/csv-utils";

/** Read Excel (.xlsx/.xls) or CSV file into normalized row objects */
export async function fileToRows(file: File): Promise<Record<string, string>[]> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".csv") || name.endsWith(".txt")) {
    const text = await file.text();
    return parseCsvRowsFromText(text);
  }

  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const buffer = await file.arrayBuffer();
    return bufferToRows(buffer);
  }

  throw new Error(`Unsupported file type: ${file.name}. Use .xlsx, .xls, or .csv`);
}

export function bufferToRows(buffer: ArrayBuffer): Record<string, string>[] {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });

  return json.map((row) => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      out[String(k).trim()] = v == null ? "" : String(v).trim();
    }
    return out;
  });
}

export function textToRows(text: string, fileName = "data.csv"): Record<string, string>[] {
  if (fileName.toLowerCase().endsWith(".xlsx") || fileName.toLowerCase().endsWith(".xls")) {
    const buffer = Buffer.from(text, "binary");
    return bufferToRows(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
  }
  return parseCsvRowsFromText(text);
}

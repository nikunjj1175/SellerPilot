/** Normalize Indian state names from CSV / pincode lookup */
const STATE_ALIASES: Record<string, string> = {
  maharashtra: "Maharashtra",
  mh: "Maharashtra",
  gujarat: "Gujarat",
  gj: "Gujarat",
  karnataka: "Karnataka",
  ka: "Karnataka",
  "tamil nadu": "Tamil Nadu",
  tn: "Tamil Nadu",
  delhi: "Delhi",
  "new delhi": "Delhi",
  "nct of delhi": "Delhi",
  dl: "Delhi",
  "uttar pradesh": "Uttar Pradesh",
  up: "Uttar Pradesh",
  "west bengal": "West Bengal",
  wb: "West Bengal",
  rajasthan: "Rajasthan",
  rj: "Rajasthan",
  telangana: "Telangana",
  ts: "Telangana",
  kerala: "Kerala",
  kl: "Kerala",
  punjab: "Punjab",
  pb: "Punjab",
  "madhya pradesh": "Madhya Pradesh",
  mp: "Madhya Pradesh",
  "andhra pradesh": "Andhra Pradesh",
  ap: "Andhra Pradesh",
  bihar: "Bihar",
  br: "Bihar",
  haryana: "Haryana",
  hr: "Haryana",
  odisha: "Odisha",
  orissa: "Odisha",
  or: "Odisha",
  jharkhand: "Jharkhand",
  jh: "Jharkhand",
  assam: "Assam",
  as: "Assam",
  chhattisgarh: "Chhattisgarh",
  cg: "Chhattisgarh",
  goa: "Goa",
  ga: "Goa",
  uttarakhand: "Uttarakhand",
  uk: "Uttarakhand",
  "himachal pradesh": "Himachal Pradesh",
  hp: "Himachal Pradesh",
  "jammu and kashmir": "Jammu & Kashmir",
  jk: "Jammu & Kashmir",
};

/** First 2 digits of Indian pincode → state (approximate, covers major ranges) */
const PINCODE_PREFIX_STATE: [number, number, string][] = [
  [11, 11, "Delhi"],
  [12, 13, "Haryana"],
  [14, 16, "Punjab"],
  [17, 17, "Himachal Pradesh"],
  [18, 19, "Jammu & Kashmir"],
  [20, 28, "Uttar Pradesh"],
  [30, 34, "Rajasthan"],
  [36, 39, "Gujarat"],
  [40, 44, "Maharashtra"],
  [45, 48, "Madhya Pradesh"],
  [49, 49, "Chhattisgarh"],
  [50, 53, "Telangana"],
  [56, 59, "Karnataka"],
  [60, 64, "Tamil Nadu"],
  [67, 69, "Kerala"],
  [70, 74, "West Bengal"],
  [75, 77, "Odisha"],
  [78, 79, "Assam"],
  [80, 85, "Bihar"],
  [90, 90, "Jharkhand"],
];

export function normalizeStateName(raw?: string): string | undefined {
  if (!raw?.trim()) return undefined;
  const key = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (STATE_ALIASES[key]) return STATE_ALIASES[key];
  const title = raw
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
  return title;
}

export function stateFromPincode(pincode?: string): string | undefined {
  if (!pincode) return undefined;
  const digits = pincode.replace(/\D/g, "");
  if (digits.length < 2) return undefined;
  const prefix = parseInt(digits.slice(0, 2), 10);
  if (!Number.isFinite(prefix)) return undefined;
  for (const [from, to, state] of PINCODE_PREFIX_STATE) {
    if (prefix >= from && prefix <= to) return state;
  }
  return undefined;
}

export function resolveOrderState(stateRaw?: string, pincodeRaw?: string): string {
  return (
    normalizeStateName(stateRaw) ??
    stateFromPincode(pincodeRaw) ??
    "Unknown"
  );
}

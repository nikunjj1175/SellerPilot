/** Hover regions on 400×450 India viewBox — aligned with centroids */
export type StateRegion = {
  state: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
};

export const INDIA_STATE_REGIONS: StateRegion[] = [
  { state: "Jammu & Kashmir", cx: 155, cy: 95, rx: 28, ry: 22 },
  { state: "Himachal Pradesh", cx: 165, cy: 130, rx: 26, ry: 20 },
  { state: "Punjab", cx: 145, cy: 145, rx: 24, ry: 18 },
  { state: "Haryana", cx: 155, cy: 165, rx: 22, ry: 16 },
  { state: "Delhi", cx: 175, cy: 175, rx: 14, ry: 12 },
  { state: "Uttarakhand", cx: 185, cy: 155, rx: 20, ry: 16 },
  { state: "Rajasthan", cx: 120, cy: 195, rx: 38, ry: 32 },
  { state: "Uttar Pradesh", cx: 195, cy: 210, rx: 32, ry: 28 },
  { state: "Gujarat", cx: 95, cy: 240, rx: 32, ry: 28 },
  { state: "Madhya Pradesh", cx: 165, cy: 255, rx: 34, ry: 30 },
  { state: "Bihar", cx: 235, cy: 220, rx: 26, ry: 22 },
  { state: "Jharkhand", cx: 245, cy: 260, rx: 22, ry: 20 },
  { state: "West Bengal", cx: 255, cy: 250, rx: 24, ry: 26 },
  { state: "Odisha", cx: 235, cy: 290, rx: 26, ry: 24 },
  { state: "Chhattisgarh", cx: 205, cy: 285, rx: 24, ry: 22 },
  { state: "Maharashtra", cx: 155, cy: 285, rx: 30, ry: 28 },
  { state: "Goa", cx: 130, cy: 330, rx: 12, ry: 10 },
  { state: "Telangana", cx: 175, cy: 320, rx: 22, ry: 20 },
  { state: "Andhra Pradesh", cx: 195, cy: 355, rx: 28, ry: 26 },
  { state: "Karnataka", cx: 155, cy: 355, rx: 28, ry: 26 },
  { state: "Tamil Nadu", cx: 175, cy: 410, rx: 26, ry: 28 },
  { state: "Kerala", cx: 145, cy: 420, rx: 22, ry: 18 },
  { state: "Assam", cx: 290, cy: 210, rx: 28, ry: 22 },
];

export const INDIA_OUTLINE_PATH =
  "M 120 80 L 200 70 L 260 95 L 300 130 L 310 180 L 290 230 L 280 280 L 260 330 L 220 380 L 180 420 L 140 430 L 110 400 L 90 350 L 85 300 L 95 250 L 100 200 L 110 150 Z";

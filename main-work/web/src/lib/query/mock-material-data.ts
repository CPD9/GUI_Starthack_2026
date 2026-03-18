export type MaterialObservation = {
  timestamp: string;
  material: "steel" | "aluminum" | "plastic";
  machine: "A" | "B" | "C";
  metrics: Record<string, number>;
};

const seed = [
  ["2025-09-01", "steel", "A", 512, 11.8, 345, 36],
  ["2025-10-01", "steel", "A", 509, 11.5, 340, 35],
  ["2025-11-01", "steel", "B", 505, 11.1, 338, 34],
  ["2025-12-01", "steel", "B", 502, 10.9, 335, 34],
  ["2026-01-01", "steel", "A", 500, 10.6, 332, 33],
  ["2026-02-01", "steel", "B", 496, 10.4, 329, 32],
  ["2025-10-01", "aluminum", "A", 292, 16.1, 201, 21],
  ["2025-12-01", "aluminum", "C", 296, 16.7, 205, 23],
  ["2026-02-01", "aluminum", "C", 301, 17.2, 208, 24],
  ["2025-11-01", "plastic", "A", 72, 27.2, 48, 7],
  ["2026-01-01", "plastic", "B", 70, 26.8, 47, 7],
] as const;

export const mockMaterialData: MaterialObservation[] = seed.map((row) => ({
  timestamp: row[0],
  material: row[1],
  machine: row[2],
  metrics: {
    tensile_strength: row[3],
    elongation_at_break: row[4],
    yield_strength: row[5],
    impact_energy: row[6],
  },
}));

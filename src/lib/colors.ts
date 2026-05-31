import type { CellState, PublicationClass, SignalShort, LevelId } from "../types";

// H-level colors (used by the matrix and FullCorpus drill-downs).
export const levelColor: Record<LevelId, string> = {
  H1: "#5b8a5b",
  H2: "#b89a3a",
  H3: "#3a6b8b",
  H4: "#8b3a3a",
  X:  "#9a9a92",
};

export const levelLabel: Record<LevelId, string> = {
  H1: "Н1",
  H2: "Н2",
  H3: "Н3",
  H4: "Н4",
  X:  "без публично достъпна височина",
};

// Predictive-assessment colors used on the map for the предварителен анализ.
export const signalColor: Record<SignalShort, string> = {
  g: "#5b8a5b",
  b: "#7a9a4e",
  y: "#d4a83a",
  r: "#b8503a",
  k: "#9a9a92",
};

export const signalLabel: Record<SignalShort, string> = {
  g: "Допустимата височина е установена",
  b: "Установена при условие (различна стойност според типа сграда)",
  y: "Изисква потвърждение (записът в плана не е еднозначен)",
  r: "Данни за възможно надвишаване на допустимата височина",
  k: "Без данни в публичните регулационни слоеве",
};

// Phase 2 colors: most parcels reach Н3; the previously-unknown ones move to Н1.
export const phase2Color: Record<SignalShort, string> = {
  g: "#3a6b8b",
  b: "#3a6b8b",
  y: "#3a6b8b",
  r: "#3a6b8b",
  k: "#5b8a5b",
};

export const phase2Label: Record<SignalShort, string> = {
  g: "Н3 — обоснован извод, действащият план е потвърден",
  b: "Н3 — обоснован извод, действащият план е потвърден",
  y: "Н3 — обоснован извод, действащият план е потвърден",
  r: "Н3 — обоснован извод, действащият план е потвърден",
  k: "Н1 — допустимата височина е установена от вашия архив",
};

// Cell symbols + colors in the matrix.
export const cellSymbol: Record<CellState, string> = {
  yes: "✓",
  no: "—",
  partial: "◐",
  muni: "🔓",
};

export const cellColor: Record<CellState, string> = {
  yes: "#5b8a5b",
  no: "#cccccc",
  partial: "#d4a83a",
  muni: "#3a6b8b",
};

export const publicationLabel: Record<PublicationClass, string> = {
  must_publish: "публичен по закон",
  must_publish_act: "актът е публичен (документът — не)",
  paid: "платена услуга",
  partial: "частично публичен",
  restricted: "ограничен достъп",
};

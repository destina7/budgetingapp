// Core data model for the budgeting app.
// Everything lives in one JSON blob (see lib/db.ts) since this is a
// single-user app and the data is small — no need for a relational schema.

export type FixedCost = {
  id: string;
  name: string;
  amount: number; // per month, in EUR
};

export type AllocationRule = {
  id: string;
  label: string; // e.g. "Save & invest", "Spending money"
  percent: number; // 0-100, all rules should sum to 100
  color: string; // hex, for charts
};

export type MonthlyActual = {
  month: string; // "2026-08"
  earned?: number; // what you actually earned this month (optional)
  spent?: number; // what you actually spent this month (optional)
};

export type DuoLogEntry = {
  id: string;
  date: string; // ISO date
  amount: number;
  note?: string;
};

export type ExtraIncomeLogEntry = {
  id: string;
  date: string; // ISO date
  amount: number;
  note?: string;
  splits: { ruleId: string; label: string; amount: number }[];
};

export type Settings = {
  minIncome: number; // guaranteed minimum monthly income
  bufferTarget: number; // target buffer/emergency fund amount
  currentBuffer: number; // current buffer balance (manually updated)
  fixedCosts: FixedCost[];
  allocationRules: AllocationRule[]; // how "extra" income (above minIncome) gets split
  duo: {
    originalDebt: number;
    interestRatePct: number; // annual %, informational only
  };
};

export type AppState = {
  settings: Settings;
  monthlyActuals: MonthlyActual[];
  duoLog: DuoLogEntry[];
  extraIncomeLog: ExtraIncomeLogEntry[];
};

export const DEFAULT_STATE: AppState = {
  settings: {
    minIncome: 1861,
    bufferTarget: 2000,
    currentBuffer: 0,
    fixedCosts: [
      { id: "fc-1", name: "Health insurance", amount: 18 },
      { id: "fc-2", name: "Tuition", amount: 260 },
      { id: "fc-3", name: "Fuel", amount: 80 },
      { id: "fc-4", name: "Road tax", amount: 59 },
      { id: "fc-5", name: "Gym", amount: 25 },
      { id: "fc-6", name: "Subscriptions", amount: 53 },
    ],
    allocationRules: [
      { id: "rule-1", label: "Save & invest", percent: 50, color: "#4f8a6f" },
      { id: "rule-2", label: "DUO extra payment", percent: 20, color: "#c98a3b" },
      { id: "rule-3", label: "Spending money", percent: 30, color: "#5b7fb5" },
    ],
    duo: {
      originalDebt: 8259,
      interestRatePct: 2.33,
    },
  },
  monthlyActuals: [],
  duoLog: [],
  extraIncomeLog: [],
};

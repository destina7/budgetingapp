import { AppState, ExtraIncomeLogEntry } from "./types";

export function fixedCostsTotal(state: AppState): number {
  return state.settings.fixedCosts.reduce((sum, c) => sum + c.amount, 0);
}

export function guaranteedLeftover(state: AppState): number {
  return state.settings.minIncome - fixedCostsTotal(state);
}

export function duoRemaining(state: AppState): number {
  const paid = state.duoLog.reduce((sum, e) => sum + e.amount, 0);
  return Math.max(0, state.settings.duo.originalDebt - paid);
}

export function duoPaidSoFar(state: AppState): number {
  return state.duoLog.reduce((sum, e) => sum + e.amount, 0);
}

export function bufferProgressPct(state: AppState): number {
  const target = state.settings.bufferTarget;
  if (target <= 0) return 0;
  return Math.min(100, Math.round((state.settings.currentBuffer / target) * 100));
}

export function splitExtraIncome(
  state: AppState,
  amount: number
): { ruleId: string; label: string; percent: number; amount: number }[] {
  return state.settings.allocationRules.map((rule) => ({
    ruleId: rule.id,
    label: rule.label,
    percent: rule.percent,
    amount: Math.round(((amount * rule.percent) / 100) * 100) / 100,
  }));
}

export function allocationRulesSum(state: AppState): number {
  return state.settings.allocationRules.reduce((sum, r) => sum + r.percent, 0);
}

export function totalExtraLogged(entries: ExtraIncomeLogEntry[]): number {
  return entries.reduce((sum, e) => sum + e.amount, 0);
}

export function totalExtraByRule(
  entries: ExtraIncomeLogEntry[],
  ruleId: string
): number {
  return entries.reduce((sum, e) => {
    const split = e.splits.find((s) => s.ruleId === ruleId);
    return sum + (split?.amount ?? 0);
  }, 0);
}

export function formatEUR(n: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatEURPrecise(n: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(n);
}

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// Compound growth projection for the investment calculator, modeled after
// investor.gov's compound interest calculator: an initial amount plus a
// monthly contribution, growing at an annual rate compounded at a chosen
// frequency. We derive an effective monthly rate from the nominal annual
// rate + compounding frequency, then step forward month by month so the
// chart can show a smooth year-by-year curve.
export function compoundProjection(params: {
  initial: number;
  monthlyContribution: number;
  years: number;
  annualRatePct: number;
  compoundsPerYear: number; // 1=annually, 2=semiannually, 4=quarterly, 12=monthly, 365=daily
}): { year: number; totalValue: number; totalContributions: number }[] {
  const { initial, monthlyContribution, years, annualRatePct, compoundsPerYear } = params;
  const nominal = annualRatePct / 100;
  const effectiveAnnual = Math.pow(1 + nominal / compoundsPerYear, compoundsPerYear) - 1;
  const monthlyRate = Math.pow(1 + effectiveAnnual, 1 / 12) - 1;

  const results: { year: number; totalValue: number; totalContributions: number }[] = [];
  let value = initial;
  let contributions = initial;
  results.push({ year: 0, totalValue: Math.round(value), totalContributions: Math.round(contributions) });

  for (let year = 1; year <= years; year++) {
    for (let m = 0; m < 12; m++) {
      value = value * (1 + monthlyRate) + monthlyContribution;
      contributions += monthlyContribution;
    }
    results.push({
      year,
      totalValue: Math.round(value),
      totalContributions: Math.round(contributions),
    });
  }
  return results;
}

// Future value of a fixed monthly contribution (no starting balance),
// compounded monthly at the given nominal annual rate. Used to compare
// "invest this extra money" against "put it toward DUO" scenarios.
export function futureValueOfMonthlyContributions(
  monthlyContribution: number,
  months: number,
  annualRatePct: number
): number {
  const monthlyRate = annualRatePct / 100 / 12;
  if (monthlyRate === 0) return monthlyContribution * months;
  const fv = monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  return Math.round(fv);
}

// How many months until the buffer reaches its target, given a fixed
// monthly contribution. Returns null if it will never get there.
export function monthsToBufferTarget(
  state: AppState,
  monthlyContribution: number
): number | null {
  const gap = state.settings.bufferTarget - state.settings.currentBuffer;
  if (gap <= 0) return 0;
  if (monthlyContribution <= 0) return null;
  return Math.ceil(gap / monthlyContribution);
}

// Project buffer + DUO balance forward N months under a given scenario.
export function projectScenario(
  state: AppState,
  months: number,
  opts: {
    extraMonthlyIncome: number; // assumed avg "extra" income per month above minimum
    saveInvestPct: number; // % of extra that goes to buffer/invest
    duoExtraPct: number; // % of extra that goes to DUO paydown
  }
): { month: number; buffer: number; duoRemaining: number }[] {
  const results: { month: number; buffer: number; duoRemaining: number }[] = [];
  let buffer = state.settings.currentBuffer;
  let duo = duoRemaining(state);
  for (let m = 1; m <= months; m++) {
    const toBuffer = (opts.extraMonthlyIncome * opts.saveInvestPct) / 100;
    const toDuo = (opts.extraMonthlyIncome * opts.duoExtraPct) / 100;
    buffer += toBuffer;
    duo = Math.max(0, duo - toDuo);
    results.push({ month: m, buffer: Math.round(buffer), duoRemaining: Math.round(duo) });
  }
  return results;
}

"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { compoundProjection, formatEUR } from "@/lib/calc";
import { Card, SectionTitle, Field, inputClass, Button } from "@/components/ui";

const FREQUENCIES = [
  { label: "Annually", value: 1 },
  { label: "Semiannually", value: 2 },
  { label: "Quarterly", value: 4 },
  { label: "Monthly", value: 12 },
  { label: "Daily", value: 365 },
];

export default function InvestPage() {
  const [initial, setInitial] = useState("1000");
  const [monthly, setMonthly] = useState("100");
  const [years, setYears] = useState("10");
  const [rate, setRate] = useState("7");
  const [freq, setFreq] = useState(12);
  const [showTable, setShowTable] = useState(false);

  const initialNum = parseFloat(initial) || 0;
  const monthlyNum = parseFloat(monthly) || 0;
  const yearsNum = Math.max(1, Math.min(60, parseInt(years) || 1));
  const rateNum = parseFloat(rate) || 0;

  const projection = useMemo(
    () =>
      compoundProjection({
        initial: initialNum,
        monthlyContribution: monthlyNum,
        years: yearsNum,
        annualRatePct: rateNum,
        compoundsPerYear: freq,
      }),
    [initialNum, monthlyNum, yearsNum, rateNum, freq]
  );

  const final = projection[projection.length - 1];
  const totalGrowth = final ? final.totalValue - final.totalContributions : 0;

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-sm text-muted">Compound interest calculator</p>
        <h1 className="text-2xl font-semibold">Invest</h1>
      </header>

      <Card>
        <SectionTitle>Your numbers</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Initial investment (€)">
            <input
              type="number"
              inputMode="decimal"
              className={inputClass}
              value={initial}
              onChange={(e) => setInitial(e.target.value)}
            />
          </Field>
          <Field label="Monthly contribution (€)">
            <input
              type="number"
              inputMode="decimal"
              className={inputClass}
              value={monthly}
              onChange={(e) => setMonthly(e.target.value)}
            />
          </Field>
          <Field label="Length of time (years)">
            <input
              type="number"
              inputMode="numeric"
              className={inputClass}
              value={years}
              onChange={(e) => setYears(e.target.value)}
            />
          </Field>
          <Field label="Estimated annual return (%)">
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              className={inputClass}
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Compound frequency">
            <select
              className={inputClass}
              value={freq}
              onChange={(e) => setFreq(Number(e.target.value))}
            >
              {FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Card>

      {final && (
        <Card>
          <SectionTitle>Result</SectionTitle>
          <p className="text-sm text-muted">
            In {yearsNum} year{yearsNum === 1 ? "" : "s"}, you&apos;ll have
          </p>
          <p className="mt-1 text-3xl font-semibold text-accent-green">
            {formatEUR(final.totalValue)}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xs text-muted">Total contributed</p>
              <p className="mt-1 font-medium">{formatEUR(final.totalContributions)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Growth from interest</p>
              <p className="mt-1 font-medium text-accent-blue">{formatEUR(totalGrowth)}</p>
            </div>
          </div>

          <div className="mt-5 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={projection} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="year"
                  tickFormatter={(y) => `Y${y}`}
                  stroke="var(--muted)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} width={48} />
                <Tooltip
                  formatter={(value, name) => [
                    formatEUR(Number(value)),
                    name === "totalValue" ? "Total value" : "Total contributions",
                  ]}
                  labelFormatter={(y) => `Year ${y}`}
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line type="monotone" dataKey="totalValue" stroke="var(--accent-green)" strokeWidth={2} dot={false} />
                <Line
                  type="monotone"
                  dataKey="totalContributions"
                  stroke="var(--accent-blue)"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <Button variant="secondary" onClick={() => setShowTable((s) => !s)} className="mt-3 w-full">
            {showTable ? "Hide" : "Show"} year-by-year table
          </Button>

          {showTable && (
            <div className="mt-3 max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted">
                    <th className="py-1.5 font-medium">Year</th>
                    <th className="py-1.5 text-right font-medium">Total value</th>
                    <th className="py-1.5 text-right font-medium">Contributed</th>
                  </tr>
                </thead>
                <tbody>
                  {projection.map((row) => (
                    <tr key={row.year} className="border-b border-border last:border-0">
                      <td className="py-1.5">{row.year}</td>
                      <td className="py-1.5 text-right font-medium">{formatEUR(row.totalValue)}</td>
                      <td className="py-1.5 text-right text-muted">{formatEUR(row.totalContributions)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

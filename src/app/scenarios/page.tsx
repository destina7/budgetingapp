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
import { useAppState } from "@/lib/useAppState";
import {
  projectScenario,
  duoRemaining,
  formatEUR,
  monthsToBufferTarget,
  futureValueOfMonthlyContributions,
} from "@/lib/calc";
import { Card, SectionTitle, Field, inputClass } from "@/components/ui";

export default function ScenariosPage() {
  const { state, loading } = useAppState();
  const [extraMonthly, setExtraMonthly] = useState(200);
  const [saveInvestPct, setSaveInvestPct] = useState(50);
  const [duoExtraPct, setDuoExtraPct] = useState(20);
  const [months, setMonths] = useState(24);
  const [investReturnPct, setInvestReturnPct] = useState(6);

  const projection = useMemo(() => {
    if (!state) return [];
    return projectScenario(state, months, {
      extraMonthlyIncome: extraMonthly,
      saveInvestPct,
      duoExtraPct,
    });
  }, [state, months, extraMonthly, saveInvestPct, duoExtraPct]);

  if (loading) return <CenteredNote>Loading…</CenteredNote>;
  if (!state) return <CenteredNote>Something went wrong loading your data.</CenteredNote>;

  const spendPct = Math.max(0, 100 - saveInvestPct - duoExtraPct);
  const final = projection[projection.length - 1];
  const currentDuo = duoRemaining(state);

  const monthlyToBuffer = (extraMonthly * saveInvestPct) / 100;
  const bufferMonths = monthsToBufferTarget(state, monthlyToBuffer);

  const monthlyToDuo = (extraMonthly * duoExtraPct) / 100;
  const duoPaidNominal = Math.round(monthlyToDuo * months);
  const investedInstead = futureValueOfMonthlyContributions(monthlyToDuo, months, investReturnPct);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-sm text-muted">Play with the numbers — nothing here is saved</p>
        <h1 className="text-2xl font-semibold">What-if</h1>
      </header>

      <Card>
        <SectionTitle hint="Assume you consistently earn this much above your minimum">
          Assumed extra income / month
        </SectionTitle>
        <Slider
          value={extraMonthly}
          onChange={setExtraMonthly}
          min={0}
          max={1000}
          step={10}
          display={formatEUR(extraMonthly)}
        />
      </Card>

      <Card>
        <SectionTitle hint="Adjust how that extra income would be split">
          Split
        </SectionTitle>
        <div className="space-y-4">
          <Slider
            label="Save & invest"
            value={saveInvestPct}
            onChange={(v) => setSaveInvestPct(Math.min(v, 100 - duoExtraPct))}
            min={0}
            max={100}
            step={5}
            display={`${saveInvestPct}%`}
            color="var(--accent-green)"
          />
          <Slider
            label="Extra DUO payment"
            value={duoExtraPct}
            onChange={(v) => setDuoExtraPct(Math.min(v, 100 - saveInvestPct))}
            min={0}
            max={100}
            step={5}
            display={`${duoExtraPct}%`}
            color="var(--accent-amber)"
          />
          <div className="flex justify-between text-sm text-muted">
            <span>Spending money</span>
            <span>{spendPct}%</span>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle hint={`Projected over ${months} months`}>Time horizon</SectionTitle>
        <Slider value={months} onChange={setMonths} min={3} max={60} step={3} display={`${months} months`} />
      </Card>

      {final && (
        <Card>
          <SectionTitle>Projected result</SectionTitle>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xs text-muted">Buffer in {months} months</p>
              <p className="mt-1 text-xl font-semibold text-accent-green">{formatEUR(final.buffer)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">DUO remaining</p>
              <p className="mt-1 text-xl font-semibold text-accent-amber">{formatEUR(final.duoRemaining)}</p>
            </div>
          </div>
          <div className="mt-5 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={projection} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tickFormatter={(m) => `${m}mo`}
                  stroke="var(--muted)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} width={48} />
                <Tooltip
                  formatter={(value, name) => [
                    formatEUR(Number(value)),
                    name === "buffer" ? "Buffer" : "DUO remaining",
                  ]}
                  labelFormatter={(m) => `Month ${m}`}
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="buffer"
                  stroke="var(--accent-green)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="duoRemaining"
                  stroke="var(--accent-amber)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-center text-xs text-muted">
            Starting point: {formatEUR(state.settings.currentBuffer)} buffer, {formatEUR(currentDuo)} DUO remaining
          </p>
        </Card>
      )}

      <Card>
        <SectionTitle hint="Based on your buffer split above">When will I hit my buffer target?</SectionTitle>
        {bufferMonths === null ? (
          <p className="text-sm text-muted">
            At 0% going to buffer, it&apos;ll never grow on its own — bump the &quot;Save &amp;
            invest&quot; slider above.
          </p>
        ) : bufferMonths === 0 ? (
          <p className="text-sm text-accent-green">You&apos;re already at your buffer target.</p>
        ) : (
          <p className="text-sm">
            About <span className="font-semibold">{bufferMonths} months</span> from now, putting{" "}
            {formatEUR(monthlyToBuffer)}/month toward it.
          </p>
        )}
      </Card>

      <Card>
        <SectionTitle hint="Since DUO's interest rate is low, is paying it faster actually the best move?">
          Invest it instead of extra DUO payments?
        </SectionTitle>
        <Field label="Assumed investment return (% / yr)">
          <input
            type="number"
            inputMode="decimal"
            step="0.5"
            className={inputClass}
            value={investReturnPct}
            onChange={(e) => setInvestReturnPct(Number(e.target.value) || 0)}
          />
        </Field>
        <div className="mt-4 grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-xs text-muted">Extra DUO payments</p>
            <p className="mt-1 text-lg font-semibold text-accent-amber">{formatEUR(duoPaidNominal)}</p>
            <p className="mt-0.5 text-xs text-muted">debt reduced, {state.settings.duo.interestRatePct}%/yr avoided</p>
          </div>
          <div>
            <p className="text-xs text-muted">Same money invested</p>
            <p className="mt-1 text-lg font-semibold text-accent-green">{formatEUR(investedInstead)}</p>
            <p className="mt-0.5 text-xs text-muted">at {investReturnPct}%/yr over {months} months</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">
          Based on {formatEUR(monthlyToDuo)}/month (the &quot;DUO extra payment&quot; slice above) over{" "}
          {months} months. This is a simple comparison, not financial advice — investment returns
          aren&apos;t guaranteed the way debt reduction is.
        </p>
      </Card>
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  display,
  color = "var(--accent-green)",
}: {
  label?: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  display: string;
  color?: string;
}) {
  return (
    <div>
      {label && (
        <div className="mb-1 flex justify-between text-sm">
          <span>{label}</span>
        </div>
      )}
      <div className="mb-1.5 flex items-center justify-between">
        {!label && <span />}
        <span className="text-lg font-semibold">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[--accent-green]"
        style={{ accentColor: color }}
      />
    </div>
  );
}

function CenteredNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted">
      {children}
    </div>
  );
}

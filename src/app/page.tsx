"use client";

import { useMemo, useState } from "react";
import { useAppState } from "@/lib/useAppState";
import {
  fixedCostsTotal,
  guaranteedLeftover,
  duoRemaining,
  bufferProgressPct,
  splitExtraIncome,
  formatEUR,
  formatEURPrecise,
  uid,
} from "@/lib/calc";
import { Card, SectionTitle, ProgressBar, Field, inputClass, Button } from "@/components/ui";

export default function DashboardPage() {
  const { state, loading, error, update } = useAppState();
  const [extraAmount, setExtraAmount] = useState("");
  const [logged, setLogged] = useState(false);

  const extraNum = parseFloat(extraAmount);
  const validExtra = !isNaN(extraNum) && extraNum > 0;

  const splits = useMemo(() => {
    if (!state || !validExtra) return [];
    return splitExtraIncome(state, extraNum);
  }, [state, extraNum, validExtra]);

  if (loading) return <CenteredNote>Loading…</CenteredNote>;
  if (!state) return <CenteredNote>Something went wrong loading your data.</CenteredNote>;

  const fixed = fixedCostsTotal(state);
  const leftover = guaranteedLeftover(state);
  const duo = duoRemaining(state);
  const bufferPct = bufferProgressPct(state);

  function logExtra() {
    if (!validExtra) return;
    update((prev) => ({
      ...prev,
      extraIncomeLog: [
        {
          id: uid("extra"),
          date: new Date().toISOString(),
          amount: extraNum,
          splits: splits.map((s) => ({ ruleId: s.ruleId, label: s.label, amount: s.amount })),
        },
        ...prev.extraIncomeLog,
      ],
    }));
    setLogged(true);
    setExtraAmount("");
    setTimeout(() => setLogged(false), 2000);
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-sm text-muted">Where you stand right now</p>
        <h1 className="text-2xl font-semibold">Today</h1>
      </header>

      {error && (
        <Card className="border-accent-amber/40 bg-accent-amber/5 text-sm text-accent-amber">
          Couldn&apos;t reach the database ({error}). If you just deployed this, make sure a
          Postgres database is attached in your Vercel project settings.
        </Card>
      )}

      <Card>
        <SectionTitle hint="What you can always count on, before anything extra">
          Guaranteed monthly plan
        </SectionTitle>
        <div className="space-y-2 text-sm">
          <Row label="Minimum income" value={formatEUR(state.settings.minIncome)} />
          <Row label="Fixed costs" value={`− ${formatEUR(fixed)}`} muted />
          <div className="my-2 border-t border-border" />
          <Row
            label="Breathing room"
            value={formatEUR(leftover)}
            strong
            valueColor={leftover >= 0 ? "var(--accent-green)" : "var(--accent-red)"}
          />
        </div>
      </Card>

      <Card>
        <SectionTitle hint={`Target: ${formatEUR(state.settings.bufferTarget)}`}>
          Buffer
        </SectionTitle>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-2xl font-semibold">{formatEUR(state.settings.currentBuffer)}</span>
          <span className="text-sm text-muted">{bufferPct}%</span>
        </div>
        <ProgressBar pct={bufferPct} color="var(--accent-green)" />
      </Card>

      <Card>
        <SectionTitle hint="Tracked manually — no fixed payoff plan since the rate is low">
          DUO debt
        </SectionTitle>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-semibold">{formatEUR(duo)}</span>
          <span className="text-sm text-muted">remaining</span>
        </div>
      </Card>

      <Card>
        <SectionTitle hint="Got paid extra this month? See how it splits.">
          Extra income calculator
        </SectionTitle>
        <Field label="Extra amount received">
          <input
            type="number"
            inputMode="decimal"
            className={inputClass}
            placeholder="0"
            value={extraAmount}
            onChange={(e) => setExtraAmount(e.target.value)}
          />
        </Field>
        {validExtra && (
          <div className="mt-4 space-y-2.5">
            {splits.map((s) => (
              <div key={s.ruleId} className="flex items-center justify-between text-sm">
                <span className="text-muted">
                  {s.label} <span className="text-xs">({s.percent}%)</span>
                </span>
                <span className="font-medium">{formatEURPrecise(s.amount)}</span>
              </div>
            ))}
            <div className="pt-2">
              <Button onClick={logExtra} className="w-full">
                {logged ? "Logged ✓" : "Log this to history"}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {state.extraIncomeLog.length > 0 && (
        <Card>
          <SectionTitle>Recent extra income</SectionTitle>
          <div className="space-y-2 text-sm">
            {state.extraIncomeLog.slice(0, 5).map((e) => (
              <div key={e.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
                <span className="text-muted">
                  {new Date(e.date).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                </span>
                <span className="font-medium">{formatEURPrecise(e.amount)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  strong,
  valueColor,
}: {
  label: string;
  value: string;
  muted?: boolean;
  strong?: boolean;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-muted" : ""}>{label}</span>
      <span
        className={strong ? "text-lg font-semibold" : muted ? "text-muted" : "font-medium"}
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </span>
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

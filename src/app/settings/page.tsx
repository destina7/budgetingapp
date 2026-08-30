"use client";

import { useAppState } from "@/lib/useAppState";
import { allocationRulesSum, formatEUR, uid } from "@/lib/calc";
import { Card, SectionTitle, Field, inputClass, Button } from "@/components/ui";
import { FixedCost, AllocationRule } from "@/lib/types";

const RULE_COLORS = ["#4f8a6f", "#c98a3b", "#5b7fb5", "#c25b4f", "#9b6bc9", "#4fa3a3"];

export default function SettingsPage() {
  const { state, loading, saving, update } = useAppState();

  if (loading) return <CenteredNote>Loading…</CenteredNote>;
  if (!state) return <CenteredNote>Something went wrong loading your data.</CenteredNote>;

  const current = state; // narrowed, non-null copy for use inside closures below
  const rulesSum = allocationRulesSum(current);

  function setSettings(patch: Partial<typeof current.settings>) {
    update((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  }

  function addFixedCost() {
    const newCost: FixedCost = { id: uid("fc"), name: "New cost", amount: 0 };
    setSettings({ fixedCosts: [...current.settings.fixedCosts, newCost] });
  }

  function updateFixedCost(id: string, patch: Partial<FixedCost>) {
    setSettings({
      fixedCosts: current.settings.fixedCosts.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  }

  function removeFixedCost(id: string) {
    setSettings({ fixedCosts: current.settings.fixedCosts.filter((c) => c.id !== id) });
  }

  function addRule() {
    const color = RULE_COLORS[current.settings.allocationRules.length % RULE_COLORS.length];
    const newRule: AllocationRule = { id: uid("rule"), label: "New rule", percent: 0, color };
    setSettings({ allocationRules: [...current.settings.allocationRules, newRule] });
  }

  function updateRule(id: string, patch: Partial<AllocationRule>) {
    setSettings({
      allocationRules: current.settings.allocationRules.map((r) =>
        r.id === id ? { ...r, ...patch } : r
      ),
    });
  }

  function removeRule(id: string) {
    setSettings({ allocationRules: current.settings.allocationRules.filter((r) => r.id !== id) });
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">Your rules, edited once</p>
          <h1 className="text-2xl font-semibold">Settings</h1>
        </div>
        {saving && <span className="text-xs text-muted">Saving…</span>}
      </header>

      <Card>
        <SectionTitle>Income & buffer</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Minimum monthly income (€)">
            <input
              type="number"
              inputMode="decimal"
              className={inputClass}
              value={state.settings.minIncome}
              onChange={(e) => setSettings({ minIncome: Number(e.target.value) })}
            />
          </Field>
          <Field label="Buffer target (€)">
            <input
              type="number"
              inputMode="decimal"
              className={inputClass}
              value={state.settings.bufferTarget}
              onChange={(e) => setSettings({ bufferTarget: Number(e.target.value) })}
            />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Current buffer balance (€) — update this whenever it changes">
            <input
              type="number"
              inputMode="decimal"
              className={inputClass}
              value={state.settings.currentBuffer}
              onChange={(e) => setSettings({ currentBuffer: Number(e.target.value) })}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <SectionTitle hint="Recurring costs, auto-subtracted from your minimum income">
          Fixed costs
        </SectionTitle>
        <div className="space-y-2">
          {state.settings.fixedCosts.map((cost) => (
            <div key={cost.id} className="flex items-center gap-2">
              <input
                type="text"
                className={`${inputClass} flex-1`}
                value={cost.name}
                onChange={(e) => updateFixedCost(cost.id, { name: e.target.value })}
              />
              <input
                type="number"
                inputMode="decimal"
                className={`${inputClass} w-24`}
                value={cost.amount}
                onChange={(e) => updateFixedCost(cost.id, { amount: Number(e.target.value) })}
              />
              <button
                onClick={() => removeFixedCost(cost.id)}
                className="px-2 text-muted hover:text-accent-red"
                aria-label="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <Button variant="secondary" onClick={addFixedCost} className="mt-3 w-full">
          + Add fixed cost
        </Button>
        <div className="mt-3 flex justify-between text-sm text-muted">
          <span>Total</span>
          <span className="font-medium text-foreground">
            {formatEUR(state.settings.fixedCosts.reduce((s, c) => s + c.amount, 0))}
          </span>
        </div>
      </Card>

      <Card>
        <SectionTitle hint="How money earned above your minimum income gets split">
          Extra income allocation rules
        </SectionTitle>
        <div className="space-y-2">
          {state.settings.allocationRules.map((rule) => (
            <div key={rule.id} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: rule.color }}
              />
              <input
                type="text"
                className={`${inputClass} flex-1`}
                value={rule.label}
                onChange={(e) => updateRule(rule.id, { label: e.target.value })}
              />
              <input
                type="number"
                inputMode="decimal"
                className={`${inputClass} w-20`}
                value={rule.percent}
                onChange={(e) => updateRule(rule.id, { percent: Number(e.target.value) })}
              />
              <span className="text-sm text-muted">%</span>
              <button
                onClick={() => removeRule(rule.id)}
                className="px-2 text-muted hover:text-accent-red"
                aria-label="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <Button variant="secondary" onClick={addRule} className="mt-3 w-full">
          + Add rule
        </Button>
        <div
          className={`mt-3 flex justify-between text-sm ${
            rulesSum === 100 ? "text-muted" : "font-medium text-accent-amber"
          }`}
        >
          <span>Total</span>
          <span>{rulesSum}% {rulesSum !== 100 && "(should add up to 100%)"}</span>
        </div>
      </Card>

      <Card>
        <SectionTitle hint="For your own reference — payments are logged manually on the DUO page">
          DUO debt info
        </SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Original debt (€)">
            <input
              type="number"
              inputMode="decimal"
              className={inputClass}
              value={state.settings.duo.originalDebt}
              onChange={(e) =>
                setSettings({ duo: { ...state.settings.duo, originalDebt: Number(e.target.value) } })
              }
            />
          </Field>
          <Field label="Interest rate (% / yr)">
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              className={inputClass}
              value={state.settings.duo.interestRatePct}
              onChange={(e) =>
                setSettings({
                  duo: { ...state.settings.duo, interestRatePct: Number(e.target.value) },
                })
              }
            />
          </Field>
        </div>
      </Card>
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

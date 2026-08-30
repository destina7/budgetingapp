"use client";

import { useState } from "react";
import { useAppState } from "@/lib/useAppState";
import { duoRemaining, duoPaidSoFar, formatEUR, formatEURPrecise, uid } from "@/lib/calc";
import { Card, SectionTitle, Field, inputClass, Button } from "@/components/ui";

export default function DuoPage() {
  const { state, loading, update } = useAppState();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  if (loading) return <CenteredNote>Loading…</CenteredNote>;
  if (!state) return <CenteredNote>Something went wrong loading your data.</CenteredNote>;

  const remaining = duoRemaining(state);
  const paid = duoPaidSoFar(state);
  const amountNum = parseFloat(amount);
  const validAmount = !isNaN(amountNum) && amountNum > 0;

  function addEntry() {
    if (!validAmount) return;
    update((prev) => ({
      ...prev,
      duoLog: [
        { id: uid("duo"), date: new Date(date).toISOString(), amount: amountNum, note: note || undefined },
        ...prev.duoLog,
      ],
    }));
    setAmount("");
    setNote("");
  }

  function removeEntry(id: string) {
    update((prev) => ({ ...prev, duoLog: prev.duoLog.filter((e) => e.id !== id) }));
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-sm text-muted">Tracked manually, no fixed schedule</p>
        <h1 className="text-2xl font-semibold">DUO debt</h1>
      </header>

      <Card>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-xs text-muted">Remaining</p>
            <p className="mt-1 text-xl font-semibold">{formatEUR(remaining)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Paid so far</p>
            <p className="mt-1 text-xl font-semibold text-accent-green">{formatEUR(paid)}</p>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-muted">
          Original debt {formatEUR(state.settings.duo.originalDebt)} · {state.settings.duo.interestRatePct}% interest/yr
        </p>
      </Card>

      <Card>
        <SectionTitle>Log a payment</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount (€)">
            <input
              type="number"
              inputMode="decimal"
              className={inputClass}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </Field>
          <Field label="Date">
            <input
              type="date"
              className={inputClass}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Note (optional)">
            <input
              type="text"
              className={inputClass}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. extra payment from bonus"
            />
          </Field>
        </div>
        <Button onClick={addEntry} disabled={!validAmount} className="mt-3 w-full">
          Log payment
        </Button>
      </Card>

      {state.duoLog.length > 0 && (
        <Card>
          <SectionTitle>Payment history</SectionTitle>
          <div className="space-y-2">
            {state.duoLog.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between border-b border-border pb-2 text-sm last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-medium">{formatEURPrecise(entry.amount)}</p>
                  <p className="text-xs text-muted">
                    {new Date(entry.date).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}
                    {entry.note ? ` · ${entry.note}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="px-2 text-muted hover:text-accent-red"
                  aria-label="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
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

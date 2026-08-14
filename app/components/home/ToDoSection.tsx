'use client';

import { CheckCircle2, Plus } from 'lucide-react';

/**
 * To-do (H1) — scaffolded, not wired.
 *
 * The frame shows a running task list on Home (call a client, reorder stock,
 * send a receipt). There is no v2 task data layer yet — the tasks module is
 * legacy/dark (see docs/v2-migration/STATE.md) — so per CLAUDE.md's "scaffold +
 * track, don't fake" rule this renders the section shell and an honest empty
 * state rather than inventing tasks. TODO(v2 read layer): wire to a tasks
 * accessor when that module cuts over; the "Add" affordance stays inert until
 * then, so it's shown disabled rather than promising a surface that isn't here.
 */
export default function ToDoSection() {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          To do
        </h2>
        <span
          className="flex items-center gap-0.5 text-[12px] font-medium text-muted-foreground/60"
          title="Coming with the tasks module"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </span>
      </div>

      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-8 text-center">
        <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
        <p className="text-[13px] text-muted-foreground">
          Your to-do list will live here — reminders to chase a quote, reorder stock, send a receipt.
        </p>
      </div>
    </section>
  );
}

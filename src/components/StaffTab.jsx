import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { SITES, ROLES } from "../domain/constants";
import { Field, inputClass, DayToggles } from "./ui";

/* ------------------------------------------------------------------ */
/* Staff tab                                                           */
/* ------------------------------------------------------------------ */

const blankDraft = { name: "", role: "server", homeSite: "xanadu", targetHours: 38, daysOff: [] };

export function StaffTab({ employees, setEmployees }) {
  const [draft, setDraft] = useState(blankDraft);
  const [filter, setFilter] = useState("all");

  const add = () => {
    if (!draft.name.trim()) return;
    setEmployees([
      ...employees,
      { ...draft, id: `e${Date.now()}`, name: draft.name.trim(), targetHours: Number(draft.targetHours) || 0 },
    ]);
    setDraft(blankDraft);
  };

  const update = (id, patch) =>
    setEmployees(employees.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const shown = employees.filter((e) => filter === "all" || e.homeSite === filter);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Add someone to the roster</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Name">
            <input
              className={inputClass}
              value={draft.name}
              placeholder="First and last name"
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
          </Field>
          <Field label="Position">
            <select
              className={inputClass}
              value={draft.role}
              onChange={(e) => setDraft({ ...draft, role: e.target.value })}
            >
              {ROLES.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Hired at">
            <select
              className={inputClass}
              value={draft.homeSite}
              onChange={(e) => setDraft({ ...draft, homeSite: e.target.value })}
            >
              {SITES.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Hours this week">
            <input
              type="number"
              min="0"
              max="60"
              className={inputClass}
              value={draft.targetHours}
              onChange={(e) => setDraft({ ...draft, targetHours: e.target.value })}
            />
          </Field>
          <Field label="Days off">
            <DayToggles
              value={draft.daysOff}
              onChange={(v) => setDraft({ ...draft, daysOff: v })}
            />
          </Field>
        </div>
        <button
          onClick={add}
          className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-teal-800 px-3 py-2 text-sm font-medium text-white hover:bg-teal-900"
        >
          <Plus className="h-4 w-4" /> Add to roster
        </button>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-3">
          <h2 className="mr-auto text-sm font-semibold text-slate-900">
            Roster · {employees.length} people
          </h2>
          {[{ id: "all", name: "All sites" }, ...SITES].map((s) => (
            <button
              key={s.id}
              onClick={() => setFilter(s.id)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                filter === s.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Position</th>
                <th className="px-4 py-2 font-medium">Hired at</th>
                <th className="px-4 py-2 font-medium">Weekly hours</th>
                <th className="px-4 py-2 font-medium">Days off</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((e) => (
                <tr key={e.id} className="border-b border-slate-100 last:border-0 align-middle">
                  <td className="px-4 py-2">
                    <input
                      className="w-40 rounded border border-transparent bg-transparent px-1 py-1 hover:border-slate-300 focus:border-teal-600 focus:outline-none"
                      value={e.name}
                      onChange={(ev) => update(e.id, { name: ev.target.value })}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select
                      className="rounded border border-transparent bg-transparent px-1 py-1 hover:border-slate-300 focus:border-teal-600 focus:outline-none"
                      value={e.role}
                      onChange={(ev) => update(e.id, { role: ev.target.value })}
                    >
                      {ROLES.map((r) => (
                        <option key={r.id} value={r.id}>{r.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <select
                      className="rounded border border-transparent bg-transparent px-1 py-1 hover:border-slate-300 focus:border-teal-600 focus:outline-none"
                      value={e.homeSite}
                      onChange={(ev) => update(e.id, { homeSite: ev.target.value })}
                    >
                      {SITES.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min="0"
                      max="60"
                      className="w-16 rounded border border-transparent bg-transparent px-1 py-1 hover:border-slate-300 focus:border-teal-600 focus:outline-none"
                      value={e.targetHours}
                      onChange={(ev) => update(e.id, { targetHours: Number(ev.target.value) })}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <DayToggles value={e.daysOff} onChange={(v) => update(e.id, { daysOff: v })} />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => setEmployees(employees.filter((x) => x.id !== e.id))}
                      className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      aria-label={`Remove ${e.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Nobody here yet. Add your first person above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

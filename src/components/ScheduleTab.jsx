import React, { useState } from "react";
import { CalendarDays, Wand2, RotateCcw, AlertTriangle, Check, ChevronRight } from "lucide-react";
import { SITES, ROLES, DAYS } from "../domain/constants";
import { toClock, fmtHours } from "../domain/time";

/* ------------------------------------------------------------------ */
/* Schedule tab                                                        */
/* ------------------------------------------------------------------ */

export function ScheduleTab({ employees, config, result, onGenerate }) {
  const [activeSite, setActiveSite] = useState(SITES[0].id);

  if (!result) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
        <CalendarDays className="mx-auto mb-3 h-8 w-8 text-slate-300" />
        <p className="mb-4 text-sm text-slate-600">
          No week built yet. The generator uses your roster and coverage numbers.
        </p>
        <button
          onClick={onGenerate}
          className="inline-flex items-center gap-1.5 rounded-md bg-teal-800 px-3 py-2 text-sm font-medium text-white hover:bg-teal-900"
        >
          <Wand2 className="h-4 w-4" /> Build the week
        </button>
      </div>
    );
  }

  const { shifts, state, issues } = result;
  const byId = Object.fromEntries(employees.map((e) => [e.id, e]));
  const site = SITES.find((s) => s.id === activeSite);

  const siteShifts = shifts.filter((s) => s.siteId === activeSite);
  const rowIds = new Set(siteShifts.filter((s) => s.employeeId).map((s) => s.employeeId));
  for (const e of employees) if (e.homeSite === activeSite) rowIds.add(e.id);

  const rows = ROLES.map((role) => ({
    role,
    people: employees
      .filter((e) => rowIds.has(e.id) && e.role === role.id)
      .sort((a, b) => a.name.localeCompare(b.name)),
    openByDay: Object.fromEntries(
      DAYS.map((d) => [
        d,
        siteShifts.filter((s) => s.day === d && s.role === role.id && !s.employeeId),
      ])
    ),
  }));

  const gaps = issues.filter((i) => i.level === "gap");
  const broken = issues.filter((i) => i.level === "rule");
  const notes = issues.filter((i) => i.level === "info");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {SITES.map((s) => {
          const openHere = shifts.filter((x) => x.siteId === s.id && !x.employeeId).length;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSite(s.id)}
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium ${
                activeSite === s.id
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
              }`}
            >
              {s.name}
              {openHere > 0 && (
                <span className="rounded bg-rose-100 px-1.5 py-0.5 text-xs font-semibold text-rose-700">
                  {openHere}
                </span>
              )}
            </button>
          );
        })}
        <button
          onClick={onGenerate}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-400"
        >
          <RotateCcw className="h-4 w-4" /> Rebuild
        </button>
      </div>

      <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="sticky left-0 z-10 bg-slate-50 px-3 py-2 text-left text-xs font-medium text-slate-500">
                {site.name}
              </th>
              {DAYS.map((d) => (
                <th key={d} className="px-3 py-2 text-left text-xs font-medium text-slate-500">
                  {d}
                </th>
              ))}
              <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">Week</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ role, people, openByDay }) => (
              <React.Fragment key={role.id}>
                <tr className="border-b border-slate-200 bg-slate-100">
                  <td
                    colSpan={DAYS.length + 2}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    {role.plural}
                  </td>
                </tr>
                {people.map((e) => {
                  const st = state[e.id];
                  return (
                    <tr key={e.id} className="border-b border-slate-100">
                      <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-3 py-2 font-medium text-slate-800">
                        {e.name}
                        {e.homeSite !== activeSite && (
                          <span className="ml-1.5 text-xs font-normal text-slate-500">visiting</span>
                        )}
                      </td>
                      {DAYS.map((d) => {
                        const here = st.byDay[d].filter((s) => s.siteId === activeSite);
                        const elsewhere = st.byDay[d].filter((s) => s.siteId !== activeSite);
                        if (here.length === 0) {
                          return (
                            <td key={d} className="px-3 py-2 text-xs text-slate-500">
                              {e.daysOff.includes(d) ? (
                                <span className="text-rose-600">off</span>
                              ) : elsewhere.length > 0 ? (
                                <span>
                                  at {SITES.find((s) => s.id === elsewhere[0].siteId).name}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                          );
                        }
                        return (
                          <td key={d} className="px-3 py-2">
                            {here
                              .sort((a, b) => a.start - b.start)
                              .map((s) => (
                                <div
                                  key={s.id}
                                  className="mb-1 rounded bg-teal-50 px-1.5 py-1 text-xs font-medium text-teal-900 last:mb-0"
                                >
                                  {toClock(s.start)}–{toClock(s.end)}
                                </div>
                              ))}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-right text-xs">
                        <span
                          className={
                            Math.abs(st.hours - e.targetHours) <= 2
                              ? "text-slate-500"
                              : "font-semibold text-amber-700"
                          }
                        >
                          {fmtHours(st.hours)}/{e.targetHours}h
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {DAYS.some((d) => openByDay[d].length > 0) && (
                  <tr className="border-b border-slate-100 bg-rose-50">
                    <td className="sticky left-0 z-10 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800">
                      Unfilled
                    </td>
                    {DAYS.map((d) => (
                      <td key={d} className="px-3 py-2">
                        {openByDay[d].map((s) => (
                          <div key={s.id} className="mb-1 text-xs text-rose-700 last:mb-0">
                            {toClock(s.start)}–{toClock(s.end)}
                          </div>
                        ))}
                      </td>
                    ))}
                    <td />
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <IssueList
          title="Shifts nobody can take"
          items={gaps}
          empty="Every shift has a name on it."
          tone="rose"
        />
        <IssueList
          title="Rules being broken"
          items={broken}
          empty="Minimums, maximums and days off all hold."
          tone="amber"
        />
        <IssueList
          title="Worth a look"
          items={notes}
          empty="Everyone is within two hours of target."
          tone="slate"
        />
      </section>
    </div>
  );
}

function IssueList({ title, items, empty, tone }) {
  const toneMap = {
    rose: "border-rose-200 bg-rose-50 text-rose-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    slate: "border-slate-200 bg-white text-slate-700",
  };
  return (
    <div className={`rounded-lg border p-4 ${toneMap[tone]}`}>
      <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
        {items.length > 0 ? (
          <AlertTriangle className="h-4 w-4" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="text-sm">{empty}</p>
      ) : (
        <ul className="space-y-1.5 text-sm">
          {items.slice(0, 12).map((i, n) => (
            <li key={n} className="flex gap-1.5">
              <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-50" />
              <span>{i.text}</span>
            </li>
          ))}
          {items.length > 12 && (
            <li className="pl-5">and {items.length - 12} more</li>
          )}
        </ul>
      )}
    </div>
  );
}

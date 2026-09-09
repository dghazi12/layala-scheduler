import { SITES, ROLES, RULES } from "../domain/constants";
import { spanOf, fmtHours } from "../domain/time";
import { Field, inputClass } from "./ui";

/* ------------------------------------------------------------------ */
/* Coverage tab                                                        */
/* ------------------------------------------------------------------ */

export function CoverageTab({ config, setConfig }) {
  const set = (siteId, block, key, value) =>
    setConfig({
      ...config,
      [siteId]: { ...config[siteId], [block]: { ...config[siteId][block], [key]: value } },
    });

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-sm text-slate-600">
        Coverage is what the floor needs at every minute the doors are open. The generator turns
        each requirement into shifts, splitting the day when it runs longer than {RULES.maxShift} hours.
      </p>

      {SITES.map((site) => (
        <section key={site.id} className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">{site.name}</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              { key: "weekday", label: "Monday to Friday" },
              { key: "weekend", label: "Saturday and Sunday" },
            ].map((block) => {
              const c = config[site.id][block.key];
              const { len } = spanOf(c.open, c.close);
              return (
                <div key={block.key} className="p-4">
                  <div className="mb-3 flex items-baseline gap-2">
                    <h3 className="text-sm font-medium text-slate-800">{block.label}</h3>
                    <span className="text-xs text-slate-500">{fmtHours(len)}h of service</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    <Field label="Opens">
                      <input
                        type="time"
                        className={inputClass}
                        value={c.open}
                        onChange={(e) => set(site.id, block.key, "open", e.target.value)}
                      />
                    </Field>
                    <Field label="Closes">
                      <input
                        type="time"
                        className={inputClass}
                        value={c.close}
                        onChange={(e) => set(site.id, block.key, "close", e.target.value)}
                      />
                    </Field>
                    {ROLES.map((r) => (
                      <Field key={r.id} label={r.plural + " on"}>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          className={inputClass}
                          value={c[r.id]}
                          onChange={(e) =>
                            set(site.id, block.key, r.id, Number(e.target.value))
                          }
                        />
                      </Field>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Rules the generator enforces</h2>
        <ul className="space-y-1 text-sm text-slate-600">
          <li>Shortest shift is {RULES.minShift} hours, or {RULES.minCookShift} hours for a cook.</li>
          <li>Nobody goes past {RULES.maxShift} hours in a day, in any position.</li>
          <li>Everyone gets at least {RULES.minDaysOff} full day off.</li>
          <li>Xanadu and Raquel Meller staff their own shifts first, borrowing from each other only to cover a shortage. Móstoles only uses its own staff.</li>
        </ul>
      </section>
    </div>
  );
}

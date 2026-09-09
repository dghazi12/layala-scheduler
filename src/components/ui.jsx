import { DAYS } from "../domain/constants";

/* ------------------------------------------------------------------ */
/* Small UI pieces                                                     */
/* ------------------------------------------------------------------ */

export function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-medium tracking-wide text-slate-500 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

export function DayToggles({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1">
      {DAYS.map((d) => {
        const on = value.includes(d);
        return (
          <button
            key={d}
            type="button"
            onClick={() =>
              onChange(on ? value.filter((x) => x !== d) : [...value, d])
            }
            className={`rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
              on
                ? "border-rose-300 bg-rose-100 text-rose-800"
                : "border-slate-300 bg-white text-slate-500 hover:border-slate-400"
            }`}
          >
            {d}
          </button>
        );
      })}
    </div>
  );
}

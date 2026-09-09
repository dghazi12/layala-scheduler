import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users, Store, CalendarDays, Wand2, Save, Download, Upload
} from "lucide-react";
import { seedEmployees, seedConfig } from "./domain/seed";
import { generate, buildOpenShifts } from "./domain/generator";
import { validate } from "./domain/validate";
import { fmtHours } from "./domain/time";
import { StaffTab } from "./components/StaffTab";
import { CoverageTab } from "./components/CoverageTab";
import { ScheduleTab } from "./components/ScheduleTab";

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */

export default function App() {
  const [tab, setTab] = useState("staff");
  const [employees, setEmployees] = useState(seedEmployees);
  const [config, setConfig] = useState(seedConfig);
  const [result, setResult] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState("idle");

  useEffect(() => {
    (async () => {
      try {
        const saved = await window.storage.get("roster-v1");
        if (saved) {
          const parsed = JSON.parse(saved.value);
          if (parsed.employees) setEmployees(parsed.employees);
          if (parsed.config) setConfig(parsed.config);
        }
      } catch {
        // nothing saved yet, seed data stands
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;
    setSaveState("saving");
    const t = setTimeout(async () => {
      try {
        await window.storage.set("roster-v1", JSON.stringify({ employees, config }));
        if (!cancelled) setSaveState("saved");
      } catch {
        if (!cancelled) setSaveState("error");
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [employees, config, loaded]);

  const downloadBackup = () => {
    const blob = new Blob([JSON.stringify({ employees, config }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roster-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const restoreBackup = async (ev) => {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed.employees)) throw new Error("no employees in file");
      setEmployees(parsed.employees);
      if (parsed.config) setConfig(parsed.config);
      setResult(null);
    } catch (err) {
      alert(`That file isn't a roster backup. ${err.message}`);
    }
  };

  const runGenerator = useCallback(() => {
    const { shifts, state } = generate(employees, config);
    setResult({ shifts, state, issues: validate(shifts, employees, state) });
    setTab("schedule");
  }, [employees, config]);

  const totals = useMemo(() => {
    const openShifts = buildOpenShifts(config);
    return {
      demand: openShifts.reduce((a, s) => a + s.hours, 0),
      supply: employees.reduce((a, e) => a + (Number(e.targetHours) || 0), 0),
    };
  }, [config, employees]);

  const tabs = [
    { id: "staff", label: "Staff", icon: Users },
    { id: "coverage", label: "Coverage", icon: Store },
    { id: "schedule", label: "Schedule", icon: CalendarDays },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-4">
          <div className="mr-auto">
            <h1 className="text-lg font-semibold tracking-tight">Shift planner</h1>
            <p className="text-sm text-slate-500">
              One week across Xanadu, Raquel Meller and Móstoles
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-right">
              <div className="text-xs text-slate-500">Hours the week needs</div>
              <div className="font-semibold">{fmtHours(totals.demand)}h</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">Hours the roster offers</div>
              <div
                className={`font-semibold ${
                  totals.supply < totals.demand ? "text-rose-700" : "text-teal-800"
                }`}
              >
                {fmtHours(totals.supply)}h
              </div>
            </div>
            <button
              onClick={runGenerator}
              className="inline-flex items-center gap-1.5 rounded-md bg-teal-800 px-3 py-2 text-sm font-medium text-white hover:bg-teal-900"
            >
              <Wand2 className="h-4 w-4" /> Build the week
            </button>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium ${
                  tab === t.id
                    ? "border-teal-800 text-teal-900"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-3 py-2">
            <button
              onClick={downloadBackup}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
            >
              <Download className="h-3.5 w-3.5" /> Download backup
            </button>
            <label className="inline-flex cursor-pointer items-center gap-1 text-xs text-slate-500 hover:text-slate-800">
              <Upload className="h-3.5 w-3.5" /> Restore
              <input type="file" accept="application/json" className="hidden" onChange={restoreBackup} />
            </label>
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Save className="h-3.5 w-3.5" />
              {saveState === "saving" ? "Saving" : saveState === "error" ? "Not saved" : "Saved"}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {tab === "staff" && <StaffTab employees={employees} setEmployees={setEmployees} />}
        {tab === "coverage" && <CoverageTab config={config} setConfig={setConfig} />}
        {tab === "schedule" && (
          <ScheduleTab
            employees={employees}
            config={config}
            result={result}
            onGenerate={runGenerator}
          />
        )}
      </main>
    </div>
  );
}

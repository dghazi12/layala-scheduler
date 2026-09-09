import { SITES, ROLES, DAYS, RULES } from "./constants";
import { fmtHours } from "./time";

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

export function validate(shifts, employees, state) {
  const issues = [];
  const byId = Object.fromEntries(employees.map((e) => [e.id, e]));

  const unfilled = shifts.filter((s) => !s.employeeId);
  const grouped = {};
  for (const s of unfilled) {
    const key = `${s.siteId}|${s.role}`;
    grouped[key] = (grouped[key] || 0) + 1;
  }
  for (const key of Object.keys(grouped)) {
    const [siteId, role] = key.split("|");
    issues.push({
      level: "gap",
      text: `${grouped[key]} unfilled ${ROLES.find((r) => r.id === role).label.toLowerCase()} shift${grouped[key] > 1 ? "s" : ""} at ${SITES.find((s) => s.id === siteId).name}`,
    });
  }

  for (const s of shifts) {
    const floor = s.role === "cook" ? RULES.minCookShift : RULES.minShift;
    if (s.hours < floor - 0.001) {
      issues.push({
        level: "rule",
        text: `${SITES.find((x) => x.id === s.siteId).name} ${s.day}: ${fmtHours(s.hours)}h ${s.role} shift is under the ${floor}h minimum. Widen the opening hours or lower the required count.`,
      });
    }
  }

  for (const e of employees) {
    const st = state[e.id];
    const worked = DAYS.filter((d) => st.byDay[d].length > 0);
    const off = DAYS.length - worked.length;
    if (off < RULES.minDaysOff) {
      issues.push({ level: "rule", text: `${e.name} has no day off.` });
    }
    for (const d of DAYS) {
      const h = st.byDay[d].reduce((a, s) => a + s.hours, 0);
      if (h > RULES.maxShift + 0.001) {
        issues.push({ level: "rule", text: `${e.name} is on for ${fmtHours(h)}h on ${d}.` });
      }
      const sites = new Set(st.byDay[d].map((s) => s.siteId));
      if (sites.size > 1) {
        issues.push({ level: "info", text: `${e.name} covers two sites on ${d}.` });
      }
    }
    const diff = st.hours - e.targetHours;
    if (diff < -2) {
      issues.push({
        level: "info",
        text: `${e.name} is ${fmtHours(-diff)}h short of ${e.targetHours}h.`,
      });
    }
    if (diff > 2) {
      issues.push({
        level: "info",
        text: `${e.name} is ${fmtHours(diff)}h over ${e.targetHours}h.`,
      });
    }
  }

  const seen = new Set();
  return issues.filter((i) => {
    const k = i.level + i.text;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

import { SITES, ROLES, DAYS, WEEKEND, RULES } from "./constants";
import { spanOf, roundQuarter } from "./time";

/* ------------------------------------------------------------------ */
/* Schedule generator                                                  */
/* ------------------------------------------------------------------ */

export function splitIntoSegments(open, close, role) {
  const { start, end, len } = spanOf(open, close);
  const floorLen = role === "cook" ? RULES.minCookShift : RULES.minShift;
  let n = Math.ceil(len / RULES.maxShift);
  const maxPieces = Math.max(1, Math.floor(len / floorLen));
  n = Math.max(1, Math.min(n, maxPieces));
  const step = len / n;
  const out = [];
  for (let i = 0; i < n; i++) {
    const s = i === 0 ? start : roundQuarter(start + i * step);
    const e = i === n - 1 ? end : roundQuarter(start + (i + 1) * step);
    out.push({ start: s, end: e });
  }
  return out;
}

export function buildOpenShifts(config) {
  const shifts = [];
  let n = 0;
  for (const site of SITES) {
    const cfg = config[site.id];
    for (const day of DAYS) {
      const dayCfg = WEEKEND.includes(day) ? cfg.weekend : cfg.weekday;
      for (const role of ROLES) {
        const need = Number(dayCfg[role.id]) || 0;
        const segs = splitIntoSegments(dayCfg.open, dayCfg.close, role.id);
        for (let slot = 0; slot < need; slot++) {
          for (const seg of segs) {
            shifts.push({
              id: `s${n++}`,
              siteId: site.id,
              day,
              role: role.id,
              slot,
              start: seg.start,
              end: seg.end,
              hours: seg.end - seg.start,
              employeeId: null,
            });
          }
        }
      }
    }
  }
  return shifts;
}

function pickBest(shift, employees, state, allowedSiteIds) {
  let best = null;
  let bestScore = -Infinity;

  for (const e of employees) {
    if (e.role !== shift.role) continue;
    if (!allowedSiteIds.includes(e.homeSite)) continue;
    if (e.daysOff.includes(shift.day)) continue;

    const st = state[e.id];
    const today = st.byDay[shift.day];
    const dayHours = today.reduce((a, s) => a + s.hours, 0);
    if (dayHours + shift.hours > RULES.maxShift) continue;
    if (today.some((s) => s.start < shift.end && shift.start < s.end)) continue;

    const daysWorked = DAYS.filter((d) => st.byDay[d].length > 0);
    const wouldBeNewDay = today.length === 0;
    if (wouldBeNewDay && daysWorked.length >= DAYS.length - RULES.minDaysOff) continue;

    const remaining = e.targetHours - st.hours;
    let score = remaining;
    if (e.homeSite === shift.siteId) score += 4;
    if (remaining < shift.hours) score -= 12;
    if (today.length > 0) score += 2; // prefer extending a day already worked

    if (score > bestScore) {
      bestScore = score;
      best = e;
    }
  }

  return best;
}

export function generate(employees, config) {
  const shifts = buildOpenShifts(config);

  const state = {};
  for (const e of employees) {
    state[e.id] = { hours: 0, byDay: Object.fromEntries(DAYS.map((d) => [d, []])) };
  }

  const dayIndex = Object.fromEntries(DAYS.map((d, i) => [d, i]));
  const ordered = [...shifts].sort(
    (a, b) => dayIndex[a.day] - dayIndex[b.day] || a.start - b.start
  );

  for (const shift of ordered) {
    const site = SITES.find((s) => s.id === shift.siteId);

    // Home site first. Only pull from a sibling site once home staff can't
    // cover the shift — Móstoles has no siblings, so it never falls back.
    let best = pickBest(shift, employees, state, [site.id]);
    if (!best && site.siblings.length > 0) {
      best = pickBest(shift, employees, state, site.siblings);
    }

    if (best) {
      shift.employeeId = best.id;
      state[best.id].hours += shift.hours;
      state[best.id].byDay[shift.day].push(shift);
    }
  }

  return { shifts, state };
}

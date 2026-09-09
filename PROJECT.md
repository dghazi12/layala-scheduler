# Shift planner — project brief

Context document for working on this codebase. Written to be handed to an
assistant at the start of a session.

## What this is

A weekly staff scheduling tool for a three-restaurant group. A manager enters
the roster and the coverage each site needs, presses one button, and gets a
filled week plus a list of everything the generator couldn't satisfy. The
finished week is exported to Excel in a specific layout that gets uploaded to
Sesame, the group's HR system.

Schedules are built one week at a time.

## The three restaurants

| Site | Staff pool |
|---|---|
| Xanadu | Madrid — shared |
| Raquel Meller | Madrid — shared |
| Móstoles | Its own staff only |

Xanadu and Raquel Meller draw from one pool: somebody hired at Raquel Meller can
be scheduled at Xanadu and vice versa. Móstoles is isolated — its staff work
only there, and nobody else can cover its shifts.

## Coverage required

At every minute the doors are open:

| | Mon–Fri | Sat–Sun |
|---|---|---|
| Servers | 2 | 2 |
| Dishwashers | 1 | 2 |
| Cooks | 1 | 1 |
| Helpers | 1 | 1 |

Opening hours were never specified, so every site currently defaults to
12:00–23:00 and is editable per site, per weekday/weekend block. These are
expected to be tweaked.

## Rules the generator enforces

- Minimum shift length 3 hours; 5 hours for a cook
- Maximum 9 hours in a day, in any position
- At least one full day off per person per week
- Site eligibility per the pool table above

## Known tension worth understanding

Coverage demand vastly exceeds what a small roster can supply. Two servers on
at all times, 11 hours a day, 7 days = 154 server-hours per site per week —
roughly four full-time servers per site before anyone takes a holiday. The
header compares hours needed against hours the roster offers so the shortfall is
visible before generating. Unfilled shifts are a normal, expected output, not a
bug. Don't "fix" them by relaxing the rules.

## Current state

Working Vite + React + Tailwind v4 app, `npm install && npm run dev`.

Three tabs:

- **Staff** — add and edit people: name, position, which site they were hired
  at, target hours for the week, and which days they're off. Inline editable
  table, filterable by site.
- **Coverage** — per site, opening and closing time plus required headcount per
  position, split into a Mon–Fri block and a Sat–Sun block.
- **Schedule** — the generated week as a person-by-day grid per site, with
  unfilled shifts called out in their own row, and three panels: shifts nobody
  can take, rules being broken, and things worth a look (people over or under
  target by more than two hours).

Header has Download backup / Restore, and a save indicator.

## How the generator works

1. `buildOpenShifts(config)` turns coverage requirements into concrete shifts.
   For each site, day, and position it creates `n` slots, and splits each into
   segments if the service day runs longer than the 9-hour cap. An 11-hour day
   becomes two segments — 12:00–17:30 and 17:30–23:00. The split count is capped
   so no segment falls under the role's minimum (3h, or 5h for cooks).
2. `generate(employees, config)` walks the shifts in chronological order and
   greedily assigns each to the best eligible person. Hard filters: matching
   role, compatible pool, not a day off, no overlap, wouldn't exceed 9h that
   day, wouldn't take away their last day off. Score prefers whoever is furthest
   below their target hours, with a bonus for their home site and for extending
   a day they're already working.
3. `validate(shifts, employees, state)` produces the issue list.

This is a greedy heuristic, not an optimiser. It's the right call at this scale
(3 sites, ~30 people). If provably optimal schedules are ever needed, the move
is Google OR-Tools CP-SAT behind a small Python endpoint — a significant jump in
complexity that probably isn't warranted.

## Persistence

`src/storage.js` exposes `get / set / list / delete` and currently wraps
`localStorage`. It exists because the app was first prototyped in an environment
that provided a hosted key-value store under the same interface.

This is deliberately the only place persistence lives. Moving to a real backend
means replacing those four functions with `fetch()` calls and changing nothing
else. Supabase is the intended destination — Postgres, auth, and an API without
writing a server, and its free tier covers ~30 employees comfortably.

Until then `localStorage` means one browser on one machine, so the JSON
backup/restore buttons are the safety net.

## The Excel export — not yet built in the app

This is the next significant piece of work. A Python prototype exists that
reproduces the target format exactly and has been verified against a real file
from the client; it needs porting to run in the browser.

**Use ExcelJS, not SheetJS.** The free SheetJS build won't write fills, merged
cells, or conditional formatting, and this format is almost entirely formatting.

### Format specification

One sheet per restaurant. Everything below is 1-indexed by row and column
letter, for `N` employees.

**Title** — `B1:AK2` merged, e.g. `HORARIOS LAYALI XANADU`, Aptos Narrow 12 bold,
centered.

**Roster block** — header at row 3, employees rows 4 to `3+N`. Both the header
row and every data row use the same merged spans: `C:D` (OPERARIO), `E:H`
(ESTADO, always the literal `Alta`), `I:R` (PUESTO), `S:V` (CONTRATO — contracted
weekly hours), `W:AA` (CONTACTO), `AB:AC` (H / SEM), `AD:AF` (DESCUADRE), `AJ:AK`.
Column B holds `#1`, `#2` and so on.

**Colour identity** — each person gets one fill colour, applied to their roster
row and to every block they occupy in every day grid. This is how the sheet is
read at a glance. Text goes white on dark fills, black on light.

**Equivalencia row** at `4+N`: `B:AG` merged with
`Equivalencia de personal a jornada completa`, and `AH:AK` merged holding
`=SUM(AB4:AC{3+N})/40`.

**Day blocks** — seven of them, starting at row `N+7`, each `N+4` rows tall.
Header occupies 4 rows, then one row per employee in roster order.

- Day name in `B:C` merged across all 4 header rows, 20pt bold white on a
  coloured fill.
- Half-hour columns `G` through `AK` — 31 slots, 09:00 through 00:00. Times are
  rotated 90°, wrapped, centered.
- **Font size 10 on those time labels.** At 12pt the rotated text is measured
  against the 2.66-wide column and clips to `###`. This was a real bug; don't
  raise it.
- Header banding encodes demand: grey outside service hours, `FFFBE4D5` during
  service, `FFFF5704` at peak. Peaks are currently hardcoded to 14:30–15:30 and
  20:30–21:30, copied from the client's file. Should become a per-site setting.
- Employee rows: `B` = `=B{rosterRow}`, `C` = `=C{rosterRow}`, `D` = `=AO{row}`,
  `E:F` merged holding `h/dia`, then `0.5` in each half-hour worked, `AO` =
  `=SUM(E{row}:AM{row})`, `AP` = `=C{row}`, `AS` = optional prep task.

**Formulas must be live, never precomputed values.** Weekly `H / SEM` sums the
seven `AO` cells for that person; `DESCUADRE` is `=AB{r}-S{r}`. Conditional
formatting on `D` and `AO`: pink `FFFFC7CE` / text `FF9C0006` when 0, green
`FFC6EFCE` / text `FF006100` when above 0.

**Column widths** — A 2, B 5, C 18, D 8.5, E through AM 2.66, AN 2.5, AO 6.66,
AP 21.5, AQ 10.83, AR 4.66, AT 22.66.

**Conventions** — `v` marks a holiday, not a routine weekly day off; ordinary
days off are left blank. Gridlines hidden. Landscape, fit to width.

### Bugs found in the client's original, deliberately not reproduced

- `AD15` referenced `T15` instead of `S15`, so that person's descuadre read the
  wrong contract cell
- `AO129` started its sum at `G` instead of `E`
- The `AP` name column pointed at the roster block on Monday but at itself on
  every other day

These are corrected in the generator. Confirm with the client before assuming
they were unintentional.

## Open questions blocking work

1. **How does Sesame identify a person?** The example file has no employee
   identifier beyond `#1`…`#12`, and no dates anywhere — only weekday names. If
   Sesame matches on the name string in column C that's fragile; if it needs a
   DNI or internal ID, that field has to be added to the roster model before the
   export is written. This blocks finishing the export.
2. Does Sesame need the week's actual dates rather than weekday names?
3. One file per restaurant, or all three in one workbook?
4. Real opening hours per site.
5. Should routine days off also be marked, or stay blank as in the original?

## Next up, roughly in order

1. Split `App.jsx` — it's 1,040 lines in one file
2. Excel export via ExcelJS, once question 1 is answered
3. Drag and drop to move a shift between people
4. Split shifts (lunch and dinner with a gap) rather than continuous coverage
5. Per-person availability windows instead of whole days off
6. Copy last week forward as a starting point
7. Move persistence to Supabase

## Conventions

- Tailwind core utilities only, no arbitrary values
- Scheduling logic stays as pure functions — data in, data out, no React. This
  is the most important structural rule here: restaurant rules change constantly
  and the logic needs to stay testable in isolation.
- Slate/teal palette; rose for gaps, amber for rule violations
- Copy is plain and active: "Build the week", not "Generate Schedule"

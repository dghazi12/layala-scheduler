# Where this project stands

Read `PROJECT.md` for what the app is and how it should behave. This file covers
what has already happened — decisions made, what's been verified, and what
hasn't — so you're not inferring history from the code.

## How this got here

The client manages three restaurants and schedules staff by hand. They asked
what to build a scheduler in, given a background in TypeScript and React. The
answer was to stay with React and TypeScript — the hard part is the UI and the
rules, not the language — and the app was built up from their description of the
restaurants, coverage requirements, and shift rules.

They then supplied a real Excel file from their group as the export target. It
was reverse-engineered cell by cell and reproduced in a Python prototype. That
work is done and verified; it just needs porting into the app.

## Decisions already made, and why

**React + Vite + Tailwind v4, not a scheduling framework.** The client knows this
stack. Nothing about the problem needs anything heavier.

**Greedy assignment, not a constraint solver.** At three sites and roughly thirty
people, a heuristic plus manual override is enough. OR-Tools CP-SAT behind a
Python endpoint is the escalation path if provably optimal schedules are ever
needed — a large jump in complexity that isn't justified yet. Don't reach for it
unasked.

**Scheduling logic as pure functions.** It takes data and returns data, no React.
Restaurant rules change constantly, and this is what keeps them testable and
safe to edit. Treat this as the load-bearing constraint of the codebase.

**ExcelJS for the export, not SheetJS.** The free SheetJS build can't write
fills, merges, or conditional formatting, and the target format is almost
entirely formatting. Decided after reading the client's file.

**Persistence isolated behind four functions.** `src/storage.js` currently wraps
`localStorage`. The client asked about keeping everything in a JSON file; the
answer was that a bundled JSON file is read-only in practice and a served one has
concurrency and hosting problems, so Supabase is the intended destination. The
shim exists so that migration touches one file.

**Backup and restore buttons.** Added because `localStorage` alone isn't
trustworthy for a business's roster.

## What has actually been verified

- The app installs, builds clean with Vite, and the dev server serves and
  transforms it. Confirmed by running it, not by inspection.
- The Excel prototype produces a file whose computed weekly totals reconcile
  exactly against the schedule data that generated it, with zero formula errors
  after a full recalculation, and it was rendered and compared visually against
  the client's original.

## What has not been verified

- Nobody has clicked through the running UI. The build passes and it renders,
  but the tabs, the inline table editing, and the generate flow have not been
  exercised by a person.
- The generated Excel has been opened in LibreOffice, not in Excel proper, and
  never uploaded to Sesame.
- There are no tests of any kind.

## What is where

The app is in the repo. The Excel work is not — it lives in `tools/` as Python:

    tools/build_roster.py    reproduces the client's format from schedule data
    tools/make_sample.py     builds sample data and drives the exporter

Keep these. They are the reference implementation for the ExcelJS port, and the
faster place to test format changes than the browser. `build_roster.py` carries
comments on the non-obvious parts, including the 10pt font on the rotated time
labels — at 12pt the text clips to `###`, which cost real time to track down.

## The immediate task

`src/App.jsx` is 1,040 lines holding time helpers, the scheduling engine, seed
data, and four UI components. Split it along the structure in `PROJECT.md` under
"Next up". Nothing in `domain/` should import React. Run `npm run build` after
and confirm it still passes.

This is a pure move-and-reexport refactor. Behaviour should not change.

## Things not to undo

- Unfilled shifts in the generated week are the expected output, not a bug. The
  coverage requirements genuinely exceed what the current roster can supply, and
  surfacing that is the point. Don't relax the rules to make the warnings go
  away.
- The three formula bugs found in the client's original Excel are deliberately
  corrected in the exporter, and flagged in `PROJECT.md` as needing the client's
  confirmation. Don't reproduce them for fidelity's sake.
- Opening hours, peak-hour bands, and site names are placeholders awaiting real
  numbers from the client. They're configurable on purpose.

## Blocked, don't guess

The Excel export cannot be finished until the client says how Sesame identifies
a person. Their example file has no identifier beyond `#1`…`#12` and no dates,
only weekday names. If Sesame matches on the name string that's fragile; if it
needs a DNI or internal ID, that field has to be added to the employee model
first. Ask rather than inventing a schema.

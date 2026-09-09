# Shift planner

Weekly scheduling for Xanadu, Raquel Meller and Móstoles.

## Run it

Node 18 or newer.

    npm install
    npm run dev

Open the URL it prints (usually http://localhost:5173).

## Where the data lives

`src/storage.js` stands in for the hosted key-value store the app used in the
canvas, backed by `localStorage`. That means:

- Data survives refreshes and restarts, but it lives in **this browser only**.
- Clearing site data wipes it. Another machine won't see it.

So use **Download backup** in the header regularly — it writes the whole roster
and coverage config to a JSON file, and **Restore** reads it back.

When you're ready for real persistence, replace the four functions in
`storage.js` with `fetch()` calls to your API (Supabase, or a small Node server).
Nothing else in the app needs to change.

## Layout

    src/App.jsx       everything: roster UI, coverage config, generator, validation
    src/storage.js    persistence shim
    src/main.jsx      entry point

The scheduling logic lives in the middle of `App.jsx` as plain functions:
`splitIntoSegments`, `buildOpenShifts`, `generate`, `validate`. They take data
and return data — no React. Pull them into `src/scheduling.js` when you start
writing tests for the rules.

## Rules currently enforced

- Minimum shift 3 hours, 5 hours for a cook
- Maximum 9 hours a day in any position
- At least one full day off per person per week
- Xanadu and Raquel Meller share a staff pool; Móstoles does not

## Not built yet

- Excel export in the Sesame format (prototyped separately in Python)
- Drag and drop to move shifts between people
- Split shifts with a gap, rather than continuous coverage
- Availability windows instead of whole days off

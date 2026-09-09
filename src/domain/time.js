/* ------------------------------------------------------------------ */
/* Time helpers (decimal hours, close may cross midnight)              */
/* ------------------------------------------------------------------ */

export const toDec = (t) => {
  const [h, m] = String(t).split(":").map(Number);
  return h + m / 60;
};
export const toClock = (d) => {
  const wrapped = ((d % 24) + 24) % 24;
  const h = Math.floor(wrapped);
  const m = Math.round((wrapped - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};
export const spanOf = (open, close) => {
  const o = toDec(open);
  let c = toDec(close);
  if (c <= o) c += 24;
  return { start: o, end: c, len: c - o };
};
export const roundQuarter = (x) => Math.round(x * 4) / 4;
export const fmtHours = (h) => (Math.round(h * 10) / 10).toString().replace(/\.0$/, "");

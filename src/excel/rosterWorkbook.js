import ExcelJS from "exceljs";
import { SITES, ROLES, DAYS, WEEKEND } from "../domain/constants";
import { toDec } from "../domain/time";

/*
 * Ports tools/build_roster.py (verified cell-by-cell against a real client
 * file) into the browser with ExcelJS. Keep this in step with that script —
 * it is the reference implementation for this layout.
 */

const DAY_LABELS = {
  Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday",
  Fri: "Friday", Sat: "Saturday", Sun: "Sunday",
};

const GRID_START_COL = 7; // G
const GRID_SLOTS = 31; // 09:00 .. 00:00
const GRID_START_HOUR = 9.0;
const COL_TOTAL = 41; // AO — day total
const COL_NAME2 = 42; // AP — name repeated beside the total

const GREY = "FFD8D8D8";
const PEACH = "FFFBE4D5";
const PEAK = "FFFF5704";
const WHITE = "FFF2F2F2";

// Colours cycled through the roster so each person reads as one colour all week.
const PALETTE = [
  "FF00B050", "FF5C77F2", "FF92D050", "FFC06900", "FFE7A6D8",
  "FF4472C4", "FFFFC000", "FF7DD3D8", "FFED7D31", "FFA9D08E",
  "FFB4A7D6", "FF8FAADC", "FFF4B183", "FFC9C9C9", "FFD86DCD",
  "FF6FA8DC", "FFFFD966", "FF76A5AF", "FFE06666", "FF93C47D",
];

// Peak bands are hardcoded to 14:30-15:30 and 20:30-21:30, copied from the
// client's original file. Should become a per-site setting eventually.
const PEAK_HOURS = [
  [14.5, 15.5],
  [20.5, 21.5],
];

function isDark(argb) {
  const r = parseInt(argb.slice(2, 4), 16);
  const g = parseInt(argb.slice(4, 6), 16);
  const b = parseInt(argb.slice(6, 8), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b < 128;
}

function slotIndex(hour) {
  return Math.round((hour - GRID_START_HOUR) * 2);
}

function fill(argb) {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}

function peakSlotsForDay() {
  const slots = new Set();
  for (const [start, end] of PEAK_HOURS) {
    for (let s = slotIndex(start); s < slotIndex(end); s++) slots.add(s);
  }
  return slots;
}

function openSlotsForDay(site, config, day) {
  const dayCfg = WEEKEND.includes(day) ? config[site.id].weekend : config[site.id].weekday;
  return [slotIndex(toDec(dayCfg.open)), slotIndex(toDec(dayCfg.close))];
}

function employeesForSite(site, employees, shifts) {
  return employees.filter(
    (e) =>
      e.homeSite === site.id ||
      shifts.some((s) => s.siteId === site.id && s.employeeId === e.id)
  );
}

function buildSheet(workbook, site, employees, shifts, config) {
  const ws = workbook.addWorksheet(site.name);
  const n = employees.length;
  const peakSlots = peakSlotsForDay();

  // ---------- column widths ----------
  ws.getColumn(1).width = 2.0;
  ws.getColumn(2).width = 5.0;
  ws.getColumn(3).width = 18.0;
  ws.getColumn(4).width = 8.5;
  ws.getColumn(5).width = 2.66;
  ws.getColumn(6).width = 2.66;
  for (let c = GRID_START_COL; c <= GRID_START_COL + GRID_SLOTS; c++) ws.getColumn(c).width = 2.66;
  ws.getColumn(40).width = 2.5; // AN
  ws.getColumn(COL_TOTAL).width = 6.66; // AO
  ws.getColumn(COL_NAME2).width = 21.5; // AP
  ws.getColumn(43).width = 10.83; // AQ
  ws.getColumn(44).width = 4.66; // AR
  ws.getColumn(46).width = 22.66; // AT

  // ---------- title ----------
  ws.mergeCells(1, 2, 2, 37); // B1:AK2
  const title = ws.getCell(1, 2);
  title.value = `HORARIOS LAYALI ${site.name.toUpperCase()}`;
  title.font = { name: "Aptos Narrow", size: 12, bold: true };
  title.alignment = { horizontal: "center", vertical: "middle" };

  // ---------- roster header ----------
  const headerFont = { name: "Calibri", size: 9, bold: true };
  const headerFill = fill("FFD9D9D9");
  const headerCells = [
    [2, 2, "ID"], [3, 4, "OPERARIO"], [5, 8, "ESTADO"],
    [9, 18, "PUESTO"], [19, 22, "CONTRATO"], [23, 27, "CONTACTO"],
    [28, 29, "H / SEM"], [30, 33, "DESCUADRE"], [34, 37, ""],
  ];
  for (const [a, b, label] of headerCells) {
    if (b > a) ws.mergeCells(3, a, 3, b);
    const c = ws.getCell(3, a);
    c.value = label;
    c.font = headerFont;
    c.fill = headerFill;
    c.alignment = { horizontal: "right", vertical: "middle" };
  }

  // ---------- roster rows ----------
  const firstDayHeader = n + 7;
  const dayHeaderRows = DAYS.map((_, i) => firstDayHeader + i * (n + 4));
  const dayFirstEmpRows = dayHeaderRows.map((h) => h + 4);

  employees.forEach((e, i) => {
    const r = 4 + i;
    const colour = PALETTE[i % PALETTE.length];
    const rowFill = fill(colour);
    const font = { name: "Calibri", size: 12, bold: true, color: { argb: isDark(colour) ? WHITE : "FF000000" } };

    ws.getCell(r, 2).value = `#${i + 1}`;
    ws.getCell(r, 2).font = { name: "Calibri", size: 12 };

    for (const [a, b] of [[3, 4], [5, 8], [9, 18], [19, 22], [23, 27], [28, 29], [30, 32], [36, 37]]) {
      ws.mergeCells(r, a, r, b);
    }
    const role = ROLES.find((x) => x.id === e.role);
    for (const [col, val] of [[3, e.name], [5, "Alta"], [9, role.label], [19, e.targetHours], [23, ""]]) {
      const c = ws.getCell(r, col);
      c.value = val;
      c.fill = rowFill;
      c.font = font;
    }

    // weekly total = sum of this person's row in every day block
    const parts = dayFirstEmpRows.map((fr) => `AO${fr + i}`).join("+");
    const wk = ws.getCell(r, 28);
    wk.value = { formula: parts };
    wk.fill = rowFill;
    wk.font = font;
    wk.numFmt = "0.0";

    ws.getCell(r, 30).value = { formula: `AB${r}-S${r}` };
    ws.getCell(r, 30).numFmt = "0.0";
    ws.getCell(r, 33).value = "h";
  });

  const equiv = 4 + n;
  ws.mergeCells(equiv, 2, equiv + 1, 33); // B{equiv}:AG{equiv+1}
  ws.getCell(equiv, 2).value = "Equivalencia de personal a jornada completa";
  ws.getCell(equiv, 2).font = { name: "Calibri", size: 11, bold: true };
  ws.mergeCells(equiv, 34, equiv + 1, 37); // AH:AK
  ws.getCell(equiv, 34).value = { formula: `SUM(AB4:AC${3 + n})/40` };
  ws.getCell(equiv, 34).numFmt = "0.00";
  ws.getRow(equiv).height = 16;

  // ---------- day blocks ----------
  DAYS.forEach((day, d) => {
    const h = dayHeaderRows[d];
    ws.getRow(h).height = 16;

    ws.mergeCells(h, 2, h + 3, 3); // B:C
    const dc = ws.getCell(h, 2);
    dc.value = DAY_LABELS[day];
    dc.font = { name: "Calibri", size: 20, bold: true, color: { argb: WHITE } };
    dc.fill = fill(PALETTE[d % PALETTE.length]);
    dc.alignment = { horizontal: "center", vertical: "middle" };

    for (const col of [4, 5, 6]) {
      ws.mergeCells(h, col, h + 3, col);
      ws.getCell(h, col).fill = fill(GREY);
    }

    const [openStart, openEnd] = openSlotsForDay(site, config, day);
    for (let s = 0; s < GRID_SLOTS; s++) {
      const col = GRID_START_COL + s;
      ws.mergeCells(h, col, h + 3, col);
      const c = ws.getCell(h, col);
      const mins = Math.round((GRID_START_HOUR + s * 0.5) * 60) % (24 * 60);
      c.value = mins / 1440;
      c.numFmt = "h:mm";
      // 10pt: rotated text is measured against the 2.66-wide column, and 12pt clips to ###
      c.font = { name: "Calibri", size: 10, bold: true };
      c.alignment = { horizontal: "center", textRotation: 90, wrapText: true };
      const band = peakSlots.has(s) ? PEAK : openStart <= s && s < openEnd ? PEACH : GREY;
      c.fill = fill(band);
    }

    employees.forEach((e, i) => {
      const r = dayFirstEmpRows[d] + i;
      const top = 4 + i;
      const colour = PALETTE[i % PALETTE.length];
      const rowFill = fill(colour);

      const nm = ws.getCell(r, 3);
      nm.value = { formula: `C${top}` };
      nm.fill = rowFill;
      nm.font = { name: "Calibri", size: 12, bold: true, color: { argb: isDark(colour) ? WHITE : "FF000000" } };
      ws.getCell(r, 2).value = { formula: `B${top}` };
      ws.getCell(r, 2).font = { name: "Calibri", size: 12 };

      const tot = ws.getCell(r, 4);
      tot.value = { formula: `AO${r}` };
      tot.numFmt = "0.0";
      tot.fill = fill("FFD9D9D9");

      ws.mergeCells(r, 5, r, 6);
      const u = ws.getCell(r, 5);
      u.value = "h/dia";
      u.alignment = { horizontal: "center" };
      u.fill = fill("FFD9D9D9");
      u.font = { name: "Calibri", size: 11 };

      for (const sh of shifts) {
        if (sh.employeeId !== e.id || sh.day !== day) continue;
        for (let s = slotIndex(sh.start); s < slotIndex(sh.end); s++) {
          if (s < 0 || s >= GRID_SLOTS) continue;
          const c = ws.getCell(r, GRID_START_COL + s);
          c.value = 0.5;
          c.fill = rowFill;
          c.numFmt = "0.0";
          c.font = { name: "Calibri", size: 8, bold: true };
          c.alignment = { horizontal: "center", vertical: "middle" };
          c.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
        }
      }

      ws.getCell(r, COL_TOTAL).value = { formula: `SUM(E${r}:AM${r})` };
      ws.getCell(r, COL_TOTAL).numFmt = "0.0";
      ws.getCell(r, COL_NAME2).value = { formula: `C${r}` };
    });
  });

  for (const h of dayHeaderRows) {
    ws.getRow(h).height = 16;
    ws.getRow(h + 3).height = 17;
  }

  const green = { fill: fill("FFC6EFCE"), font: { color: { argb: "FF006100" } } };
  const pink = { fill: fill("FFFFC7CE"), font: { color: { argb: "FF9C0006" } } };
  for (const fr of dayFirstEmpRows) {
    for (const col of [4, COL_TOTAL]) {
      const colLetter = col === 4 ? "D" : "AO";
      const ref = `${colLetter}${fr}:${colLetter}${fr + n - 1}`;
      ws.addConditionalFormatting({
        ref,
        rules: [
          { type: "cellIs", operator: "equal", formulae: ["0"], style: pink, priority: 1 },
          { type: "cellIs", operator: "greaterThan", formulae: ["0"], style: green, priority: 2 },
        ],
      });
    }
  }

  ws.views = [{ showGridLines: false }];
  ws.pageSetup = { orientation: "landscape", fitToWidth: 1, fitToHeight: 0, fitToPage: true };
}

export async function buildRosterWorkbook(employees, config, shifts) {
  const workbook = new ExcelJS.Workbook();
  for (const site of SITES) {
    const siteEmployees = employeesForSite(site, employees, shifts);
    const siteShifts = shifts.filter((s) => s.siteId === site.id && s.employeeId);
    buildSheet(workbook, site, siteEmployees, siteShifts, config);
  }
  return workbook;
}

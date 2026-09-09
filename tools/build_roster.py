"""
Reproduces the HORARIOS layout from ExampleExcel.xlsx, driven by schedule data.

Grid: half-hour columns G..AK = 09:00 .. 00:00 (31 slots).
Each block of 0.5 in the grid is half an hour worked; day totals and weekly
totals are live formulas, exactly as in the source file.
"""
import json
import datetime as dt
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.formatting.rule import CellIsRule
from openpyxl.utils import get_column_letter as gcl

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

GRID_START_COL = 7          # G
GRID_SLOTS = 31             # 09:00 .. 00:00
GRID_START_HOUR = 9.0
COL_TOTAL = 41              # AO  day total
COL_NAME2 = 42              # AP  name repeated beside the total
COL_TASK = 45               # AS  prep task
COL_TASK_HRS = 46           # AT

GREY = "FFD8D8D8"
PEACH = "FFFBE4D5"
PEAK = "FFFF5704"
WHITE = "FFF2F2F2"

# Colours cycled through the roster so each person reads as one colour all week.
PALETTE = [
    "FF00B050", "FF5C77F2", "FF92D050", "FFC06900", "FFE7A6D8",
    "FF4472C4", "FFFFC000", "FF7DD3D8", "FFED7D31", "FFA9D08E",
    "FFB4A7D6", "FF8FAADC", "FFF4B183", "FFC9C9C9", "FFD86DCD",
    "FF6FA8DC", "FFFFD966", "FF76A5AF", "FFE06666", "FF93C47D",
]

thin = Side(style="thin")
BORDER = Border(left=thin, right=thin, top=thin, bottom=thin)


def dark(hexcolor):
    """Pick black or near-white text for a given fill."""
    r, g, b = int(hexcolor[2:4], 16), int(hexcolor[4:6], 16), int(hexcolor[6:8], 16)
    return (0.299 * r + 0.587 * g + 0.114 * b) < 128


def slot_index(hour):
    return int(round((hour - GRID_START_HOUR) * 2))


def build_sheet(wb, site, employees, shifts, peak_slots, first=False):
    ws = wb.active if first else wb.create_sheet()
    ws.title = site["sheet_name"]
    n = len(employees)

    # ---------- column widths ----------
    ws.column_dimensions["A"].width = 2.0
    ws.column_dimensions["B"].width = 5.0
    ws.column_dimensions["C"].width = 18.0
    ws.column_dimensions["D"].width = 8.5
    ws.column_dimensions["E"].width = 2.66
    ws.column_dimensions["F"].width = 2.66
    for c in range(GRID_START_COL, GRID_START_COL + GRID_SLOTS + 1):
        ws.column_dimensions[gcl(c)].width = 2.66
    ws.column_dimensions["AN"].width = 2.5
    ws.column_dimensions["AO"].width = 6.66
    ws.column_dimensions["AP"].width = 21.5
    ws.column_dimensions["AQ"].width = 10.83
    ws.column_dimensions["AR"].width = 4.66
    ws.column_dimensions["AT"].width = 22.66

    # ---------- title ----------
    ws.merge_cells("B1:AK2")
    t = ws["B1"]
    t.value = site["title"]
    t.font = Font(name="Aptos Narrow", size=12, bold=True)
    t.alignment = Alignment(horizontal="center", vertical="center")

    # ---------- roster header ----------
    hdr = Font(name="Calibri", size=9, bold=True)
    hdr_fill = PatternFill("solid", fgColor="FFD9D9D9")
    for rng, label in [
        ("B3:B3", "ID"), ("C3:D3", "OPERARIO"), ("E3:H3", "ESTADO"),
        ("I3:R3", "PUESTO"), ("S3:V3", "CONTRATO"), ("W3:AA3", "CONTACTO"),
        ("AB3:AC3", "H / SEM"), ("AD3:AG3", "DESCUADRE"), ("AH3:AK3", ""),
    ]:
        if ":" in rng and rng.split(":")[0] != rng.split(":")[1]:
            ws.merge_cells(rng)
        c = ws[rng.split(":")[0]]
        c.value = label
        c.font = hdr
        c.fill = hdr_fill
        c.alignment = Alignment(horizontal="right", vertical="center")

    # ---------- roster rows ----------
    first_day_header = n + 7
    day_header_rows = [first_day_header + i * (n + 4) for i in range(7)]
    day_first_emp_rows = [h + 4 for h in day_header_rows]

    for i, e in enumerate(employees):
        r = 4 + i
        colour = PALETTE[i % len(PALETTE)]
        fill = PatternFill("solid", fgColor=colour)
        font = Font(name="Calibri", size=12, bold=True,
                    color=WHITE if dark(colour) else "FF000000")

        ws.cell(row=r, column=2, value=f"#{i + 1}").font = Font(name="Calibri", size=12)
        # the roster row uses the same merged spans as its header
        for a, b in [(3, 4), (5, 8), (9, 18), (19, 22), (23, 27),
                     (28, 29), (30, 32), (36, 37)]:
            ws.merge_cells(start_row=r, start_column=a, end_row=r, end_column=b)
        for col, val in [(3, e["name"]), (5, "Alta"), (9, e["role"]),
                         (19, e["contractHours"]), (23, e.get("contact", ""))]:
            c = ws.cell(row=r, column=col, value=val)
            c.fill = fill
            c.font = font
        # weekly total = sum of this person's row in every day block
        parts = "+".join(f"AO{fr + i}" for fr in day_first_emp_rows)
        wk = ws.cell(row=r, column=28, value=f"={parts}")
        wk.fill = fill
        wk.font = font
        wk.number_format = "0.0"
        ws.cell(row=r, column=30, value=f"=AB{r}-S{r}").number_format = "0.0"
        ws.cell(row=r, column=33, value="h")

    equiv = 4 + n
    ws.merge_cells(f"B{equiv}:AG{equiv + 1}")
    ws[f"B{equiv}"] = "Equivalencia de personal a jornada completa"
    ws[f"B{equiv}"].font = Font(name="Calibri", size=11, bold=True)
    ws.merge_cells(f"AH{equiv}:AK{equiv + 1}")
    ws[f"AH{equiv}"] = f"=SUM(AB4:AC{3 + n})/40"
    ws[f"AH{equiv}"].number_format = "0.00"
    ws.row_dimensions[equiv].height = 16

    # ---------- day blocks ----------
    for d, day in enumerate(DAYS):
        h = day_header_rows[d]
        ws.row_dimensions[h].height = 16

        ws.merge_cells(f"B{h}:C{h + 3}")
        dc = ws[f"B{h}"]
        dc.value = day
        dc.font = Font(name="Calibri", size=20, bold=True, color=WHITE)
        dc.fill = PatternFill("solid", fgColor=PALETTE[d % len(PALETTE)])
        dc.alignment = Alignment(horizontal="center", vertical="center")

        for col in (4, 5, 6):
            ws.merge_cells(start_row=h, start_column=col, end_row=h + 3, end_column=col)
            ws.cell(row=h, column=col).fill = PatternFill("solid", fgColor=GREY)

        for s in range(GRID_SLOTS):
            col = GRID_START_COL + s
            ws.merge_cells(start_row=h, start_column=col, end_row=h + 3, end_column=col)
            c = ws.cell(row=h, column=col)
            mins = int(round((GRID_START_HOUR + s * 0.5) * 60)) % (24 * 60)
            c.value = dt.time(mins // 60, mins % 60)
            c.number_format = "h:mm"
            # 10pt: rotated text is measured against the 2.66-wide column, and 12pt clips to ###
            c.font = Font(name="Calibri", size=10, bold=True)
            c.alignment = Alignment(horizontal="center", textRotation=90, wrap_text=True)
            band = PEAK if s in peak_slots[day] else (
                PEACH if site["open_slots"][day][0] <= s < site["open_slots"][day][1] else GREY)
            c.fill = PatternFill("solid", fgColor=band)

        for i, e in enumerate(employees):
            r = day_first_emp_rows[d] + i
            top = 4 + i
            colour = PALETTE[i % len(PALETTE)]
            fill = PatternFill("solid", fgColor=colour)

            nm = ws.cell(row=r, column=3, value=f"=C{top}")
            nm.fill = fill
            nm.font = Font(name="Calibri", size=12, bold=True,
                           color=WHITE if dark(colour) else "FF000000")
            ws.cell(row=r, column=2, value=f"=B{top}").font = Font(name="Calibri", size=12)

            tot = ws.cell(row=r, column=4, value=f"=AO{r}")
            tot.number_format = "0.0"
            tot.fill = PatternFill("solid", fgColor="FFD9D9D9")
            ws.merge_cells(start_row=r, start_column=5, end_row=r, end_column=6)
            u = ws.cell(row=r, column=5, value="h/dia")
            u.alignment = Alignment(horizontal="center")
            u.fill = PatternFill("solid", fgColor="FFD9D9D9")
            u.font = Font(name="Calibri", size=11)

            for sh in shifts:
                if sh["employeeId"] != e["id"] or sh["day"] != day:
                    continue
                for s in range(slot_index(sh["start"]), slot_index(sh["end"])):
                    if 0 <= s < GRID_SLOTS:
                        c = ws.cell(row=r, column=GRID_START_COL + s, value=0.5)
                        c.fill = fill
                        c.number_format = "0.0"
                        c.font = Font(name="Calibri", size=8, bold=True)
                        c.alignment = Alignment(horizontal="center", vertical="center")
                        c.border = BORDER

            if day in e.get("holidays", []):
                for s in range(*site["open_slots"][day]):
                    c = ws.cell(row=r, column=GRID_START_COL + s, value="v")
                    c.fill = fill
                    c.alignment = Alignment(horizontal="center")
                    c.font = Font(name="Calibri", size=8, bold=True,
                                  color=WHITE if dark(colour) else "FF000000")

            ws.cell(row=r, column=COL_TOTAL, value=f"=SUM(E{r}:AM{r})").number_format = "0.0"
            ws.cell(row=r, column=COL_NAME2, value=f"=C{r}")
            tk = ws.cell(row=r, column=COL_TASK, value=e.get("tasks", {}).get(day, None))
            if tk.value:
                tk.fill = fill
                tk.font = Font(name="Aptos Narrow", size=12)

    for rr in day_header_rows:
        ws.row_dimensions[rr].height = 16
        ws.row_dimensions[rr + 3].height = 17
    green = dict(fill=PatternFill("solid", bgColor="FFC6EFCE"), font=Font(color="FF006100"))
    pink = dict(fill=PatternFill("solid", bgColor="FFFFC7CE"), font=Font(color="FF9C0006"))
    for fr in day_first_emp_rows:
        for col in ("D", "AO"):
            rng = f"{col}{fr}:{col}{fr + n - 1}"
            ws.conditional_formatting.add(rng, CellIsRule(operator="equal", formula=["0"], **pink))
            ws.conditional_formatting.add(rng, CellIsRule(operator="greaterThan", formula=["0"], **green))

    ws.sheet_view.showGridLines = False
    ws.page_setup.orientation = "landscape"
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    return ws


def build(data, out_path):
    wb = openpyxl.Workbook()
    for i, site in enumerate(data["sites"]):
        emps = [e for e in data["employees"] if e["id"] in site["employeeIds"]]
        shifts = [s for s in data["shifts"] if s["siteId"] == site["id"]]
        build_sheet(wb, site, emps, shifts, data["peakSlots"], first=(i == 0))
    wb.save(out_path)
    return out_path


if __name__ == "__main__":
    import sys
    data = json.load(open(sys.argv[1]))
    print(build(data, sys.argv[2]))

import json, math
from build_roster import build, slot_index, DAYS

ROLES = ["server", "dishwasher", "cook", "helper"]
WEEKEND = ["Saturday", "Sunday"]
MIN_SHIFT, MIN_COOK, MAX_SHIFT, MIN_DAYS_OFF = 3, 5, 9, 1

SITES = [
    dict(id="xanadu", title="HORARIOS LAYALI XANADU", sheet_name="Xanadu", pool="madrid"),
    dict(id="raquel", title="HORARIOS LAYALI RAQUEL MELLER", sheet_name="Raquel Meller", pool="madrid"),
    dict(id="mostoles", title="HORARIOS LAYALI MOSTOLES", sheet_name="Mostoles", pool="mostoles"),
]
OPEN, CLOSE = 12.0, 23.0
COVER = {"weekday": dict(server=2, dishwasher=1, cook=1, helper=1),
         "weekend": dict(server=2, dishwasher=2, cook=1, helper=1)}

rows = [
    ("Ana Ruiz","server","xanadu",38,["Monday"]),("Bruno Saez","server","xanadu",38,["Tuesday"]),
    ("Clara Vidal","server","xanadu",32,["Wednesday"]),("Diego Mena","server","raquel",38,["Thursday"]),
    ("Elena Prat","server","raquel",38,["Monday"]),("Fatima Ndiaye","server","raquel",30,["Sunday"]),
    ("Gorka Lizar","server","xanadu",24,["Friday","Saturday"]),("Hugo Beltran","server","raquel",24,["Tuesday","Wednesday"]),
    ("Iker Salas","dishwasher","xanadu",38,["Monday"]),("Julia Ferrer","dishwasher","xanadu",32,["Thursday"]),
    ("Karim Haddad","dishwasher","raquel",38,["Tuesday"]),("Lucia Otero","dishwasher","raquel",30,["Sunday"]),
    ("Marta Gil","cook","xanadu",40,["Monday"]),("Nico Aranda","cook","xanadu",38,["Wednesday"]),
    ("Olga Ferran","cook","raquel",40,["Tuesday"]),("Pau Rovira","cook","raquel",38,["Thursday"]),
    ("Quim Bosch","helper","xanadu",38,["Friday"]),("Rocio Nieto","helper","xanadu",30,["Sunday"]),
    ("Samir Aziz","helper","raquel",38,["Monday"]),("Teresa Lago","helper","raquel",30,["Saturday"]),
    ("Unai Prieto","server","mostoles",38,["Monday"]),("Vera Castro","server","mostoles",38,["Tuesday"]),
    ("Wael Brahim","server","mostoles",32,["Wednesday"]),("Ximena Roldan","server","mostoles",30,["Sunday"]),
    ("Yago Duarte","dishwasher","mostoles",38,["Thursday"]),("Zoe Marin","dishwasher","mostoles",32,["Monday"]),
    ("Alvaro Pinto","dishwasher","mostoles",24,["Friday","Saturday"]),("Berta Ochoa","cook","mostoles",40,["Tuesday"]),
    ("Cristian Vela","cook","mostoles",38,["Wednesday"]),("Dolores Rey","helper","mostoles",38,["Thursday"]),
    ("Emilio Sanz","helper","mostoles",30,["Sunday"]),
]
employees = [dict(id=f"e{i+1}", name=r[0], role=r[1], homeSite=r[2],
                  contractHours=r[3], daysOff=r[4]) for i, r in enumerate(rows)]
pool = {s["id"]: s["pool"] for s in SITES}


def segments(role):
    length = CLOSE - OPEN
    floor = MIN_COOK if role == "cook" else MIN_SHIFT
    n = max(1, min(math.ceil(length / MAX_SHIFT), max(1, int(length // floor))))
    step = length / n
    return [(round((OPEN + i * step) * 4) / 4, round((OPEN + (i + 1) * step) * 4) / 4)
            for i in range(n)]


shifts, sid = [], 0
for site in SITES:
    for day in DAYS:
        cov = COVER["weekend" if day in WEEKEND else "weekday"]
        for role in ROLES:
            for _ in range(cov[role]):
                for a, b in segments(role):
                    shifts.append(dict(id=f"s{sid}", siteId=site["id"], day=day, role=role,
                                       start=a, end=b, hours=b - a, employeeId=None))
                    sid += 1

state = {e["id"]: dict(hours=0.0, byDay={d: [] for d in DAYS}) for e in employees}
order = {d: i for i, d in enumerate(DAYS)}
for sh in sorted(shifts, key=lambda s: (order[s["day"]], s["start"])):
    best, best_score = None, -1e9
    for e in employees:
        if e["role"] != sh["role"] or pool[e["homeSite"]] != pool[sh["siteId"]]:
            continue
        if sh["day"] in e["daysOff"]:
            continue
        st = state[e["id"]]
        today = st["byDay"][sh["day"]]
        if sum(x["hours"] for x in today) + sh["hours"] > MAX_SHIFT:
            continue
        if any(x["start"] < sh["end"] and sh["start"] < x["end"] for x in today):
            continue
        worked = [d for d in DAYS if st["byDay"][d]]
        if not today and len(worked) >= 7 - MIN_DAYS_OFF:
            continue
        rem = e["contractHours"] - st["hours"]
        score = rem + (4 if e["homeSite"] == sh["siteId"] else 0)
        score += -12 if rem < sh["hours"] else 0
        score += 2 if today else 0
        if score > best_score:
            best, best_score = e, score
    if best:
        sh["employeeId"] = best["id"]
        state[best["id"]]["hours"] += sh["hours"]
        state[best["id"]]["byDay"][sh["day"]].append(sh)

open_slots = {d: (slot_index(OPEN), slot_index(CLOSE)) for d in DAYS}
peak = {d: [slot_index(14.5), slot_index(15.0), slot_index(20.5), slot_index(21.0)] for d in DAYS}

for s in SITES:
    s["open_slots"] = open_slots
    s["employeeIds"] = [e["id"] for e in employees
                        if e["homeSite"] == s["id"]
                        or any(x["siteId"] == s["id"] and x["employeeId"] == e["id"] for x in shifts)]

data = dict(sites=SITES, employees=employees, shifts=[s for s in shifts if s["employeeId"]],
            peakSlots=peak)
json.dump(data, open("sample.json", "w"), indent=1)
print(build(data, "/mnt/user-data/outputs/Horarios-semana.xlsx"))
unfilled = sum(1 for s in shifts if not s["employeeId"])
print("shifts:", len(shifts), "unfilled:", unfilled)

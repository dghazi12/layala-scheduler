/* ------------------------------------------------------------------ */
/* Domain constants                                                    */
/* ------------------------------------------------------------------ */

export const SITES = [
  { id: "xanadu", name: "Xanadu", siblings: ["raquel"] },
  { id: "raquel", name: "Raquel Meller", siblings: ["xanadu"] },
  { id: "mostoles", name: "Móstoles", siblings: [] },
];

export const ROLES = [
  { id: "server", label: "Server", plural: "Servers" },
  { id: "dishwasher", label: "Dishwasher", plural: "Dishwashers" },
  { id: "cook", label: "Cook", plural: "Cooks" },
  { id: "helper", label: "Helper", plural: "Helpers" },
];

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const WEEKEND = ["Sat", "Sun"];

export const RULES = {
  minShift: 3,
  minCookShift: 5,
  maxShift: 9,
  minDaysOff: 1,
};

export const DEFAULT_SITE_CONFIG = {
  weekday: { open: "12:00", close: "23:00", server: 2, dishwasher: 1, cook: 1, helper: 1 },
  weekend: { open: "12:00", close: "23:00", server: 2, dishwasher: 2, cook: 1, helper: 1 },
};

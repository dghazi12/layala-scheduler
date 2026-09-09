import { SITES, DEFAULT_SITE_CONFIG } from "./constants";

/* ------------------------------------------------------------------ */
/* Seed roster                                                         */
/* ------------------------------------------------------------------ */

const seedRows = [
  // [name, role, homeSite, targetHours, daysOff]
  ["Ana Ruiz", "server", "xanadu", 38, ["Mon"]],
  ["Bruno Sáez", "server", "xanadu", 38, ["Tue"]],
  ["Clara Vidal", "server", "xanadu", 32, ["Wed"]],
  ["Diego Mena", "server", "raquel", 38, ["Thu"]],
  ["Elena Prat", "server", "raquel", 38, ["Mon"]],
  ["Fátima Ndiaye", "server", "raquel", 30, ["Sun"]],
  ["Gorka Lizar", "server", "xanadu", 24, ["Fri", "Sat"]],
  ["Hugo Beltrán", "server", "raquel", 24, ["Tue", "Wed"]],
  ["Iker Salas", "dishwasher", "xanadu", 38, ["Mon"]],
  ["Julia Ferrer", "dishwasher", "xanadu", 32, ["Thu"]],
  ["Karim Haddad", "dishwasher", "raquel", 38, ["Tue"]],
  ["Lucía Otero", "dishwasher", "raquel", 30, ["Sun"]],
  ["Marta Gil", "cook", "xanadu", 40, ["Mon"]],
  ["Nico Aranda", "cook", "xanadu", 38, ["Wed"]],
  ["Olga Ferrán", "cook", "raquel", 40, ["Tue"]],
  ["Pau Rovira", "cook", "raquel", 38, ["Thu"]],
  ["Quim Bosch", "helper", "xanadu", 38, ["Fri"]],
  ["Rocío Nieto", "helper", "xanadu", 30, ["Sun"]],
  ["Samir Aziz", "helper", "raquel", 38, ["Mon"]],
  ["Teresa Lago", "helper", "raquel", 30, ["Sat"]],
  ["Unai Prieto", "server", "mostoles", 38, ["Mon"]],
  ["Vera Castro", "server", "mostoles", 38, ["Tue"]],
  ["Wael Brahim", "server", "mostoles", 32, ["Wed"]],
  ["Ximena Roldán", "server", "mostoles", 30, ["Sun"]],
  ["Yago Duarte", "dishwasher", "mostoles", 38, ["Thu"]],
  ["Zoe Marín", "dishwasher", "mostoles", 32, ["Mon"]],
  ["Álvaro Pinto", "dishwasher", "mostoles", 24, ["Fri", "Sat"]],
  ["Berta Ochoa", "cook", "mostoles", 40, ["Tue"]],
  ["Cristian Vela", "cook", "mostoles", 38, ["Wed"]],
  ["Dolores Rey", "helper", "mostoles", 38, ["Thu"]],
  ["Emilio Sanz", "helper", "mostoles", 30, ["Sun"]],
];

export const seedEmployees = () =>
  seedRows.map((r, i) => ({
    id: `e${i + 1}`,
    name: r[0],
    role: r[1],
    homeSite: r[2],
    targetHours: r[3],
    daysOff: r[4],
  }));

export const seedConfig = () =>
  Object.fromEntries(
    SITES.map((s) => [s.id, JSON.parse(JSON.stringify(DEFAULT_SITE_CONFIG))])
  );

/**
 * The artifact runtime provides window.storage (a server-side key-value store).
 * Running locally there is no such thing, so this stands in for it using
 * localStorage. Same shape, so App.jsx needs no changes and still works in both
 * places. Swap the four functions for fetch() calls when you move to a real API.
 */
const KEY_PREFIX = "shift-planner:";

if (!window.storage) {
  window.storage = {
    async get(key) {
      const raw = localStorage.getItem(KEY_PREFIX + key);
      if (raw === null) throw new Error(`No value stored for "${key}"`);
      return { key, value: raw, shared: false };
    },
    async set(key, value) {
      localStorage.setItem(KEY_PREFIX + key, value);
      return { key, value, shared: false };
    },
    async delete(key) {
      localStorage.removeItem(KEY_PREFIX + key);
      return { key, deleted: true, shared: false };
    },
    async list(prefix = "") {
      const keys = Object.keys(localStorage)
        .filter((k) => k.startsWith(KEY_PREFIX + prefix))
        .map((k) => k.slice(KEY_PREFIX.length));
      return { keys, prefix, shared: false };
    },
  };
}

/**
 * Backs window.storage with Supabase Postgres instead of localStorage, so the
 * roster is shared across every browser instead of stuck on one machine. Same
 * get/set/list/delete shape as before, so App.jsx needs no changes.
 *
 * Requires a `kv_store` table — see supabase/schema.sql — and
 * VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env (see .env.example).
 */
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill in your Supabase project's values."
  );
}

const supabase = createClient(url, anonKey);

if (!window.storage) {
  window.storage = {
    async get(key) {
      const { data, error } = await supabase
        .from("kv_store")
        .select("value")
        .eq("key", key)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error(`No value stored for "${key}"`);
      return { key, value: data.value, shared: true };
    },
    async set(key, value) {
      const { error } = await supabase
        .from("kv_store")
        .upsert({ key, value, updated_at: new Date().toISOString() });
      if (error) throw error;
      return { key, value, shared: true };
    },
    async delete(key) {
      const { error } = await supabase.from("kv_store").delete().eq("key", key);
      if (error) throw error;
      return { key, deleted: true, shared: true };
    },
    async list(prefix = "") {
      const { data, error } = await supabase
        .from("kv_store")
        .select("key")
        .like("key", `${prefix}%`);
      if (error) throw error;
      return { keys: data.map((row) => row.key), prefix, shared: true };
    },
  };
}

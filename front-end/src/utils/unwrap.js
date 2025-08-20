// Robustly unwrap common API envelope shapes into a plain array/object.
export function unwrap(json) {
  if (!json) return null;
  if (Array.isArray(json)) return json;

  // Try common keys in order of likelihood
  const candidates = [
    json.data,
    json.payload,
    json.result,
    json.items,
    json.response,
  ];

  for (const c of candidates) {
    if (Array.isArray(c) || (c && typeof c === "object")) return c;
  }

  // Some endpoints do { success, data } or { success, data: { data: [...] } }
  if (json.data && json.data.data) return json.data.data;

  // Fallback: return the original
  return json;
}

export function asArray(x) {
  if (!x) return [];
  if (Array.isArray(x)) return x;
  // Some APIs return { list: [...] } or { results: [...] }
  if (Array.isArray(x.list)) return x.list;
  if (Array.isArray(x.results)) return x.results;
  if (Array.isArray(x.items)) return x.items;
  return [];
}

// ID & number helpers (handle strings, {$oid}, nested)
export function idOf(v) {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (typeof v === "object") {
    if (v.$oid) return v.$oid;
    if (v._id) return idOf(v._id);
    if (v.id) return idOf(v.id);
  }
  return String(v);
}

export function num(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

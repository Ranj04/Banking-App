export const isHex24 = (s) => typeof s === "string" && /^[0-9a-fA-F]{24}$/.test(s);
export const oid = (v) => {
  if (!v) return null;
  if (typeof v === "string" && isHex24(v)) return v;
  if (typeof v === "object") {
    if (isHex24(v.$oid)) return v.$oid;
    if (isHex24(v._id))  return v._id;
    if (v._id && isHex24(v._id.$oid)) return v._id.$oid;
    if (isHex24(v.id)) return v.id;
  }
  return null;
};
export const num = (v, d=0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

// Shared ID normalizer to handle various backend ID shapes (id, _id.$oid, _id, or plain string)
export function idOf(obj) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (obj.id) return obj.id;
  if (obj._id) {
    if (typeof obj._id === 'string') return obj._id;
    if (obj._id.$oid) return obj._id.$oid;
  }
  // Fallback: try common nested shapes
  if (obj.goalId) return obj.goalId;
  return '';
}

export default idOf;

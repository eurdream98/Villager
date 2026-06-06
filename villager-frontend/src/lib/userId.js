/** Supabase user.id ↔ API UUID 비교 (대소문자·타입 차이 허용) */
export function isSameUser(a, b) {
  if (a == null || b == null) return false;
  return String(a).toLowerCase() === String(b).toLowerCase();
}

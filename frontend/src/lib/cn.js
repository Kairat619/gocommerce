/**
 * Join class names, dropping anything falsy.
 *
 * Deliberately tiny — it exists so components can accept a `className`
 * passthrough without every call site growing a template literal and a
 * trailing space. It does NOT merge conflicting Tailwind utilities; keep
 * variant class strings mutually exclusive instead.
 */
export default function cn(...parts) {
  return parts.filter(Boolean).join(" ");
}

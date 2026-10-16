const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
  'bg-teal-100 text-teal-700',
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
  'bg-indigo-100 text-indigo-700',
]

/** Color de avatar determinista por nombre (mismo nombre -> mismo color). */
export function avatarColor(nombre: string): string {
  let hash = 0
  // `for...of` itera por code points: codePointAt(0) nunca es undefined aqui.
  for (const ch of nombre) hash = (hash * 31 + (ch.codePointAt(0) as number)) & 0xffff
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

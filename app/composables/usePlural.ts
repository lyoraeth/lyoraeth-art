function ruPlural(n: number): 'one' | 'few' | 'many' {
  const mod10  = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'one'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 > 20)) return 'few'
  return 'many'
}

// No 'few' in English CLDR pluralization — the return type says so, unlike
// ruPlural's, so a `_few` locale key under an English string never typechecks
// as reachable (removed the three that existed but couldn't be).
function enPlural(n: number): 'one' | 'many' {
  return n === 1 ? 'one' : 'many'
}

/** Returns a reactive function that picks the CLDR plural suffix for the active locale. */
export function usePlural() {
  const { locale } = useI18n()
  return (n: number) => locale.value === 'ru' ? ruPlural(n) : enPlural(n)
}

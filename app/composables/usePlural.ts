function ruPlural(n: number): 'one' | 'few' | 'many' {
  const mod10  = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'one'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 > 20)) return 'few'
  return 'many'
}

function enPlural(n: number): 'one' | 'few' | 'many' {
  return n === 1 ? 'one' : 'many'
}

/** Returns a reactive function that picks the CLDR plural suffix for the active locale. */
export function usePlural() {
  const { locale } = useI18n()
  return (n: number) => locale.value === 'ru' ? ruPlural(n) : enPlural(n)
}

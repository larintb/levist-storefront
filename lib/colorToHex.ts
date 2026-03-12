const keywords: [string, string][] = [
  // Whites / off-whites
  ['white', '#F5F5F5'], ['blanco', '#F5F5F5'], ['ivory', '#FFFFF0'], ['cream', '#FFFDD0'],
  ['off white', '#FAF9F6'], ['snow', '#FFFAFA'],
  // Blacks / darks
  ['black', '#111111'], ['negro', '#111111'], ['onyx', '#353935'], ['jet', '#111111'],
  // Grays
  ['charcoal', '#374151'], ['graphite', '#4B5563'], ['pewter', '#9CA3AF'],
  ['silver', '#C0C0C0'], ['heather', '#B0A8B9'],
  ['grey', '#9CA3AF'], ['gray', '#9CA3AF'], ['gris', '#9CA3AF'],
  // Blues
  ['royal', '#002B5B'], ['navy', '#1E3A5F'], ['marino', '#1E3A5F'],
  ['caribbean', '#0097A7'], ['ceil', '#92A8C8'], ['ciel', '#92A8C8'],
  ['cobalt', '#0047AB'], ['steel blue', '#4682B4'], ['sky', '#87CEEB'],
  ['denim', '#1560BD'], ['ocean', '#006994'], ['peacock', '#005F6A'],
  ['azul', '#1D4ED8'], ['blue', '#1D4ED8'],
  // Greens
  ['hunter', '#355E3B'], ['forest', '#228B22'], ['sage', '#8F9779'],
  ['mint', '#98FF98'], ['lime', '#32CD32'], ['olive', '#6B7C45'],
  ['jade', '#00A36C'], ['teal', '#0D9488'], ['turquesa', '#0D9488'], ['turquoise', '#0D9488'],
  ['emerald', '#50C878'], ['verde', '#15803D'], ['green', '#15803D'],
  // Reds
  ['burgundy', '#6D1A36'], ['wine', '#722F37'], ['crimson', '#DC143C'],
  ['brick', '#CB4154'], ['maroon', '#800000'], ['oxblood', '#800020'],
  ['rojo', '#DC2626'], ['red', '#DC2626'],
  // Pinks
  ['berry', '#8B1A4A'], ['mauve', '#E0B0FF'], ['blush', '#FFB6C1'],
  ['hot pink', '#FF69B4'], ['fuchsia', '#FF00FF'], ['magenta', '#FF00AF'],
  ['coral', '#FF6B6B'], ['rosa', '#EC4899'], ['pink', '#EC4899'],
  // Purples
  ['plum', '#673264'], ['grape', '#6F2DA8'], ['violet', '#7F00FF'],
  ['lavender', '#E6E6FA'], ['lilac', '#C8A2C8'],
  ['morado', '#7C3AED'], ['purple', '#7C3AED'], ['indigo', '#4338CA'],
  // Oranges / Yellows
  ['amber', '#FFBF00'], ['gold', '#FFD700'], ['mustard', '#FFDB58'],
  ['amarillo', '#EAB308'], ['yellow', '#EAB308'],
  ['naranja', '#F97316'], ['orange', '#F97316'],
  ['peach', '#FFDAB9'], ['melon', '#FDBCB4'],
  // Browns / Earth
  ['chocolate', '#7B3F00'], ['espresso', '#4B2808'], ['mocha', '#967259'],
  ['tan', '#D2B48C'], ['camel', '#C19A6B'], ['khaki', '#C3AD83'],
  ['beige', '#D4B896'], ['latte', '#C9A87C'], ['sand', '#C2B280'],
  ['cafe', '#92400E'], ['brown', '#92400E'], ['taupe', '#B5A895'],
  // Teals / Aquas
  ['aqua', '#00FFFF'], ['cyan', '#00BCD4'], ['pool', '#45B5C4'],
  ['seafoam', '#71EEB8'], ['lagoon', '#00B5EC'],
]

export function colorToHex(color: string): string {
  const lower = color.toLowerCase().trim()
  for (const [kw, hex] of keywords) {
    if (lower === kw) return hex
  }
  for (const [kw, hex] of keywords) {
    if (lower.includes(kw)) return hex
  }
  // Deterministic fallback hue from color name
  let hash = 0
  for (let i = 0; i < color.length; i++) hash = color.charCodeAt(i) + ((hash << 5) - hash)
  return `hsl(${Math.abs(hash) % 360}, 55%, 55%)`
}

// Deterministic seeded shuffle so the projector (Present) and every phone (Join)
// render the SAME option order for a given game+question, while the correct answer
// lands in an unpredictable slot (never "always first"). Order varies per game.
function hashStr(s) {
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export function shuffledOptions(options, seed) {
  const rnd = mulberry32(hashStr(String(seed)))
  const a = options.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    const t = a[i]; a[i] = a[j]; a[j] = t
  }
  return a
}

// Category-aware "spread" shuffle for the Spot-the-Canadian boards.
// Pure random can clump all Canadians on one side; this evenly distributes the
// smaller group (Canadians or decoys) across the row with a seeded rotation, so
// they are never all bunched together, yet the exact slots still vary per board.
export function spreadShuffle(options, seed) {
  const rnd = mulberry32(hashStr(String(seed)))
  const shuf = (arr) => {
    const a = arr.slice()
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t }
    return a
  }
  const yes = shuf(options.filter(o => o.isCanadian))
  const no = shuf(options.filter(o => !o.isCanadian))
  const n = options.length
  if (!yes.length || !no.length) return shuf(options)
  const minorityIsYes = yes.length <= no.length
  const minority = minorityIsYes ? yes : no
  const majority = minorityIsYes ? no : yes
  const k = minority.length
  const offset = Math.floor(rnd() * n)
  const slots = new Set()
  if (n === 4 && k === 2) {
    // diagonal pair spreads well on both the 4-across projector and the 2x2 phone grid
    const pair = offset % 2 === 0 ? [0, 3] : [1, 2]
    pair.forEach(x => slots.add(x))
  } else if (n === 4 && k === 1) {
    slots.add(offset % 4)
  } else {
    for (let i = 0; i < k; i++) slots.add((Math.round((i + 0.5) * n / k) + offset) % n)
    let fill = 0
    while (slots.size < k) { if (!slots.has(fill)) slots.add(fill); fill++ }
  }
  const out = new Array(n); let mi = 0, ma = 0
  for (let p = 0; p < n; p++) out[p] = slots.has(p) ? minority[mi++] : majority[ma++]
  return out
}

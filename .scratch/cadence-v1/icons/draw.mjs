// Draws the icon drafts: the day ring, gold on #0F1113. Run: node draw.mjs
import { writeFileSync } from 'node:fs'

const S = 1024, C = S / 2, VOID = '#0F1113', GOLD = '#D4AF37', DIM = '#5E5126', LINE = '#262A30'
// Q4 2026: 92 days; month starts at 0 (1 Oct), 31 (1 Nov), 61 (1 Dec)
const monthStarts = new Set([0, 31, 61])

function ring({ count, outer, len, monthLen, width, colour, today, todayLen, todayWidth }) {
  const lines = []
  for (let i = 0; i < count; i++) {
    const a = (i / count) * 2 * Math.PI - Math.PI / 2
    const isToday = i === today
    const l = isToday ? todayLen : monthStarts.has(i) && monthLen ? monthLen : len
    const r1 = outer, r2 = outer - l
    const f = n => n.toFixed(1)
    lines.push(`<line x1="${f(C + r1 * Math.cos(a))}" y1="${f(C + r1 * Math.sin(a))}" x2="${f(C + r2 * Math.cos(a))}" y2="${f(C + r2 * Math.sin(a))}" stroke="${colour(i)}" stroke-width="${isToday ? todayWidth : width}" stroke-linecap="round"/>`)
  }
  return lines.join('\n  ')
}
const svg = body => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}">\n  <rect width="${S}" height="${S}" fill="${VOID}"/>\n  ${body}\n</svg>\n`

// A: the Quarter in progress, as on Today: passed Days dim gold, today gold, the rest faint
writeFileSync('a-in-progress.svg', svg(ring({
  count: 92, outer: 400, len: 70, monthLen: 120, width: 11,
  today: 42, todayLen: 170, todayWidth: 22,
  colour: i => i === 42 ? GOLD : i < 42 ? DIM : LINE,
})))

// B: the whole ring in gold, month starts longer; no today
writeFileSync('b-all-gold.svg', svg(ring({
  count: 92, outer: 400, len: 80, monthLen: 150, width: 12,
  today: -1, todayLen: 0, todayWidth: 0,
  colour: () => GOLD,
})))

// C: the whole ring in dim gold, with one bright tick for today at the top
writeFileSync('c-today-on-top.svg', svg(ring({
  count: 92, outer: 400, len: 80, monthLen: 80, width: 12,
  today: 0, todayLen: 190, todayWidth: 26,
  colour: i => i === 0 ? GOLD : DIM,
})))

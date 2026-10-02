// @vitest-environment node
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { overriddenClock } from './dateOverride'

/** The phone's real clock, which a test moves on by hand */
function realClock(start: string) {
  let at = new Date(start).getTime()
  return { clock: () => new Date(at), wait: (minutes: number) => (at += minutes * 60_000) }
}

const local = (date: Date) => date.toLocaleString('sv-SE') // "2026-12-20 09:15:30"

describe('the dev-only date override (spec §15.2)', () => {
  it('starts on the date ?today= names, at the real time of day, and runs on from there', () => {
    const real = realClock('2026-10-02T09:15:30')
    const clock = overriddenClock('?today=2026-12-20', real.clock)
    expect(local(clock())).toBe('2026-12-20 09:15:30')
    real.wait(60)
    expect(local(clock())).toBe('2026-12-20 10:15:30')
  })

  it('starts at the moment ?today= names, so a midnight can be walked through', () => {
    const real = realClock('2026-10-02T09:15:30')
    const clock = overriddenClock('?today=2026-12-31T23:58', real.clock)
    expect(local(clock())).toBe('2026-12-31 23:58:00')
    real.wait(3)
    expect(local(clock())).toBe('2027-01-01 00:01:00')
  })
  it.each(['', '?look=dark', '?today=', '?today=tomorrow', '?today=2026-02-30', '?today=2026-12-31T24:00', '?today=2026-12-31T9:58'])(
    'keeps the real clock for "%s"',
    (search) => {
      const real = realClock('2026-10-02T09:15:30')
      expect(local(overriddenClock(search, real.clock)())).toBe('2026-10-02 09:15:30')
    },
  )
})

describe('a production build', () => {
  /** Cadence's JavaScript as `vite build` bundles it, with NODE_ENV as given */
  function bundle(nodeEnv: 'production' | 'development'): string {
    const out = mkdtempSync(join(tmpdir(), 'cadence-build-'))
    try {
      execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--outDir', out, '--logLevel', 'silent'], {
        env: { ...process.env, NODE_ENV: nodeEnv },
      })
      const assets = join(out, 'assets')
      return readdirSync(assets)
        .filter((name) => name.endsWith('.js'))
        .map((name) => readFileSync(join(assets, name), 'utf8'))
        .join('\n')
    } finally {
      rmSync(out, { recursive: true, force: true })
    }
  }

  it('leaves the date override out, where a dev build keeps it', () => {
    // The override reads ?today= with URLSearchParams, which nothing else in Cadence uses
    expect(bundle('development').includes('URLSearchParams'), 'a dev build reads ?today=').toBe(true)
    expect(bundle('production').includes('URLSearchParams'), 'a production build reads ?today=').toBe(false)
  }, 60_000)
})

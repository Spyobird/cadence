// @vitest-environment node
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildStamp } from './build-stamp.ts'

describe('buildStamp', () => {
  it('reads "dev" outside a git repository', () => {
    const notARepo = mkdtempSync(join(tmpdir(), 'cadence-stamp-'))
    expect(buildStamp(notARepo)).toBe('dev')
  })

  it('reads "dev" when git is not installed', () => {
    expect(buildStamp(process.cwd(), 'git-that-does-not-exist')).toBe('dev')
  })

  it('describes the commit inside the repository', () => {
    expect(buildStamp(process.cwd())).toMatch(/^(v\d.*|[0-9a-f]{7,})(-dirty)?$/)
  })
})

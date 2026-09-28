import { execFileSync } from 'node:child_process'

/**
 * What the build calls itself: `git describe --tags --always --dirty`,
 * e.g. "3f2c1a9", "v1.0.0", "v1.0.0-4-g3f2c1a9" or "3f2c1a9-dirty".
 * "dev" when git or the repository isn't there.
 */
export function buildStamp(cwd = process.cwd(), git = 'git'): string {
  try {
    return execFileSync(git, ['describe', '--tags', '--always', '--dirty'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return 'dev'
  }
}

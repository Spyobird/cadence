// When the last backup was, in words: the menu's Backup row and the Backup screen (spec §6.3, §12.1)

import { type LocalDate, shortDate, sinceBackup } from '../lib/quarters'

export function lastBackupWords(lastBackupAt: number | null, today: LocalDate) {
  const last = sinceBackup(lastBackupAt, today)
  if (!last) return { menu: 'Never', screen: 'No backup yet' }
  const ago = last.days === 0 ? 'today' : last.days === 1 ? 'yesterday' : `${last.days} days ago`
  return {
    /** "Never", "Today", "Yesterday" or "3 days ago" */
    menu: ago[0]!.toUpperCase() + ago.slice(1),
    /** "Last backup: Mon 12 Oct, 3 days ago", with the year when it isn't this year's */
    screen: `Last backup: ${shortDate(last.on, !last.thisYear)}, ${ago}`,
  }
}

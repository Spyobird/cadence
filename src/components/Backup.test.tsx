import 'fake-indexeddb/auto'
import { render, screen, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from '../App'
import { open, type QuestContent } from '../lib/store'
import { aMomentLater, pretendNoShareSheet, pretendOpened, pretendShareSheet, pretendStorage } from '../test/phone'

let now: Date
/** Sets the phone's clock, in local time: "2026-11-12T10:00" */
const itIs = (when: string) => {
  now = new Date(when)
}

const work: QuestContent = {
  mainQuest: 'ship the redesigned onboarding flow',
  whyItMatters: 'stop us losing a third of new sign-ups',
  successMetrics: ['the new onboarding live for every sign-up'],
  whyItsExciting: "it's the first project I've led end to end",
  obstacle: '',
  commitments: ['Two hours of deep work every Monday morning'],
}
const life: QuestContent = { ...work, mainQuest: 'run 5K in under 25 minutes' }

/** Q4 2026 set up on 29 Sep, as the owner did */
async function setUpQ4() {
  const store = await open(() => new Date('2026-09-29T10:00'))
  await store.finishQuest('2026-Q4', 'work', work)
  await store.finishQuest('2026-Q4', 'life', life)
}

/** Opens Cadence as the phone would: the real app over the real store */
async function launch() {
  return render(<App store={await open(() => now)} />)
}

/** Opens the menu on Today, then the Backup screen from it */
async function openBackup() {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Menu' }))
  await user.click(within(screen.getByRole('dialog', { name: 'Menu' })).getByRole('button', { name: /^Backup/ }))
  return user
}

beforeEach(async () => {
  indexedDB = new IDBFactory()
  pretendOpened('home screen (iOS)')
  pretendStorage(true)
  itIs('2026-11-12T10:00')
  await setUpQ4()
})

describe('the Backup screen', () => {
  it('is reached from the menu, says there is no backup yet and the storage is kept, and goes back to Today', async () => {
    await launch()
    const user = await openBackup()

    expect(screen.getByRole('heading', { name: 'Backup' })).toBeInTheDocument()
    expect(screen.getByText('No backup yet')).toBeInTheDocument()
    expect(await screen.findByText('On this iPhone, marked persistent')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Export backup' })).toBeInTheDocument()
    expect(screen.getByLabelText('Import a backup')).toHaveAttribute('type', 'file')
    expect(
      screen.getByText('Export before deleting Cadence from your Home Screen. Deleting the icon erases everything in it.'),
    ).toBeInTheDocument()
    expect(screen.getByText(/^Build \S+$/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Today' }))
    expect(screen.getByRole('img', { name: 'Day 43 of 92' })).toBeInTheDocument()
  })

  it("says when the iPhone hasn't marked the storage persistent", async () => {
    pretendStorage(false)
    await launch()
    await openBackup()
    const line = 'On this iPhone, not marked persistent, so iOS could clear it to free up space'
    expect(await screen.findByText(line)).toBeInTheDocument()
  })

  it('warns that a Safari tab keeps its own copy, which Safari can erase', async () => {
    pretendOpened('safari tab')
    await launch()
    await openBackup()
    const warning = 'In a Safari tab, what you write is kept by Safari, apart from the Home Screen app, and Safari can erase it.'
    expect(screen.getAllByText(warning)).toHaveLength(2) // the banner's, and the storage line
    expect(screen.queryByText(/marked persistent/)).not.toBeInTheDocument()
  })
})

describe('Export', () => {
  it('hands the Backup to the share sheet, and once it is saved to Files, the backup counts as made', async () => {
    const shared = pretendShareSheet('saved to Files')
    await launch()
    const user = await openBackup()
    await user.click(screen.getByRole('button', { name: 'Export backup' }))
    await aMomentLater()

    expect(shared.map((file) => file.name)).toEqual(['cadence-backup-2026-11-12.json'])
    expect(JSON.parse(await shared[0]!.text())).toMatchObject({ app: 'cadence', data: { 'quarter:2026-Q4': {} } })
    expect(screen.getByText('Last backup: Thu 12 Nov, today')).toBeInTheDocument()
  })

  it("downloads the Backup where the share sheet can't take files, and counts it once the download starts", async () => {
    const browser = pretendNoShareSheet()
    try {
      await launch()
      const user = await openBackup()
      await user.click(screen.getByRole('button', { name: 'Export backup' }))
      await aMomentLater()

      expect(browser.downloaded).toEqual(['cadence-backup-2026-11-12.json'])
      expect(screen.getByText('Last backup: Thu 12 Nov, today')).toBeInTheDocument()
    } finally {
      browser.restore()
    }
  })

  it("doesn't count a share that was cancelled", async () => {
    pretendShareSheet('cancelled')
    await launch()
    const user = await openBackup()
    await user.click(screen.getByRole('button', { name: 'Export backup' }))
    await aMomentLater()

    expect(screen.getByText('No backup yet')).toBeInTheDocument()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })
})

/** A Backup exported on Mon 12 Oct 2026: Q4 2026 set up, with one Reflection, the Work Quest's Main Quest this */
function backupFrom12Oct(mainQuest = 'ship the onboarding flow by November') {
  const data = {
    meta: { schemaVersion: 1, lastBackupAt: null, appearance: 'system' },
    'quarter:2026-Q4': {
      versions: { work: [{ savedOn: '2026-09-29', content: { ...work, mainQuest } }], life: [{ savedOn: '2026-09-29', content: life }] },
      reflections: { '2026-10-12': { work: { text: 'Drew the first screens', prompt: 'What is the one thing?' } } },
    },
  }
  const backup = { app: 'cadence', schemaVersion: 1, exportedAt: new Date('2026-10-12T20:00').getTime(), data }
  return new File([JSON.stringify(backup)], 'cadence-backup-2026-10-12.json', { type: 'application/json' })
}

describe('Import', () => {
  it("says so when the file picked isn't a Cadence backup, and changes nothing", async () => {
    await launch()
    const user = await openBackup()
    await user.upload(screen.getByLabelText('Import a backup'), new File(['Buy milk'], 'notes.txt', { type: 'text/plain' }))

    expect(await screen.findByText("This isn't a Cadence backup.")).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  /** Picks the 12 Oct backup in the Files picker, and returns its preview */
  async function pickBackup(user: UserEvent) {
    await user.upload(screen.getByLabelText('Import a backup'), backupFrom12Oct())
    return within(await screen.findByRole('dialog', { name: 'Replace everything with this backup?' }))
  }

  /** Leaves the Backup screen for Today, and returns the Work page's Main Quest */
  async function workOnToday(user: UserEvent) {
    await user.click(screen.getByRole('button', { name: 'Today' }))
    return within(screen.getByRole('tabpanel', { name: 'Work' })).getByRole('heading', { level: 2 }).textContent
  }

  it('previews the backup: when it was made, its Quarters and its Reflections', async () => {
    await launch()
    const user = await openBackup()
    const preview = await pickBackup(user)
    expect(preview.getByText('Backup from Mon 12 Oct 2026 · Q4 2026 · 1 Reflection')).toBeInTheDocument()
    expect(preview.getAllByRole('button').map((button) => button.textContent)).toEqual([
      "Export what's here first",
      'Replace everything',
      "Keep what's here",
    ])
  })

  it("keeps what's here", async () => {
    await launch()
    const user = await openBackup()
    await user.click((await pickBackup(user)).getByRole('button', { name: "Keep what's here" }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('No backup yet')).toBeInTheDocument()
    expect(await workOnToday(user)).toBe(work.mainQuest)
  })

  it('replaces everything with the backup, dated by its export', async () => {
    await launch()
    const user = await openBackup()
    await user.click((await pickBackup(user)).getByRole('button', { name: 'Replace everything' }))

    expect(await screen.findByText('Last backup: Mon 12 Oct, 31 days ago')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(await workOnToday(user)).toBe('ship the onboarding flow by November')
  })

  it("exports what's here first, then comes back to the choice", async () => {
    const shared = pretendShareSheet('saved to Files')
    await launch()
    const user = await openBackup()
    await user.click((await pickBackup(user)).getByRole('button', { name: "Export what's here first" }))
    await aMomentLater()

    expect(JSON.parse(await shared[0]!.text()).data['quarter:2026-Q4'].versions.work[0].content).toEqual(work)
    expect(screen.getByText('Last backup: Thu 12 Nov, today')).toBeInTheDocument()
    const preview = within(screen.getByRole('dialog', { name: 'Replace everything with this backup?' }))
    await user.click(preview.getByRole('button', { name: 'Replace everything' }))
    expect(await workOnToday(user)).toBe('ship the onboarding flow by November')
  })
})

describe('a backup due (spec §6.3)', () => {
  /** A backup made at this local time, before Cadence is opened */
  async function backedUpAt(when: string) {
    await (await open(() => new Date(when))).markBackedUp()
  }

  /** The menu button, and the menu's Backup row */
  async function menu() {
    const button = screen.getByRole('button', { name: 'Menu' })
    await userEvent.click(button)
    const row = within(screen.getByRole('dialog', { name: 'Menu' })).getByRole('button', { name: /^Backup/ })
    return { button, row, time: row.lastElementChild! }
  }

  it('shows a gold dot on the menu button, and the Backup row reads "Never" in gold, before any backup', async () => {
    await launch()
    const { button, row, time } = await menu()
    expect(button).toHaveAccessibleDescription('A backup is due')
    expect(row).toHaveTextContent(/^BackupNever$/)
    expect(time).toHaveClass('text-gold-text')
  })

  it('is not due 3 days after a backup, and says when it was', async () => {
    await backedUpAt('2026-11-09T20:00')
    await launch()
    const { button, row, time } = await menu()
    expect(button).not.toHaveAccessibleDescription()
    expect(row).toHaveTextContent(/^Backup3 days ago$/)
    expect(time).toHaveClass('text-faint')
  })

  it('is due again 7 days after it', async () => {
    await backedUpAt('2026-11-05T09:00')
    await launch()
    const { button, row, time } = await menu()
    expect(button).toHaveAccessibleDescription('A backup is due')
    expect(row).toHaveTextContent(/^Backup7 days ago$/)
    expect(time).toHaveClass('text-gold-text')
  })

  it('is no longer due once a backup is exported', async () => {
    pretendShareSheet('saved to Files')
    await launch()
    const user = await openBackup()
    await user.click(screen.getByRole('button', { name: 'Export backup' }))
    await aMomentLater()
    await user.click(screen.getByRole('button', { name: 'Today' }))

    const { button, row } = await menu()
    expect(button).not.toHaveAccessibleDescription()
    expect(row).toHaveTextContent(/^BackupToday$/)
  })
})

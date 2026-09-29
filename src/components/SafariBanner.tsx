/** Why a Safari tab is no place for real data (spec §2.7): the banner says it, and so does the Backup screen */
export const SAFARI_TAB_RISK =
  'In a Safari tab, what you write is kept by Safari, apart from the Home Screen app, and Safari can erase it.'

export function SafariBanner() {
  return (
    <div role="alert" className="bg-danger text-on-danger px-gutter py-3">
      <p className="text-m font-semibold">Open Cadence from your Home Screen</p>
      <p className="text-s">{SAFARI_TAB_RISK}</p>
    </div>
  )
}

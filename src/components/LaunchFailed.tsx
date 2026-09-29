// What shows if the store can't be read at launch, instead of a blank screen. The read isn't retried (ticket 02).

export function LaunchFailed() {
  return (
    <main className="mx-auto max-w-[600px] px-gutter pt-safe">
      <p role="alert" className="mt-16 rounded-[26px] bg-danger p-6 text-m font-semibold text-on-danger">
        Couldn't open what's saved. Close and reopen Cadence, or restart the iPhone.
      </p>
    </main>
  )
}

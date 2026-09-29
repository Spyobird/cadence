// The blocking message for a save that didn't happen (spec §13.5). What was typed stays on screen under it.

export function Problem({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/70 px-gutter">
      <div role="alertdialog" aria-modal="true" aria-label={message} className="w-full max-w-[400px] rounded-[26px] bg-danger p-6 text-on-danger">
        <p className="text-m font-semibold">{message}</p>
        {/* Taking focus takes the keyboard, so nothing more is typed under the message */}
        <button type="button" autoFocus className="mt-4 min-h-11 rounded-full border border-on-danger px-5 text-m" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  )
}

// Hands a file to the owner: the share sheet, then Save to Files, or a download where files can't be shared
// (spec §12.2, research: iOS storage durability §7)

/**
 * Offers the file through the share sheet, or downloads it where the share sheet can't take files. Call it in the
 * tap handler, before any await: iOS opens the share sheet only in answer to a tap. Resolves true once the file is
 * on its way (the share sheet finished without Cancel, or the download started), false when the owner cancelled.
 */
export async function saveFile(file: File): Promise<boolean> {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return true
    } catch (error) {
      // Cancel is the owner's choice. Any other failure tries the download instead.
      if ((error as { name?: unknown } | null)?.name === 'AbortError') return false
    }
  }
  download(file)
  return true
}

function download(file: File) {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(file)
  link.download = file.name
  link.click()
  // Long after the download has started
  setTimeout(() => URL.revokeObjectURL(link.href), 60_000)
}

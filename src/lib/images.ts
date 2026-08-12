/** Accepted upload types, shared by every photo path (A3). */
export const PHOTO_ACCEPT = "image/jpeg,image/png,image/webp,image/heic"

/**
 * Downscale a captured/selected image in the browser before upload: caps the
 * long edge at 2000px and re-encodes to JPEG. This keeps phone-camera photos
 * (large HEIC/48MP JPEGs) well under the server-action body limit and the
 * storage size cap, and converts HEIC→JPEG so the thumbnail step works too.
 * Falls back to the original file if the image can't be decoded (e.g. HEIC on
 * a browser that can't render it).
 */
export async function downscaleImage(
  file: File,
  maxEdge = 2000,
  quality = 0.85
): Promise<File> {
  try {
    const url = URL.createObjectURL(file)
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = reject
      el.src = url
    })
    URL.revokeObjectURL(url)

    const longest = Math.max(img.naturalWidth, img.naturalHeight)
    const scale = longest > maxEdge ? maxEdge / longest : 1
    // Skip work only when it's already a small JPEG.
    if (scale === 1 && file.type === "image/jpeg") return file

    const canvas = document.createElement("canvas")
    canvas.width = Math.round(img.naturalWidth * scale)
    canvas.height = Math.round(img.naturalHeight * scale)
    const ctx = canvas.getContext("2d")
    if (!ctx) return file
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    )
    if (!blob) return file

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg"
    return new File([blob], name, { type: "image/jpeg" })
  } catch {
    return file
  }
}

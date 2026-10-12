import { ImageManipulator, SaveFormat } from "expo-image-manipulator"

/**
 * Downsize a captured frame so its long edge is at most `longEdge` px, as a
 * JPEG. Uploads use 2000px — the same size the web's Quick Capture and
 * Review's Accept publish at — so a phone frame sits alongside the rest of
 * the library instead of being a 12MP outlier. Identify uses ~1024px.
 */
export async function prepareFrame(
  fileUri: string,
  longEdge: number,
  opts: { compress?: number; base64?: boolean } = {}
): Promise<{ uri: string; width: number; height: number; base64?: string }> {
  const original = await ImageManipulator.manipulate(fileUri).renderAsync()
  const scale = Math.min(1, longEdge / Math.max(original.width, original.height))
  const ref =
    scale < 1
      ? await ImageManipulator.manipulate(original)
          .resize(
            original.width >= original.height
              ? { width: Math.round(original.width * scale) }
              : { height: Math.round(original.height * scale) }
          )
          .renderAsync()
      : original
  const saved = await ref.saveAsync({
    format: SaveFormat.JPEG,
    compress: opts.compress ?? 0.9,
    base64: opts.base64 ?? false,
  })
  return saved
}

/** VisionCamera returns a filesystem path; React Native wants a file:// URI. */
export function fileUri(path: string): string {
  return path.startsWith("file://") ? path : `file://${path}`
}

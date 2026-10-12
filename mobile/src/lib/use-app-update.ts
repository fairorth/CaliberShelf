import * as Updates from "expo-updates"
import { useCallback, useEffect, useState } from "react"

export type UpdateState = "idle" | "checking" | "ready" | "current" | "error"

/**
 * Over-the-air updates (EAS Update): JavaScript fixes reach the phone without
 * a new build or QR scan. On launch the app looks for an update and
 * downloads it in the background; when one is ready the home screen offers
 * "Restart to update". Native changes (new camera packages, permissions)
 * still need a fresh build.
 */
export function useAppUpdate() {
  const [state, setState] = useState<UpdateState>("idle")

  const check = useCallback(async () => {
    if (!Updates.isEnabled) {
      setState("current")
      return
    }
    setState("checking")
    try {
      const found = await Updates.checkForUpdateAsync()
      if (!found.isAvailable) {
        setState("current")
        return
      }
      await Updates.fetchUpdateAsync()
      setState("ready")
    } catch {
      setState("error")
    }
  }, [])

  useEffect(() => {
    void check()
  }, [check])

  return {
    state,
    check,
    restart: () => void Updates.reloadAsync(),
    /** Which JavaScript is running — shown in Settings. */
    label: Updates.updateId
      ? `update ${Updates.updateId.slice(0, 8)}${Updates.createdAt ? ` · ${Updates.createdAt.toLocaleDateString()}` : ""}`
      : "built-in",
  }
}

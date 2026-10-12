import * as Updates from "expo-updates"
import { useCallback, useEffect, useMemo, useState } from "react"

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

  return useMemo(
    () => ({
      state,
      check,
      restart: () => void Updates.reloadAsync(),
      /** Which JavaScript is running — shown in More. The code a build ships
       *  with has an update id too, so "built-in" is decided by
       *  isEmbeddedLaunch, not by the id being null. */
      label:
        Updates.isEmbeddedLaunch || !Updates.updateId
          ? "built-in code"
          : `update ${Updates.updateId.slice(0, 8)}${Updates.createdAt ? ` · ${Updates.createdAt.toLocaleDateString()}` : ""}`,
    }),
    [state, check]
  )
}

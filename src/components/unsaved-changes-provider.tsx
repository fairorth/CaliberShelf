"use client"

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface UnsavedChangesContextValue {
  /** Forms register their dirty state here (cleared on unmount). */
  setDirty: (dirty: boolean) => void
  /**
   * Call before an in-app navigation. Returns true when the navigation was
   * intercepted (a confirm dialog is now open); the caller must not navigate.
   */
  interceptNavigation: (href: string) => boolean
}

const UnsavedChangesContext = createContext<UnsavedChangesContextValue>({
  setDirty: () => {},
  interceptNavigation: () => false,
})

export function useUnsavedChanges() {
  return useContext(UnsavedChangesContext)
}

/**
 * App-level guard for in-app navigation away from a dirty form. The App
 * Router has no route-change event, so nav controls consult this provider
 * before router.push / following a Link (C1).
 */
export function UnsavedChangesProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  // A ref, not state: reading at click time is enough, and registering
  // dirty on every keystroke must not re-render the whole shell.
  const dirtyRef = useRef(false)
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  const setDirty = useCallback((dirty: boolean) => {
    dirtyRef.current = dirty
  }, [])

  const interceptNavigation = useCallback((href: string) => {
    if (!dirtyRef.current) return false
    setPendingHref(href)
    return true
  }, [])

  const value = useMemo(
    () => ({ setDirty, interceptNavigation }),
    [setDirty, interceptNavigation]
  )

  function discardAndGo() {
    const href = pendingHref
    setPendingHref(null)
    dirtyRef.current = false
    if (href) router.push(href)
  }

  return (
    <UnsavedChangesContext.Provider value={value}>
      {children}
      <AlertDialog
        open={pendingHref !== null}
        onOpenChange={(open) => {
          if (!open) setPendingHref(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes that will be lost if you leave now.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={discardAndGo}>
              Discard &amp; Return
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </UnsavedChangesContext.Provider>
  )
}

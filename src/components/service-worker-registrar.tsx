"use client"

import { useEffect } from "react"

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return
    // We previously shipped a service worker that intercepted every request with
    // event.respondWith(fetch(event.request)). On WebKit/iOS that drops POST
    // bodies, which broke every mutation (e.g. Add Watch) in the installed PWA.
    // iOS is lazy about swapping an already-installed worker, so rather than ship
    // a fixed worker we unregister entirely — the manifest alone keeps the app
    // installable, and we no longer need offline caching.
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister())
    }).catch(() => {})
  }, [])

  return null
}

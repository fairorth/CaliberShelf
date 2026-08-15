import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { NavHeader } from "@/components/layout/nav-header"
import { NavRail } from "@/components/layout/nav-rail"
import { IosInstallPrompt } from "@/components/ios-install-prompt"
import { UnsavedChangesProvider } from "@/components/unsaved-changes-provider"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <UnsavedChangesProvider>
      {/* print: the h-dvh + overflow-y-auto pair truncates printing to one
          viewport, so the shell unlocks and the nav hides — the Annual Summary
          report must survive the browser print dialog on Letter (§4.2). */}
      <div className="flex h-dvh pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] print:block print:h-auto print:pt-0 print:pb-0">
        {/* Persistent rail: 200px at lg, 56px icon-only at md, absent below (A2). */}
        <div className="contents print:hidden">
          <NavRail />
        </div>
        <div className="flex min-w-0 flex-1 flex-col print:block">
          <div className="contents print:hidden">
            <NavHeader userEmail={user.email ?? ""} />
          </div>
          <main className="flex-1 overflow-y-auto p-4 md:p-6 print:overflow-visible print:p-0">
            {children}
          </main>
        </div>
        <IosInstallPrompt />
      </div>
    </UnsavedChangesProvider>
  )
}

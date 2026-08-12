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
      <div className="flex h-dvh pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        {/* Persistent rail: 200px at lg, 56px icon-only at md, absent below (A2). */}
        <NavRail />
        <div className="flex min-w-0 flex-1 flex-col">
          <NavHeader userEmail={user.email ?? ""} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
        <IosInstallPrompt />
      </div>
    </UnsavedChangesProvider>
  )
}

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { NavHeader } from "@/components/layout/nav-header"
import { IosInstallPrompt } from "@/components/ios-install-prompt"

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
    <div className="flex h-dvh flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <NavHeader userEmail={user.email ?? ""} />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        {children}
      </main>
      <IosInstallPrompt />
    </div>
  )
}

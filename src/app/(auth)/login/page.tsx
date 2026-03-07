import type { Metadata } from "next"
import { AuthForm } from "../_components/auth-form"

export const metadata: Metadata = {
  title: "Sign In | CaliberShelf",
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <AuthForm mode="login" />
    </div>
  )
}

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/brand/logo"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="space-y-6 text-center">
        {/* The signed-out door to the product showed the name as plain bold
            text — no mark, no colon, no brass. aria-label carries the product
            name because BRAND.md forbids "Ten:Ten Loupe" in alt text. */}
        <h1 className="mx-auto w-fit" aria-label="TenTenLoupe">
          <Logo orientation="stacked" markSize={72} />
        </h1>
        <p className="text-md max-w-md text-muted-foreground">
          Track, manage, and showcase your watch collection.
        </p>
        <div className="flex justify-center gap-4">
          {/* Was a hand-rolled bg-primary button — steel blue is data, never
              action (E1). Using Button gets the brass fill by default. */}
          <Button size="lg" render={<Link href="/login" />}>
            Sign In
          </Button>
          <Button variant="outline" size="lg" render={<Link href="/signup" />}>
            Sign Up
          </Button>
        </div>
      </div>
    </div>
  )
}

import type { Metadata } from "next"
import Link from "next/link"
import { getWatchOptions } from "@/lib/queries/straps"
import { StrapForm } from "../_components/strap-form"

export const metadata: Metadata = {
  title: "Add Strap | CaliberShelf",
}

export default async function NewStrapPage() {
  const watches = await getWatchOptions()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/straps"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ‹ Straps
        </Link>
        <h1 className="font-display text-lg font-semibold tracking-tight">Add Strap</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Save the strap first — you can add photos on the next screen.
        </p>
      </div>
      <StrapForm watches={watches} submitLabel="Add Strap" />
    </div>
  )
}

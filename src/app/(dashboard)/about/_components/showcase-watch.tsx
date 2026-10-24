import Image from "next/image"
import { ImageOff } from "lucide-react"
import { cn } from "@/lib/utils"

/** The slice of a watch the About page's showcases need. */
export interface ShowcaseWatch {
  id: string
  name: string
  photoUrl: string | null
}

/**
 * A real collection photograph inside an About illustration. object-contain on
 * the photo surface: the photo is the subject here, so it is shown whole.
 */
export function ShowcasePhoto({
  watch,
  sizes,
  className,
}: {
  watch: ShowcaseWatch
  sizes: string
  className?: string
}) {
  return (
    <span className={cn("relative block overflow-hidden bg-surface-photo", className)}>
      {watch.photoUrl ? (
        <Image src={watch.photoUrl} alt={watch.name} fill className="object-contain" sizes={sizes} unoptimized />
      ) : (
        <span className="flex h-full items-center justify-center text-muted-foreground">
          <ImageOff className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
    </span>
  )
}

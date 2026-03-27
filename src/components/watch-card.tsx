"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn, formatCurrency } from "@/lib/utils"
import type { WatchWithCover } from "@/lib/types/watch"

interface WatchCardProps {
  watch: WatchWithCover
}

export function WatchCard({ watch }: WatchCardProps) {
  return (
    <Link href={`/watch/${watch.id}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-md">
        {/* Photo area */}
        <div className="relative aspect-square bg-muted">
          {watch.cover_photo_url ? (
            <Image
              src={watch.cover_photo_url}
              alt={`${watch.brand.name} ${watch.model}`}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl text-muted-foreground">
              ⌚
            </div>
          )}
        </div>

        <CardContent className="space-y-2 p-4">
          {/* Brand & model */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {watch.brand.name}
            </p>
            <h3 className="font-semibold leading-tight">
              {watch.nickname || watch.model}
            </h3>
            {watch.nickname && (
              <p className="text-sm text-muted-foreground">{watch.model}</p>
            )}
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap gap-1.5">
            {watch.movement && (
              <Badge variant="secondary" className="text-xs">
                {watch.movement.caliber_name}
              </Badge>
            )}
          </div>

          {/* Purchase price */}
          {watch.purchase_price_cents !== null && (
            <p className={cn("text-sm font-medium")}>
              {formatCurrency(watch.purchase_price_cents, watch.purchase_currency)}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

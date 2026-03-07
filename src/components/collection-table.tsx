"use client"

import Image from "next/image"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { movementLabels } from "@/lib/validations/watch"
import type { WatchWithCover } from "@/lib/types/watch"

interface CollectionTableProps {
  watches: WatchWithCover[]
}

export function CollectionTable({ watches }: CollectionTableProps) {
  if (watches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-5xl">⌚</span>
        <h3 className="mt-4 text-lg font-semibold">No watches yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your first watch to start building your collection.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop table — hidden on small screens */}
      <div className="hidden sm:block">
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[208px]">Photo</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Movement Type</TableHead>
                <TableHead>Caliber</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {watches.map((watch) => (
                <TableRow key={watch.id} className="group">
                  <TableCell>
                    <Link href={`/watch/${watch.id}`} className="block">
                      <div className="relative h-48 w-48 overflow-hidden rounded-md bg-muted">
                        {watch.cover_photo_url ? (
                          <Image
                            src={watch.cover_photo_url}
                            alt={`${watch.brand.name} ${watch.model}`}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                            sizes="192px"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-4xl text-muted-foreground">
                            ⌚
                          </div>
                        )}
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/watch/${watch.id}`}
                      className="font-medium hover:underline"
                    >
                      {watch.brand.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/watch/${watch.id}`}
                      className="text-muted-foreground hover:underline"
                    >
                      {watch.model}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {watch.movement
                      ? movementLabels[watch.movement.movement_type] ?? watch.movement.movement_type
                      : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {watch.movement
                      ? `${watch.movement.manufacturer ?? ""} ${watch.movement.caliber_name}`.trim()
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile stacked cards — visible on small screens */}
      <div className="space-y-2 sm:hidden">
        {watches.map((watch) => (
          <Link
            key={watch.id}
            href={`/watch/${watch.id}`}
            className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
          >
            <div className="relative h-[168px] w-[168px] shrink-0 overflow-hidden rounded-md bg-muted">
              {watch.cover_photo_url ? (
                <Image
                  src={watch.cover_photo_url}
                  alt={`${watch.brand.name} ${watch.model}`}
                  fill
                  className="object-cover"
                  sizes="168px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-4xl text-muted-foreground">
                  ⌚
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">
                {watch.brand.name}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {watch.model}
              </p>
              {watch.movement && (
                <p className="truncate text-xs text-muted-foreground">
                  {movementLabels[watch.movement.movement_type] ?? watch.movement.movement_type}
                  {watch.movement.caliber_name ? ` · ${watch.movement.caliber_name}` : ""}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}

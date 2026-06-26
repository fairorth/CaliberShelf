"use client"

import { useMemo, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { MovementForm } from "./movement-form"
import { deleteMovement } from "@/lib/actions/movement-actions"
import { caliberTypeLabels } from "@/lib/validations/movement"
import { toast } from "sonner"
import type { Movement } from "@/lib/types/watch"

interface MovementsTabProps {
  movements: Movement[]
}

// ── Sorting ────────────────────────────────────────────────────────

type SortKey =
  | "caliber"
  | "manufacturer"
  | "type"
  | "beat"
  | "reserve"
  | "lift"
  | "added"
type SortDir = "asc" | "desc"

/**
 * Sort value as a string. Missing fields collapse to "" so that ascending sort
 * clusters incomplete calibers at the top — handy for finding ones that still
 * need editing.
 */
function getSortValue(m: Movement, key: SortKey): string {
  switch (key) {
    case "caliber":
      return m.caliber_name.toLowerCase()
    case "manufacturer":
      return (m.manufacturer ?? "").toLowerCase()
    case "type":
      return m.caliber_type
        ? (caliberTypeLabels[m.caliber_type] ?? m.caliber_type).toLowerCase()
        : ""
    case "beat":
      return (m.beat_rate ?? "").toLowerCase()
    case "reserve":
      return (m.power_reserve ?? "").toLowerCase()
    case "lift":
      return (m.lift_angle ?? "").toLowerCase()
    case "added":
      return m.created_at // ISO timestamp sorts chronologically
  }
}

function SortableHeader({
  label,
  sortKey,
  currentKey,
  currentDir,
  onSort,
  className,
}: {
  label: string
  sortKey: SortKey
  currentKey: SortKey | null
  currentDir: SortDir
  onSort: (key: SortKey) => void
  className?: string
}) {
  const isActive = currentKey === sortKey
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="flex items-center gap-1 text-left font-medium hover:text-foreground"
      >
        {label}
        <span className="text-[10px]">
          {isActive ? (currentDir === "asc" ? "▲" : "▼") : "⇅"}
        </span>
      </button>
    </TableHead>
  )
}

function formatAdded(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function MovementsTab({ movements }: MovementsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null)
  const [deletePending, startDeleteTransition] = useTransition()
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  const sorted = useMemo(() => {
    if (!sortKey) return movements
    return [...movements].sort((a, b) => {
      const cmp = getSortValue(a, sortKey).localeCompare(getSortValue(b, sortKey))
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [movements, sortKey, sortDir])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      // Default the "Added" column to newest-first; everything else A→Z.
      setSortDir(key === "added" ? "desc" : "asc")
    }
  }

  function handleAdd() {
    setEditingMovement(null)
    setDialogOpen(true)
  }

  function handleEdit(movement: Movement) {
    setEditingMovement(movement)
    setDialogOpen(true)
  }

  function handleDelete(movementId: string, caliberName: string) {
    if (!confirm(`Delete "${caliberName}"? Watches using it will have their movement cleared.`)) return
    startDeleteTransition(async () => {
      const result = await deleteMovement(movementId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Deleted "${caliberName}"`)
      }
    })
  }

  function handleFormSuccess() {
    setDialogOpen(false)
    setEditingMovement(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {movements.length} {movements.length === 1 ? "caliber" : "calibers"}
        </p>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingMovement(null)
        }}>
          <DialogTrigger render={<Button size="sm" onClick={handleAdd} />}>
            Add Caliber
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingMovement ? "Edit Caliber" : "Add Caliber"}
              </DialogTitle>
            </DialogHeader>
            <MovementForm
              key={editingMovement?.id ?? "create"}
              onSuccess={handleFormSuccess}
              movement={editingMovement ?? undefined}
            />
          </DialogContent>
        </Dialog>
      </div>

      {movements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="text-4xl">⏱️</span>
          <p className="mt-3 text-sm text-muted-foreground">
            No calibers yet. Add one here or type a new name when editing a watch.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader label="Caliber" sortKey="caliber" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Manufacturer" sortKey="manufacturer" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Type" sortKey="type" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Beat Rate" sortKey="beat" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Reserve" sortKey="reserve" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Lift Angle" sortKey="lift" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Added" sortKey="added" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">
                  {m.caliber_name}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {m.manufacturer ?? "—"}
                </TableCell>
                <TableCell>
                  {m.caliber_type ? (
                    <Badge variant="secondary" className="text-xs">
                      {caliberTypeLabels[m.caliber_type] ?? m.caliber_type}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {m.beat_rate ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {m.power_reserve ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {m.lift_angle ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                  {formatAdded(m.created_at)}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleEdit(m)}
                      title="Edit caliber"
                    >
                      ✏️
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      disabled={deletePending}
                      onClick={() => handleDelete(m.id, m.caliber_name)}
                      title="Delete caliber"
                    >
                      🗑️
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

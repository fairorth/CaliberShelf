"use client"

import { useState, useTransition } from "react"
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

export function MovementsTab({ movements }: MovementsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null)
  const [deletePending, startDeleteTransition] = useTransition()

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
              <TableHead>Caliber</TableHead>
              <TableHead>Manufacturer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Beat Rate</TableHead>
              <TableHead>Reserve</TableHead>
              <TableHead>Lift Angle</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((m) => (
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

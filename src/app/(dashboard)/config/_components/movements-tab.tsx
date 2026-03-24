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
import { movementLabels } from "@/lib/validations/watch"
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
          {movements.length} movements
        </p>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingMovement(null)
        }}>
          <DialogTrigger render={<Button size="sm" onClick={handleAdd} />}>
            Add Movement
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMovement ? "Edit Movement" : "Add Movement"}
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

      {/* Single unified table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Caliber</TableHead>
            <TableHead>Manufacturer</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-center">Jewels</TableHead>
            <TableHead className="text-center">Beat Rate</TableHead>
            <TableHead className="text-center">Reserve</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="font-medium">
                {m.user_id === null && <span className="mr-1" title="System caliber">🌐</span>}
                {m.caliber_name}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {m.manufacturer ?? "—"}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs">
                  {movementLabels[m.movement_type] ?? m.movement_type}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                {m.jewel_count ?? "—"}
              </TableCell>
              <TableCell className="text-center">
                {m.beat_rate_vph ? `${(m.beat_rate_vph / 1000).toFixed(1)}k` : "—"}
              </TableCell>
              <TableCell className="text-center">
                {m.power_reserve_hours ? `${m.power_reserve_hours}h` : "—"}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleEdit(m)}
                    title="Edit movement"
                  >
                    ✏️
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    disabled={deletePending}
                    onClick={() => handleDelete(m.id, m.caliber_name)}
                    title="Delete movement"
                  >
                    🗑️
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

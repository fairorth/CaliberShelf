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
  const [deletePending, startDeleteTransition] = useTransition()

  const systemMovements = movements.filter((m) => m.user_id === null)
  const userMovements = movements.filter((m) => m.user_id !== null)

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

  return (
    <div className="space-y-6">
      {/* Add movement button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {systemMovements.length} system movements, {userMovements.length} custom
        </p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            Add Movement
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Custom Movement</DialogTitle>
            </DialogHeader>
            <MovementForm onSuccess={() => setDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* User movements first */}
      {userMovements.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Your Movements</h3>
          <MovementTable
            movements={userMovements}
            onDelete={handleDelete}
            deletePending={deletePending}
            isSystem={false}
          />
        </div>
      )}

      {/* System movements */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">System Movements</h3>
        <p className="text-xs text-muted-foreground">
          Pre-loaded reference calibers. Read-only.
        </p>
        <MovementTable
          movements={systemMovements}
          onDelete={handleDelete}
          deletePending={deletePending}
          isSystem={true}
        />
      </div>
    </div>
  )
}

function MovementTable({
  movements,
  onDelete,
  deletePending,
  isSystem,
}: {
  movements: Movement[]
  onDelete: (id: string, name: string) => void
  deletePending: boolean
  isSystem: boolean
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Caliber</TableHead>
          <TableHead>Manufacturer</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-center">Jewels</TableHead>
          <TableHead className="text-center">Beat Rate</TableHead>
          <TableHead className="text-center">Reserve</TableHead>
          {!isSystem && <TableHead className="w-20" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {movements.map((m) => (
          <TableRow key={m.id}>
            <TableCell className="font-medium">
              {isSystem && <span className="mr-1" title="System caliber">🌐</span>}
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
            {!isSystem && (
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  disabled={deletePending}
                  onClick={() => onDelete(m.id, m.caliber_name)}
                  title="Delete movement"
                >
                  🗑️
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

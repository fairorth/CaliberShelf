"use client"

import { useState, useMemo, useTransition } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { createMovementInline } from "@/lib/actions/movement-actions"
import { caliberTypeLabels } from "@/lib/validations/movement"
import { cn } from "@/lib/utils"
import type { Movement } from "@/lib/types/watch"

interface MovementComboboxProps {
  movements: Movement[]
  defaultMovementId?: string
  onMovementChange?: (movement: Movement | null) => void
}

export function MovementCombobox({
  movements,
  defaultMovementId,
  onMovementChange,
}: MovementComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState(defaultMovementId ?? "")
  const [localMovements, setLocalMovements] = useState<Movement[]>(movements)
  const [isPending, startTransition] = useTransition()

  const selectedMovement = localMovements.find((m) => m.id === selectedId)

  const filtered = useMemo(() => {
    if (!search.trim()) return localMovements
    const q = search.toLowerCase()
    return localMovements.filter(
      (m) =>
        m.caliber_name.toLowerCase().includes(q) ||
        (m.manufacturer ?? "").toLowerCase().includes(q)
    )
  }, [localMovements, search])

  const exactMatch = localMovements.some(
    (m) => m.caliber_name.toLowerCase() === search.trim().toLowerCase()
  )

  function handleSelect(movement: Movement) {
    setSelectedId(movement.id)
    setSearch("")
    setOpen(false)
    onMovementChange?.(movement)
  }

  function handleClear() {
    setSelectedId("")
    setSearch("")
    setOpen(false)
    onMovementChange?.(null)
  }

  function handleCreateNew() {
    const name = search.trim()
    if (!name) return

    startTransition(async () => {
      const result = await createMovementInline(name)
      if (result.id) {
        const newMovement: Movement = {
          id: result.id,
          user_id: "",
          caliber_name: name,
          manufacturer: null,
          caliber_type: null,
          beat_rate: null,
          power_reserve: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setLocalMovements((prev) =>
          [...prev, newMovement].sort((a, b) => a.caliber_name.localeCompare(b.caliber_name))
        )
        setSelectedId(result.id)
        setSearch("")
        setOpen(false)
        onMovementChange?.(newMovement)
      }
    })
  }

  return (
    <div className="space-y-2">
      {/* Hidden input for form submission */}
      <input type="hidden" name="movement_id" value={selectedId} />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              size="default"
              type="button"
              className={cn(
                "w-full justify-between font-normal",
                !selectedMovement && "text-muted-foreground"
              )}
            />
          }
        >
          {selectedMovement ? selectedMovement.caliber_name : "Select movement..."}
          <span className="ml-auto text-xs opacity-50">▼</span>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-[var(--anchor-width)] p-0">
          <div className="p-2">
            <Input
              placeholder="Search or create caliber..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8"
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto">
            {/* Clear option */}
            <button
              type="button"
              className={cn(
                "flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent",
                !selectedId && "bg-accent"
              )}
              onClick={handleClear}
            >
              <span className="w-4 text-center">{!selectedId ? "✓" : ""}</span>
              <span className="text-muted-foreground italic">None selected</span>
            </button>

            {filtered.map((movement) => (
              <button
                key={movement.id}
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent",
                  movement.id === selectedId && "bg-accent"
                )}
                onClick={() => handleSelect(movement)}
              >
                <span className="w-4 text-center">
                  {movement.id === selectedId ? "✓" : ""}
                </span>
                <div className="flex flex-1 items-center gap-2 overflow-hidden">
                  <span className="truncate">{movement.caliber_name}</span>
                  {movement.caliber_type && (
                    <Badge variant="secondary" className="ml-auto shrink-0 text-[10px]">
                      {caliberTypeLabels[movement.caliber_type] ?? movement.caliber_type}
                    </Badge>
                  )}
                </div>
              </button>
            ))}

            {filtered.length === 0 && !search.trim() && (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                No calibers yet. Type to create one.
              </p>
            )}

            {/* Create new option */}
            {search.trim() && !exactMatch && (
              <button
                type="button"
                className="flex w-full items-center gap-2 border-t px-3 py-2 text-sm text-primary hover:bg-accent"
                onClick={handleCreateNew}
                disabled={isPending}
              >
                <span className="w-4 text-center">+</span>
                <span>
                  {isPending ? "Creating..." : `Create "${search.trim()}"`}
                </span>
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

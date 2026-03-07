"use client"

import { useState, useMemo } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { movementLabels } from "@/lib/validations/watch"
import type { Movement } from "@/lib/types/watch"

interface MovementComboboxProps {
  movements: Movement[]
  defaultMovementId?: string
}

export function MovementCombobox({
  movements,
  defaultMovementId,
}: MovementComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState(defaultMovementId ?? "")

  const selectedMovement = movements.find((m) => m.id === selectedId)

  const filtered = useMemo(() => {
    if (!search.trim()) return movements.slice(0, 50) // show first 50 by default
    const q = search.toLowerCase()
    return movements.filter(
      (m) =>
        m.caliber_name.toLowerCase().includes(q) ||
        (m.manufacturer ?? "").toLowerCase().includes(q) ||
        (m.aliases ?? "").toLowerCase().includes(q)
    )
  }, [movements, search])

  function handleSelect(movement: Movement) {
    setSelectedId(movement.id)
    setSearch("")
    setOpen(false)
  }

  function handleClear() {
    setSelectedId("")
    setSearch("")
    setOpen(false)
  }

  const displayLabel = selectedMovement
    ? `${selectedMovement.manufacturer ?? ""} ${selectedMovement.caliber_name}`.trim()
    : null

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
          {displayLabel ?? "Select movement..."}
          <span className="ml-auto text-xs opacity-50">▼</span>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-[var(--anchor-width)] p-0">
          <div className="p-2">
            <Input
              placeholder="Search caliber or manufacturer..."
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
                  {movement.id === selectedId ? "✓" : movement.user_id === null ? "🌐" : ""}
                </span>
                <div className="flex flex-1 items-center gap-2 overflow-hidden">
                  <span className="truncate">
                    {movement.manufacturer && (
                      <span className="text-muted-foreground">
                        {movement.manufacturer}{" "}
                      </span>
                    )}
                    {movement.caliber_name}
                  </span>
                  <Badge variant="secondary" className="ml-auto shrink-0 text-[10px]">
                    {movementLabels[movement.movement_type] ?? movement.movement_type}
                  </Badge>
                </div>
              </button>
            ))}

            {filtered.length === 0 && (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                No movements found. Add custom movements in Config.
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

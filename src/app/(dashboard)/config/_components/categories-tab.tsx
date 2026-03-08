"use client"

import { useActionState, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/lib/actions/category-actions"
import type { CategoryActionState } from "@/lib/actions/category-actions"
import { toast } from "sonner"
import type { Category } from "@/lib/types/watch"

/** Convert display_order (0-11) to the clock hour label (1-12) */
function positionLabel(pos: number): string {
  return pos === 0 ? "12" : String(pos)
}

/** All 12 dial positions */
const DIAL_POSITIONS = Array.from({ length: 12 }, (_, i) => i)

interface CategoriesTabProps {
  categories: Category[]
  watchCountByCategory: Map<string, number>
}

function CategoryRow({
  category,
  count,
  deletePending,
  takenPositions,
  onDelete,
}: {
  category: Category
  count: number
  deletePending: boolean
  takenPositions: Set<number>
  onDelete: (id: string, name: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [savePending, startSaveTransition] = useTransition()
  const [editName, setEditName] = useState(category.name)
  const [editDesc, setEditDesc] = useState(category.description ?? "")
  const [editPosition, setEditPosition] = useState(category.display_order)

  function handleSave() {
    startSaveTransition(async () => {
      const result = await updateCategory(category.id, {
        name: editName,
        description: editDesc,
        display_order: editPosition,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Updated "${editName}"`)
        setEditing(false)
      }
    })
  }

  function handleCancel() {
    setEditName(category.name)
    setEditDesc(category.description ?? "")
    setEditPosition(category.display_order)
    setEditing(false)
  }

  if (editing) {
    return (
      <TableRow>
        <TableCell>
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="h-8"
          />
        </TableCell>
        <TableCell>
          <Input
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            className="h-8"
            placeholder="Description"
          />
        </TableCell>
        <TableCell>
          <Select
            value={String(editPosition)}
            onValueChange={(val) => { if (val) setEditPosition(parseInt(val, 10)) }}
          >
            <SelectTrigger className="h-8 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIAL_POSITIONS.map((pos) => {
                const isTakenByOther = takenPositions.has(pos) && pos !== category.display_order
                return (
                  <SelectItem
                    key={pos}
                    value={String(pos)}
                    disabled={isTakenByOther}
                  >
                    {positionLabel(pos)}{isTakenByOther ? " (taken)" : ""}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell className="text-center">{count}</TableCell>
        <TableCell>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              disabled={savePending || !editName.trim()}
              onClick={handleSave}
              title="Save"
            >
              {savePending ? "..." : "✓"}
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              disabled={savePending}
              onClick={handleCancel}
              title="Cancel"
            >
              ✕
            </Button>
          </div>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{category.name}</TableCell>
      <TableCell className="text-muted-foreground">
        {category.description ?? "\u2014"}
      </TableCell>
      <TableCell className="text-center font-mono">
        {positionLabel(category.display_order)}
      </TableCell>
      <TableCell className="text-center">{count}</TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setEditing(true)}
            title="Edit category"
          >
            ✏️
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            disabled={count > 0 || deletePending}
            onClick={() => onDelete(category.id, category.name)}
            title={count > 0 ? "Cannot delete \u2014 has watches" : "Delete category"}
          >
            🗑️
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function CategoriesTab({ categories, watchCountByCategory }: CategoriesTabProps) {
  const [state, formAction, isPending] = useActionState<CategoryActionState, FormData>(
    createCategory,
    {}
  )
  const [deletePending, startDeleteTransition] = useTransition()

  // Track which dial positions are taken
  const takenPositions = new Set(categories.map((c) => c.display_order))

  // First available position for the "Add" form
  const nextAvailablePosition = DIAL_POSITIONS.find((p) => !takenPositions.has(p))

  function handleDelete(categoryId: string, categoryName: string) {
    if (!confirm(`Delete "${categoryName}"? This cannot be undone.`)) return
    startDeleteTransition(async () => {
      const result = await deleteCategory(categoryId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Deleted "${categoryName}"`)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Add category form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Category</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="category-name">Name *</Label>
                <Input
                  id="category-name"
                  name="name"
                  placeholder="e.g. Daily Rotation"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-description">Description</Label>
                <Input
                  id="category-description"
                  name="description"
                  placeholder="e.g. Watches in regular rotation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-position">Dial Position</Label>
                <select
                  id="category-position"
                  name="dial_position"
                  defaultValue={nextAvailablePosition ?? ""}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {DIAL_POSITIONS.map((pos) => {
                    const isTaken = takenPositions.has(pos)
                    return (
                      <option key={pos} value={pos} disabled={isTaken}>
                        {positionLabel(pos)} o&apos;clock{isTaken ? " (taken)" : ""}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isPending || categories.length >= 12}>
                {isPending ? "Creating..." : "Create Category"}
              </Button>
              {state.error && (
                <p className="text-sm text-destructive">{state.error}</p>
              )}
              <span className="text-xs text-muted-foreground">
                {categories.length}/12 categories
              </span>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Categories table */}
      {categories.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-center">Position</TableHead>
              <TableHead className="text-center">Watches</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((c) => (
              <CategoryRow
                key={c.id}
                category={c}
                count={watchCountByCategory.get(c.id) ?? 0}
                deletePending={deletePending}
                takenPositions={takenPositions}
                onDelete={handleDelete}
              />
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-muted-foreground">
          No categories yet. Create one above to start organizing your watches.
        </p>
      )}
    </div>
  )
}

"use client"

import { useActionState, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

interface CategoriesTabProps {
  categories: Category[]
  watchCountByCategory: Map<string, number>
}

function CategoryRow({
  category,
  count,
  deletePending,
  onDelete,
}: {
  category: Category
  count: number
  deletePending: boolean
  onDelete: (id: string, name: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [savePending, startSaveTransition] = useTransition()
  const [editName, setEditName] = useState(category.name)
  const [editDesc, setEditDesc] = useState(category.description ?? "")

  function handleSave() {
    startSaveTransition(async () => {
      const result = await updateCategory(category.id, {
        name: editName,
        description: editDesc,
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
        {category.description ?? "—"}
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
            title={count > 0 ? "Cannot delete — has watches" : "Delete category"}
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
            <div className="grid gap-3 sm:grid-cols-2">
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
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating..." : "Create Category"}
              </Button>
              {state.error && (
                <p className="text-sm text-destructive">{state.error}</p>
              )}
              <span className="text-xs text-muted-foreground">
                {categories.length} {categories.length === 1 ? "category" : "categories"}
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

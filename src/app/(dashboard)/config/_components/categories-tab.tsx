"use client"

import { useActionState, useTransition } from "react"
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
} from "@/lib/actions/category-actions"
import type { CategoryActionState } from "@/lib/actions/category-actions"
import { toast } from "sonner"
import type { Category } from "@/lib/types/watch"

interface CategoriesTabProps {
  categories: Category[]
  watchCountByCategory: Map<string, number>
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
              <TableHead className="text-center">Watches</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((c) => {
              const count = watchCountByCategory.get(c.id) ?? 0
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.description ?? "—"}
                  </TableCell>
                  <TableCell className="text-center">{count}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      disabled={count > 0 || deletePending}
                      onClick={() => handleDelete(c.id, c.name)}
                      title={count > 0 ? "Cannot delete — has watches" : "Delete category"}
                    >
                      🗑️
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
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

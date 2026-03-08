"use client"

import { useActionState, useTransition, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label as FormLabel } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createLabel, deleteLabel } from "@/lib/actions/label-actions"
import type { LabelActionState } from "@/lib/actions/label-actions"
import { labelColorMap } from "@/lib/validations/label"
import type { LabelColor } from "@/lib/validations/label"
import { toast } from "sonner"
import type { Label } from "@/lib/types/watch"

const COLOR_OPTIONS: LabelColor[] = ["red", "orange", "amber", "green", "teal", "blue", "purple", "pink"]

interface LabelsTabProps {
  labels: Label[]
}

export function LabelsTab({ labels }: LabelsTabProps) {
  const [state, formAction, isPending] = useActionState<LabelActionState, FormData>(
    createLabel,
    {}
  )
  const [deletePending, startDeleteTransition] = useTransition()
  const [selectedColor, setSelectedColor] = useState<LabelColor>("blue")

  function handleDelete(labelId: string, labelName: string) {
    if (!confirm(`Delete label "${labelName}"? It will be removed from all watches.`)) return
    startDeleteTransition(async () => {
      const result = await deleteLabel(labelId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Deleted label "${labelName}"`)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Add label form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Label</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <FormLabel htmlFor="label-name">Name *</FormLabel>
                <Input
                  id="label-name"
                  name="name"
                  placeholder="e.g. Travel Watch"
                  required
                />
              </div>
              <div className="space-y-2">
                <FormLabel>Color</FormLabel>
                <input type="hidden" name="color" value={selectedColor} />
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => {
                    const colors = labelColorMap[color]
                    const isSelected = selectedColor === color
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`h-8 w-8 rounded-full transition-all ${colors.bg} ${
                          isSelected ? "ring-2 ring-offset-2 ring-offset-background ring-current" : ""
                        }`}
                        title={color}
                      >
                        <span className={`text-xs ${colors.text}`}>
                          {isSelected ? "✓" : ""}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating..." : "Create Label"}
              </Button>
              {state.error && (
                <p className="text-sm text-destructive">{state.error}</p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Labels table */}
      {labels.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Preview</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Color</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {labels.map((label) => {
              const colors = labelColorMap[label.color as LabelColor] ?? labelColorMap.blue
              return (
                <TableRow key={label.id}>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}
                    >
                      {label.name}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{label.name}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">
                    {label.color}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      disabled={deletePending}
                      onClick={() => handleDelete(label.id, label.name)}
                      title="Delete label"
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
          No labels yet. Create one above to start tagging your watches.
        </p>
      )}
    </div>
  )
}

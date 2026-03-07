"use client"

import { useActionState, useTransition, useState } from "react"
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
import { Badge } from "@/components/ui/badge"
import {
  createDisplayCase,
  deleteDisplayCase,
} from "@/lib/actions/display-case-actions"
import type { DisplayCaseActionState } from "@/lib/actions/display-case-actions"
import { caseSizeLabels } from "@/lib/validations/display-case"
import { toast } from "sonner"
import type { DisplayCase } from "@/lib/types/watch"

interface CasesTabProps {
  cases: DisplayCase[]
  watchCountByCase: Map<string, number>
}

export function CasesTab({ cases, watchCountByCase }: CasesTabProps) {
  const [state, formAction, isPending] = useActionState<DisplayCaseActionState, FormData>(
    createDisplayCase,
    {}
  )
  const [deletePending, startDeleteTransition] = useTransition()
  const [selectedCapacity, setSelectedCapacity] = useState("8")

  function handleDelete(caseId: string, caseName: string) {
    if (!confirm(`Delete "${caseName}"? This cannot be undone.`)) return
    startDeleteTransition(async () => {
      const result = await deleteDisplayCase(caseId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Deleted "${caseName}"`)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Add case form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Display Case</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="case-name">Name *</Label>
                <Input
                  id="case-name"
                  name="name"
                  placeholder="e.g. Daily Rotation"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="case-capacity">Size *</Label>
                <input type="hidden" name="capacity" value={selectedCapacity} />
                <Select
                  value={selectedCapacity}
                  onValueChange={(val) => setSelectedCapacity(val ?? "8")}
                >
                  <SelectTrigger id="case-capacity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(caseSizeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="case-type">Type Label</Label>
                <Input
                  id="case-type"
                  name="case_type"
                  placeholder="e.g. Quartz Watches"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating..." : "Create Case"}
              </Button>
              {state.error && (
                <p className="text-sm text-destructive">{state.error}</p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Cases table */}
      {cases.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-center">Capacity</TableHead>
              <TableHead className="text-center">Watches</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.map((c) => {
              const count = watchCountByCase.get(c.id) ?? 0
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.case_type ?? "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="text-xs">
                      {c.capacity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {count}/{c.capacity}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      disabled={count > 0 || deletePending}
                      onClick={() => handleDelete(c.id, c.name)}
                      title={count > 0 ? "Cannot delete — has watches" : "Delete case"}
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
          No display cases yet. Create one above to start organizing your watches.
        </p>
      )}
    </div>
  )
}

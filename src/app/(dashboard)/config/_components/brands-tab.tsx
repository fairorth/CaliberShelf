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
import { createBrand, deleteBrand, updateBrand } from "@/lib/actions/brand-actions"
import type { BrandActionState } from "@/lib/actions/brand-actions"
import { toast } from "sonner"
import type { Brand } from "@/lib/types/watch"

interface BrandsTabProps {
  brands: Brand[]
  watchCountByBrand: Map<string, number>
}

function BrandRow({
  brand,
  count,
  deletePending,
  onDelete,
}: {
  brand: Brand
  count: number
  deletePending: boolean
  onDelete: (id: string, name: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [savePending, startSaveTransition] = useTransition()
  const [editName, setEditName] = useState(brand.name)
  const [editCountry, setEditCountry] = useState(brand.country_of_origin ?? "")

  function handleSave() {
    startSaveTransition(async () => {
      const result = await updateBrand(brand.id, {
        name: editName,
        country_of_origin: editCountry,
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
    setEditName(brand.name)
    setEditCountry(brand.country_of_origin ?? "")
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
            value={editCountry}
            onChange={(e) => setEditCountry(e.target.value)}
            className="h-8"
            placeholder="e.g. Switzerland"
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
      <TableCell className="font-medium">{brand.name}</TableCell>
      <TableCell className="text-muted-foreground">
        {brand.country_of_origin ?? "\u2014"}
      </TableCell>
      <TableCell className="text-center">{count}</TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setEditing(true)}
            title="Edit brand"
          >
            ✏️
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            disabled={count > 0 || deletePending}
            onClick={() => onDelete(brand.id, brand.name)}
            title={count > 0 ? "Cannot delete \u2014 has watches" : "Delete brand"}
          >
            🗑️
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function BrandsTab({ brands, watchCountByBrand }: BrandsTabProps) {
  const [state, formAction, isPending] = useActionState<BrandActionState, FormData>(
    createBrand,
    {}
  )
  const [deletePending, startDeleteTransition] = useTransition()

  function handleDelete(brandId: string, brandName: string) {
    if (!confirm(`Delete "${brandName}"? This cannot be undone.`)) return
    startDeleteTransition(async () => {
      const result = await deleteBrand(brandId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Deleted "${brandName}"`)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Add brand form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Brand</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="brand-name">Brand Name *</Label>
              <Input
                id="brand-name"
                name="name"
                placeholder="e.g. Omega"
                required
              />
            </div>
            <div className="w-40 space-y-2">
              <Label htmlFor="brand-country">Country</Label>
              <Input
                id="brand-country"
                name="country_of_origin"
                placeholder="e.g. Switzerland"
              />
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding..." : "Add"}
            </Button>
          </form>
          {state.error && (
            <p className="mt-2 text-sm text-destructive">{state.error}</p>
          )}
        </CardContent>
      </Card>

      {/* Brands table */}
      {brands.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Brand</TableHead>
              <TableHead>Country</TableHead>
              <TableHead className="text-center">Watches</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {brands.map((brand) => (
              <BrandRow
                key={brand.id}
                brand={brand}
                count={watchCountByBrand.get(brand.id) ?? 0}
                deletePending={deletePending}
                onDelete={handleDelete}
              />
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-muted-foreground">
          No brands yet. Add one above or create one inline when adding a watch.
        </p>
      )}
    </div>
  )
}

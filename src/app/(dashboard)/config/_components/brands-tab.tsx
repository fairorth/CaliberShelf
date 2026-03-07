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
import { createBrand, deleteBrand } from "@/lib/actions/brand-actions"
import type { BrandActionState } from "@/lib/actions/brand-actions"
import { toast } from "sonner"
import type { Brand } from "@/lib/types/watch"

interface BrandsTabProps {
  brands: Brand[]
  watchCountByBrand: Map<string, number>
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
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {brands.map((brand) => {
              const count = watchCountByBrand.get(brand.id) ?? 0
              return (
                <TableRow key={brand.id}>
                  <TableCell className="font-medium">{brand.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {brand.country_of_origin ?? "—"}
                  </TableCell>
                  <TableCell className="text-center">{count}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      disabled={count > 0 || deletePending}
                      onClick={() => handleDelete(brand.id, brand.name)}
                      title={count > 0 ? "Cannot delete — has watches" : "Delete brand"}
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
          No brands yet. Add one above or create one inline when adding a watch.
        </p>
      )}
    </div>
  )
}

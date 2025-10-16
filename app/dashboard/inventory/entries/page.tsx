"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, TrendingUp } from "lucide-react"
import { movementStorage, productStorage } from "@/lib/storage"
import type { InventoryMovement, Product } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"

export default function EntriesPage() {
  const { user } = useAuth()
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    productId: "",
    quantity: "",
    reason: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const allMovements = movementStorage.getAll()
    setMovements(allMovements.filter((m) => m.type === "entrada"))
    setProducts(productStorage.getAll())
  }

  const getProductName = (productId: string) => {
    return products.find((p) => p.id === productId)?.name || "Producto no encontrado"
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const movement: InventoryMovement = {
      id: Date.now().toString(),
      productId: formData.productId,
      type: "entrada",
      quantity: Number.parseFloat(formData.quantity),
      reason: formData.reason,
      userId: user?.id || "",
      sucursalId: user?.sucursalId || "",
      createdAt: new Date().toISOString(),
    }

    // Actualizar stock del producto
    const allProducts = productStorage.getAll()
    const productIndex = allProducts.findIndex((p) => p.id === formData.productId)
    if (productIndex !== -1) {
      allProducts[productIndex].stock += Number.parseFloat(formData.quantity)
      productStorage.save(allProducts)
    }

    // Guardar movimiento
    const allMovements = movementStorage.getAll()
    allMovements.push(movement)
    movementStorage.save(allMovements)

    loadData()
    resetForm()
    setIsDialogOpen(false)
  }

  const resetForm = () => {
    setFormData({
      productId: "",
      quantity: "",
      reason: "",
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Entradas de Inventario</h1>
          <p className="text-muted-foreground mt-1">Registra las entradas de productos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Entrada
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Entrada</DialogTitle>
              <DialogDescription>Registra una entrada de producto al inventario</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productId">Producto</Label>
                <Select
                  value={formData.productId}
                  onValueChange={(value) => setFormData({ ...formData, productId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} (Stock actual: {product.stock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Cantidad</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Motivo</Label>
                <Input
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Ej: Compra a proveedor, Devolución, etc."
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Registrar Entrada</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader />
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead>Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No hay entradas registradas</p>
                  </TableCell>
                </TableRow>
              ) : (
                movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>{formatDate(movement.createdAt)}</TableCell>
                    <TableCell className="font-medium">{getProductName(movement.productId)}</TableCell>
                    <TableCell className="text-right font-semibold text-green-600 dark:text-green-400">
                      +{movement.quantity}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{movement.reason}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

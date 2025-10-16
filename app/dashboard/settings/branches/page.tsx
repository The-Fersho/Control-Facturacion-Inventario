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
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Store } from "lucide-react"
import { sucursalStorage, cajaStorage } from "@/lib/storage"
import type { Sucursal, Caja } from "@/lib/types"

export default function BranchesPage() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [cajas, setCajas] = useState<Caja[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSucursal, setEditingSucursal] = useState<Sucursal | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setSucursales(sucursalStorage.getAll())
    setCajas(cajaStorage.getAll())
  }

  const getCajasCount = (sucursalId: string) => {
    return cajas.filter((c) => c.sucursalId === sucursalId).length
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const sucursalData: Sucursal = {
      id: editingSucursal?.id || Date.now().toString(),
      name: formData.name,
      address: formData.address,
      phone: formData.phone,
      active: true,
    }

    const allSucursales = sucursalStorage.getAll()
    if (editingSucursal) {
      const index = allSucursales.findIndex((s) => s.id === editingSucursal.id)
      allSucursales[index] = sucursalData
    } else {
      allSucursales.push(sucursalData)
    }

    sucursalStorage.save(allSucursales)
    loadData()
    resetForm()
    setIsDialogOpen(false)
  }

  const handleEdit = (sucursal: Sucursal) => {
    setEditingSucursal(sucursal)
    setFormData({
      name: sucursal.name,
      address: sucursal.address,
      phone: sucursal.phone,
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setEditingSucursal(null)
    setFormData({
      name: "",
      address: "",
      phone: "",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sucursales</h1>
          <p className="text-muted-foreground mt-1">Gestiona las sucursales de tu negocio</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Sucursal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSucursal ? "Editar Sucursal" : "Nueva Sucursal"}</DialogTitle>
              <DialogDescription>
                {editingSucursal ? "Modifica los datos de la sucursal" : "Completa la información de la nueva sucursal"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingSucursal ? "Guardar Cambios" : "Crear Sucursal"}</Button>
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
                <TableHead>Nombre</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead className="text-right">Cajas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sucursales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <Store className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No hay sucursales registradas</p>
                  </TableCell>
                </TableRow>
              ) : (
                sucursales.map((sucursal) => (
                  <TableRow key={sucursal.id}>
                    <TableCell className="font-medium">{sucursal.name}</TableCell>
                    <TableCell>{sucursal.address}</TableCell>
                    <TableCell>{sucursal.phone}</TableCell>
                    <TableCell className="text-right">{getCajasCount(sucursal.id)}</TableCell>
                    <TableCell>
                      <Badge variant={sucursal.active ? "default" : "secondary"}>
                        {sucursal.active ? "Activa" : "Inactiva"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(sucursal)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
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

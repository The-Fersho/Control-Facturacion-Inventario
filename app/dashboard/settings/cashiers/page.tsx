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
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, CreditCard } from "lucide-react"
import { cajaStorage, sucursalStorage } from "@/lib/storage"
import type { Caja, Sucursal } from "@/lib/types"

export default function CashiersPage() {
  const [cajas, setCajas] = useState<Caja[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCaja, setEditingCaja] = useState<Caja | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    sucursalId: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setCajas(cajaStorage.getAll())
    setSucursales(sucursalStorage.getAll())
  }

  const getSucursalName = (sucursalId: string) => {
    return sucursales.find((s) => s.id === sucursalId)?.name || "Sin sucursal"
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const cajaData: Caja = {
      id: editingCaja?.id || Date.now().toString(),
      name: formData.name,
      sucursalId: formData.sucursalId,
      active: true,
    }

    const allCajas = cajaStorage.getAll()
    if (editingCaja) {
      const index = allCajas.findIndex((c) => c.id === editingCaja.id)
      allCajas[index] = cajaData
    } else {
      allCajas.push(cajaData)
    }

    cajaStorage.save(allCajas)
    loadData()
    resetForm()
    setIsDialogOpen(false)
  }

  const handleEdit = (caja: Caja) => {
    setEditingCaja(caja)
    setFormData({
      name: caja.name,
      sucursalId: caja.sucursalId,
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setEditingCaja(null)
    setFormData({
      name: "",
      sucursalId: "",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cajas</h1>
          <p className="text-muted-foreground mt-1">Gestiona las cajas registradoras de tu negocio</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Caja
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCaja ? "Editar Caja" : "Nueva Caja"}</DialogTitle>
              <DialogDescription>
                {editingCaja ? "Modifica los datos de la caja" : "Completa la información de la nueva caja"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Caja</Label>
                <Input
                  id="name"
                  placeholder="Ej: Caja 1, Caja Principal"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sucursalId">Sucursal</Label>
                <Select
                  value={formData.sucursalId}
                  onValueChange={(value) => setFormData({ ...formData, sucursalId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona sucursal" />
                  </SelectTrigger>
                  <SelectContent>
                    {sucursales.map((sucursal) => (
                      <SelectItem key={sucursal.id} value={sucursal.id}>
                        {sucursal.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingCaja ? "Guardar Cambios" : "Crear Caja"}</Button>
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
                <TableHead>Sucursal</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cajas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No hay cajas registradas</p>
                  </TableCell>
                </TableRow>
              ) : (
                cajas.map((caja) => (
                  <TableRow key={caja.id}>
                    <TableCell className="font-medium">{caja.name}</TableCell>
                    <TableCell>{getSucursalName(caja.sucursalId)}</TableCell>
                    <TableCell>
                      <Badge variant={caja.active ? "default" : "secondary"}>
                        {caja.active ? "Activa" : "Inactiva"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(caja)}>
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

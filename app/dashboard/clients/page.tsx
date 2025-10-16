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
import { Plus, Search, Edit, Trash2, Users, Eye } from "lucide-react"
import { clientStorage, saleStorage, creditStorage } from "@/lib/storage"
import type { Client, Sale, Credit } from "@/lib/types"

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientSales, setClientSales] = useState<Sale[]>([])
  const [clientCredits, setClientCredits] = useState<Credit[]>([])

  const [formData, setFormData] = useState({
    name: "",
    rfc: "",
    email: "",
    phone: "",
    address: "",
    creditLimit: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setClients(clientStorage.getAll())
  }

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm) ||
      (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const clientData: Client = {
      id: editingClient?.id || Date.now().toString(),
      name: formData.name,
      rfc: formData.rfc,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      creditLimit: Number.parseFloat(formData.creditLimit),
      currentCredit: editingClient?.currentCredit || 0,
      active: true,
      createdAt: editingClient?.createdAt || new Date().toISOString(),
    }

    const allClients = clientStorage.getAll()
    if (editingClient) {
      const index = allClients.findIndex((c) => c.id === editingClient.id)
      allClients[index] = clientData
    } else {
      allClients.push(clientData)
    }

    clientStorage.save(allClients)
    loadData()
    resetForm()
    setIsDialogOpen(false)
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setFormData({
      name: client.name,
      rfc: client.rfc || "",
      email: client.email || "",
      phone: client.phone,
      address: client.address,
      creditLimit: client.creditLimit.toString(),
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar este cliente?")) {
      const allClients = clientStorage.getAll().filter((c) => c.id !== id)
      clientStorage.save(allClients)
      loadData()
    }
  }

  const handleViewDetails = (client: Client) => {
    setSelectedClient(client)
    const sales = saleStorage.getAll().filter((s) => s.clientId === client.id)
    const credits = creditStorage.getAll().filter((c) => c.clientId === client.id)
    setClientSales(sales)
    setClientCredits(credits)
    setIsDetailDialogOpen(true)
  }

  const resetForm = () => {
    setEditingClient(null)
    setFormData({
      name: "",
      rfc: "",
      email: "",
      phone: "",
      address: "",
      creditLimit: "",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount)
  }

  const getCreditStatus = (client: Client) => {
    const percentage = (client.currentCredit / client.creditLimit) * 100
    if (percentage >= 90) return { label: "Crítico", variant: "destructive" as const }
    if (percentage >= 70) return { label: "Alto", variant: "default" as const }
    if (percentage > 0) return { label: "Normal", variant: "secondary" as const }
    return { label: "Sin crédito", variant: "outline" as const }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground mt-1">Gestiona tu cartera de clientes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingClient ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
              <DialogDescription>
                {editingClient ? "Modifica los datos del cliente" : "Completa la información del nuevo cliente"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="name">Nombre / Razón Social</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rfc">RFC</Label>
                  <Input
                    id="rfc"
                    value={formData.rfc}
                    onChange={(e) => setFormData({ ...formData, rfc: e.target.value })}
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

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="creditLimit">Límite de Crédito</Label>
                  <Input
                    id="creditLimit"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingClient ? "Guardar Cambios" : "Crear Cliente"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, teléfono o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Límite Crédito</TableHead>
                <TableHead className="text-right">Crédito Actual</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No hay clientes registrados</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => {
                  const status = getCreditStatus(client)
                  return (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.phone}</TableCell>
                      <TableCell className="text-muted-foreground">{client.email || "-"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(client.creditLimit)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(client.currentCredit)}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => handleViewDetails(client)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(client)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(client.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de detalles del cliente */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Cliente</DialogTitle>
            <DialogDescription>Información completa y historial del cliente</DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-6">
              {/* Información del cliente */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-medium">{selectedClient.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">RFC</p>
                  <p className="font-medium">{selectedClient.rfc || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Teléfono</p>
                  <p className="font-medium">{selectedClient.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedClient.email || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Dirección</p>
                  <p className="font-medium">{selectedClient.address}</p>
                </div>
              </div>

              {/* Información de crédito */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Información de Crédito</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Límite de Crédito</p>
                    <p className="text-lg font-bold">{formatCurrency(selectedClient.creditLimit)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Crédito Utilizado</p>
                    <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      {formatCurrency(selectedClient.currentCredit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Crédito Disponible</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(selectedClient.creditLimit - selectedClient.currentCredit)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Historial de ventas */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Historial de Ventas ({clientSales.length})</h3>
                {clientSales.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay ventas registradas</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {clientSales.slice(0, 5).map((sale) => (
                      <div key={sale.id} className="flex justify-between items-center p-2 bg-muted rounded">
                        <div>
                          <p className="text-sm font-medium">Folio: {sale.folio}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(sale.createdAt).toLocaleDateString("es-MX")}
                          </p>
                        </div>
                        <p className="font-semibold">{formatCurrency(sale.total)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Créditos activos */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">
                  Créditos Activos ({clientCredits.filter((c) => c.status === "pendiente").length})
                </h3>
                {clientCredits.filter((c) => c.status === "pendiente").length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay créditos pendientes</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {clientCredits
                      .filter((c) => c.status === "pendiente")
                      .map((credit) => (
                        <div key={credit.id} className="flex justify-between items-center p-2 bg-muted rounded">
                          <div>
                            <p className="text-sm font-medium">Monto: {formatCurrency(credit.amount)}</p>
                            <p className="text-xs text-muted-foreground">
                              Vence: {new Date(credit.dueDate).toLocaleDateString("es-MX")}
                            </p>
                          </div>
                          <p className="font-semibold text-orange-600 dark:text-orange-400">
                            {formatCurrency(credit.balance)}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

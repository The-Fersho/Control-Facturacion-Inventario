"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CreditCard, DollarSign, Search, Eye } from "lucide-react"
import { creditStorage, clientStorage, paymentStorage, saleStorage } from "@/lib/storage"
import type { Credit, Client, Payment } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"

export default function CreditsPage() {
  const { user } = useAuth()
  const [credits, setCredits] = useState<Credit[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "tarjeta" | "transferencia">("efectivo")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setCredits(creditStorage.getAll())
    setClients(clientStorage.getAll())
    setPayments(paymentStorage.getAll())
  }

  const getClientName = (clientId: string) => {
    return clients.find((c) => c.id === clientId)?.name || "Cliente no encontrado"
  }

  const getSaleInfo = (saleId: string) => {
    const sales = saleStorage.getAll()
    return sales.find((s) => s.id === saleId)
  }

  const getCreditPayments = (creditId: string) => {
    return payments.filter((p) => p.creditId === creditId)
  }

  const filteredCredits = credits.filter((credit) => {
    const matchesSearch = getClientName(credit.clientId).toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || credit.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedCredit) return

    const amount = Number.parseFloat(paymentAmount)

    if (amount <= 0) {
      alert("El monto debe ser mayor a 0")
      return
    }

    if (amount > selectedCredit.balance) {
      alert("El monto no puede ser mayor al saldo pendiente")
      return
    }

    // Crear pago
    const payment: Payment = {
      id: Date.now().toString(),
      creditId: selectedCredit.id,
      amount,
      paymentMethod,
      userId: user?.id || "",
      createdAt: new Date().toISOString(),
    }

    const allPayments = paymentStorage.getAll()
    allPayments.push(payment)
    paymentStorage.save(allPayments)

    // Actualizar crédito
    const allCredits = creditStorage.getAll()
    const creditIndex = allCredits.findIndex((c) => c.id === selectedCredit.id)
    if (creditIndex !== -1) {
      const newBalance = allCredits[creditIndex].balance - amount
      allCredits[creditIndex].balance = newBalance
      allCredits[creditIndex].status = newBalance === 0 ? "pagado" : "pendiente"
      creditStorage.save(allCredits)

      // Actualizar crédito del cliente
      const allClients = clientStorage.getAll()
      const clientIndex = allClients.findIndex((c) => c.id === selectedCredit.clientId)
      if (clientIndex !== -1) {
        allClients[clientIndex].currentCredit -= amount
        clientStorage.save(allClients)
      }
    }

    loadData()
    setIsPaymentDialogOpen(false)
    setPaymentAmount("")
    setSelectedCredit(null)
  }

  const handleViewDetails = (credit: Credit) => {
    setSelectedCredit(credit)
    setIsDetailDialogOpen(true)
  }

  const handleOpenPayment = (credit: Credit) => {
    setSelectedCredit(credit)
    setPaymentAmount(credit.balance.toString())
    setIsPaymentDialogOpen(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusBadge = (credit: Credit) => {
    if (credit.status === "pagado") {
      return <Badge variant="default">Pagado</Badge>
    }
    if (credit.status === "vencido") {
      return <Badge variant="destructive">Vencido</Badge>
    }

    const dueDate = new Date(credit.dueDate)
    const today = new Date()
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilDue < 0) {
      return <Badge variant="destructive">Vencido</Badge>
    }
    if (daysUntilDue <= 7) {
      return <Badge variant="default">Por vencer</Badge>
    }
    return <Badge variant="secondary">Pendiente</Badge>
  }

  const totalPending = credits.filter((c) => c.status === "pendiente").reduce((sum, credit) => sum + credit.balance, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Créditos y Abonos</h1>
          <p className="text-muted-foreground mt-1">Gestiona las cuentas por cobrar</p>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total por Cobrar</p>
                <h3 className="text-2xl font-bold mt-2">{formatCurrency(totalPending)}</h3>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Créditos Activos</p>
                <h3 className="text-2xl font-bold mt-2">{credits.filter((c) => c.status === "pendiente").length}</h3>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Créditos Pagados</p>
                <h3 className="text-2xl font-bold mt-2">{credits.filter((c) => c.status === "pagado").length}</h3>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pendiente">Pendientes</SelectItem>
                <SelectItem value="pagado">Pagados</SelectItem>
                <SelectItem value="vencido">Vencidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead className="text-right">Monto Original</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCredits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No hay créditos registrados</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCredits.map((credit) => (
                  <TableRow key={credit.id}>
                    <TableCell className="font-medium">{getClientName(credit.clientId)}</TableCell>
                    <TableCell>{formatDate(credit.createdAt)}</TableCell>
                    <TableCell>{formatDate(credit.dueDate)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(credit.amount)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(credit.balance)}</TableCell>
                    <TableCell>{getStatusBadge(credit)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => handleViewDetails(credit)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {credit.status === "pendiente" && (
                          <Button size="sm" onClick={() => handleOpenPayment(credit)}>
                            <DollarSign className="w-4 h-4 mr-1" />
                            Abonar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de pago */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Abono</DialogTitle>
            <DialogDescription>Ingresa el monto del abono a realizar</DialogDescription>
          </DialogHeader>
          {selectedCredit && (
            <form onSubmit={handlePayment} className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-medium">{getClientName(selectedCredit.clientId)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Saldo Pendiente:</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    {formatCurrency(selectedCredit.balance)}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="amount">Monto del Abono</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedCredit.balance}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Método de Pago</Label>
                <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Registrar Abono</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de detalles */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Crédito</DialogTitle>
            <DialogDescription>Información completa y historial de pagos</DialogDescription>
          </DialogHeader>
          {selectedCredit && (
            <div className="space-y-6">
              {/* Información del crédito */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{getClientName(selectedCredit.clientId)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Folio de Venta</p>
                  <p className="font-medium font-mono">{getSaleInfo(selectedCredit.saleId)?.folio || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Crédito</p>
                  <p className="font-medium">{formatDate(selectedCredit.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Vencimiento</p>
                  <p className="font-medium">{formatDate(selectedCredit.dueDate)}</p>
                </div>
              </div>

              <Separator />

              {/* Montos */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Monto Original</p>
                  <p className="text-lg font-bold">{formatCurrency(selectedCredit.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Abonado</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(selectedCredit.amount - selectedCredit.balance)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Pendiente</p>
                  <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {formatCurrency(selectedCredit.balance)}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Historial de pagos */}
              <div>
                <h3 className="font-semibold mb-3">Historial de Abonos</h3>
                {getCreditPayments(selectedCredit.id).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay abonos registrados</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {getCreditPayments(selectedCredit.id).map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center p-3 bg-muted rounded">
                        <div>
                          <p className="text-sm font-medium">{formatCurrency(payment.amount)}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(payment.createdAt).toLocaleString("es-MX")} - {payment.paymentMethod}
                          </p>
                        </div>
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

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { FileText, Search, Printer } from "lucide-react"
import { saleStorage, clientStorage, companyStorage } from "@/lib/storage"
import type { Sale } from "@/lib/types"

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const allSales = saleStorage.getAll()
    setSales(allSales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
  }

  const filteredSales = sales.filter((sale) => sale.folio.toLowerCase().includes(searchTerm.toLowerCase()))

  const getClientName = (clientId?: string) => {
    if (!clientId) return "Público General"
    const clients = clientStorage.getAll()
    return clients.find((c) => c.id === clientId)?.name || "Cliente no encontrado"
  }

  const getClient = (clientId?: string) => {
    if (!clientId) return null
    const clients = clientStorage.getAll()
    return clients.find((c) => c.id === clientId)
  }

  const handlePrintSale = (sale: Sale) => {
    setSelectedSale(sale)
    setIsPrintDialogOpen(true)
  }

  const handlePrint = () => {
    window.print()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount)
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

  const company = companyStorage.get()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Historial de Ventas</h1>
        <p className="text-muted-foreground mt-1">Consulta todas las ventas realizadas</p>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por folio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Folio</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Método de Pago</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No hay ventas registradas</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-mono font-medium">{sale.folio}</TableCell>
                    <TableCell>{formatDate(sale.createdAt)}</TableCell>
                    <TableCell>{getClientName(sale.clientId)}</TableCell>
                    <TableCell className="capitalize">{sale.paymentMethod}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(sale.total)}</TableCell>
                    <TableCell>
                      <Badge variant={sale.status === "completada" ? "default" : "destructive"}>
                        {sale.status === "completada" ? "Completada" : "Cancelada"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => handlePrintSale(sale)}>
                        <Printer className="w-4 h-4 mr-1" />
                        Imprimir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de impresión */}
      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="print:hidden">
            <DialogTitle>
              {selectedSale?.documentType === "ticket" ? "Ticket de Venta" : "Factura"} - {selectedSale?.folio}
            </DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              {/* Contenido del documento para imprimir */}
              <div id="printable-document" className="print:p-8">
                {selectedSale.documentType === "ticket" ? (
                  // Formato de Ticket
                  <div className="space-y-4 max-w-sm mx-auto">
                    <div className="text-center border-b pb-4">
                      <h2 className="text-2xl font-bold">{company?.name || "Mi Empresa"}</h2>
                      <p className="text-sm text-muted-foreground">{company?.address}</p>
                      <p className="text-sm text-muted-foreground">Tel: {company?.phone}</p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Folio:</span>
                        <span className="font-mono font-semibold">{selectedSale.folio}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fecha:</span>
                        <span>{new Date(selectedSale.createdAt).toLocaleString("es-MX")}</span>
                      </div>
                      {selectedSale.clientId && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cliente:</span>
                          <span>{getClientName(selectedSale.clientId)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Método de Pago:</span>
                        <span className="capitalize">{selectedSale.paymentMethod}</span>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      {selectedSale.items.map((item, index) => (
                        <div key={index} className="text-sm">
                          <div className="flex justify-between font-medium">
                            <span>{item.productName}</span>
                            <span>{formatCurrency(item.subtotal)}</span>
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {item.quantity} x {formatCurrency(item.price)}
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span>{formatCurrency(selectedSale.subtotal)}</span>
                      </div>
                      {selectedSale.discount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Descuento:</span>
                          <span className="text-red-600">-{formatCurrency(selectedSale.discount)}</span>
                        </div>
                      )}
                      {selectedSale.iva > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">IVA ({company?.ivaRate || 16}%):</span>
                          <span>{formatCurrency(selectedSale.iva)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-primary">{formatCurrency(selectedSale.total)}</span>
                      </div>
                    </div>

                    <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                      <p>Gracias por su compra</p>
                    </div>
                  </div>
                ) : (
                  // Formato de Factura
                  <div className="space-y-6">
                    {/* Encabezado de la factura */}
                    <div className="flex justify-between items-start border-b pb-4">
                      <div>
                        <h2 className="text-3xl font-bold">{company?.name || "Mi Empresa"}</h2>
                        <p className="text-sm text-muted-foreground mt-2">{company?.address}</p>
                        <p className="text-sm text-muted-foreground">Tel: {company?.phone}</p>
                        <p className="text-sm text-muted-foreground">Email: {company?.email}</p>
                        <p className="text-sm font-semibold mt-2">RFC: {company?.rfc}</p>
                      </div>
                      <div className="text-right">
                        <h3 className="text-2xl font-bold text-primary">FACTURA</h3>
                        <p className="text-sm text-muted-foreground mt-2">Folio:</p>
                        <p className="text-lg font-mono font-bold">{selectedSale.folio}</p>
                        <p className="text-sm text-muted-foreground mt-2">Fecha:</p>
                        <p className="text-sm">{new Date(selectedSale.createdAt).toLocaleDateString("es-MX")}</p>
                      </div>
                    </div>

                    {/* Datos del cliente */}
                    {selectedSale.clientId && getClient(selectedSale.clientId) && (
                      <div className="border rounded-lg p-4 bg-muted/50">
                        <h4 className="font-semibold mb-2">Datos del Cliente</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Nombre:</p>
                            <p className="font-medium">{getClient(selectedSale.clientId)?.name}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">RFC:</p>
                            <p className="font-medium">{getClient(selectedSale.clientId)?.rfc || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Email:</p>
                            <p className="font-medium">{getClient(selectedSale.clientId)?.email || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Teléfono:</p>
                            <p className="font-medium">{getClient(selectedSale.clientId)?.phone}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tabla de productos */}
                    <div>
                      <table className="w-full text-sm">
                        <thead className="border-b-2">
                          <tr className="text-left">
                            <th className="pb-2">Cantidad</th>
                            <th className="pb-2">Descripción</th>
                            <th className="pb-2 text-right">Precio Unit.</th>
                            <th className="pb-2 text-right">Importe</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedSale.items.map((item, index) => (
                            <tr key={index} className="border-b">
                              <td className="py-3">{item.quantity}</td>
                              <td className="py-3">{item.productName}</td>
                              <td className="py-3 text-right">{formatCurrency(item.price)}</td>
                              <td className="py-3 text-right font-medium">{formatCurrency(item.subtotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Totales */}
                    <div className="flex justify-end">
                      <div className="w-64 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal:</span>
                          <span className="font-medium">{formatCurrency(selectedSale.subtotal)}</span>
                        </div>
                        {selectedSale.discount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Descuento:</span>
                            <span className="font-medium text-red-600">-{formatCurrency(selectedSale.discount)}</span>
                          </div>
                        )}
                        {selectedSale.iva > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">IVA ({company?.ivaRate || 16}%):</span>
                            <span className="font-medium">{formatCurrency(selectedSale.iva)}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total:</span>
                          <span className="text-primary">{formatCurrency(selectedSale.total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Método de pago */}
                    <div className="border-t pt-4">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Método de Pago:</span>{" "}
                        <span className="font-medium capitalize">{selectedSale.paymentMethod}</span>
                      </p>
                    </div>

                    {/* Pie de página */}
                    <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                      <p>Este documento es una representación impresa de un CFDI</p>
                      <p className="mt-2">Gracias por su preferencia</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Botones de acción (no se imprimen) */}
              <div className="flex gap-2 print:hidden">
                <Button className="flex-1" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setIsPrintDialogOpen(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-document,
          #printable-document * {
            visibility: visible;
          }
          #printable-document {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:p-8 {
            padding: 2rem;
          }
        }
      `}</style>
    </div>
  )
}

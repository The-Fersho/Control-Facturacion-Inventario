"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Plus, Minus, Trash2, ShoppingCart, Receipt, X, Printer, FileText } from "lucide-react"
import {
  productStorage,
  clientStorage,
  saleStorage,
  creditStorage,
  cajaStorage,
  companyStorage,
  movementStorage,
  priceConfigStorage,
} from "@/lib/storage"
import type { Product, Client, Sale, SaleItem, Credit, InventoryMovement } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"

export default function POSPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [cart, setCart] = useState<SaleItem[]>([])
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "tarjeta" | "transferencia" | "credito">("efectivo")
  const [discount, setDiscount] = useState<number>(0)
  const [includeIVA, setIncludeIVA] = useState(true)
  const [documentType, setDocumentType] = useState<"ticket" | "factura">("ticket")
  const [priceType, setPriceType] = useState<"price1" | "price2" | "price3" | "price4">("price1")
  const [priceConfig, setPriceConfig] = useState({
    price1Name: "Precio General",
    price2Name: "Precio con Descuento",
    price3Name: "Precio Mayorista",
    price4Name: "Precio Mayorista Especial",
  })
  const [isTicketOpen, setIsTicketOpen] = useState(false)
  const [lastSale, setLastSale] = useState<Sale | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setProducts(productStorage.getAll().filter((p) => p.active && p.stock > 0))
    setClients(clientStorage.getAll().filter((c) => c.active))
    const config = priceConfigStorage.get()
    if (config) {
      setPriceConfig({
        price1Name: config.price1Name,
        price2Name: config.price2Name,
        price3Name: config.price3Name,
        price4Name: config.price4Name,
      })
    }
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.productId === product.id)

    const selectedPrice = product[priceType] || product.price

    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        alert("No hay suficiente stock disponible")
        return
      }
      setCart(
        cart.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.price,
              }
            : item,
        ),
      )
    } else {
      const newItem: SaleItem = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: selectedPrice,
        discount: 0,
        subtotal: selectedPrice,
      }
      setCart([...cart, newItem])
    }
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return

    if (newQuantity > product.stock) {
      alert("No hay suficiente stock disponible")
      return
    }

    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCart(
      cart.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: newQuantity,
              subtotal: newQuantity * item.price,
            }
          : item,
      ),
    )
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId))
  }

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
    const discountAmount = (subtotal * discount) / 100
    const subtotalAfterDiscount = subtotal - discountAmount
    const ivaAmount = includeIVA ? subtotalAfterDiscount * 0.16 : 0
    const total = subtotalAfterDiscount + ivaAmount

    return {
      subtotal,
      discountAmount,
      subtotalAfterDiscount,
      ivaAmount,
      total,
    }
  }

  const handleCompleteSale = () => {
    if (cart.length === 0) {
      alert("El carrito está vacío")
      return
    }

    // Validar crédito si es necesario
    if (paymentMethod === "credito") {
      if (!selectedClient) {
        alert("Debes seleccionar un cliente para ventas a crédito")
        return
      }

      const client = clients.find((c) => c.id === selectedClient)
      if (!client) return

      const totals = calculateTotals()
      const availableCredit = client.creditLimit - client.currentCredit

      if (totals.total > availableCredit) {
        alert(`El cliente no tiene suficiente crédito disponible. Disponible: ${formatCurrency(availableCredit)}`)
        return
      }
    }

    // Verificar stock disponible
    for (const item of cart) {
      const product = products.find((p) => p.id === item.productId)
      if (!product || product.stock < item.quantity) {
        alert(`Stock insuficiente para ${item.productName}`)
        return
      }
    }

    const totals = calculateTotals()
    const cajas = cajaStorage.getAll()
    const caja = cajas.find((c) => c.sucursalId === user?.sucursalId && c.active)

    // Crear venta
    const sale: Sale = {
      id: Date.now().toString(),
      folio: `V-${Date.now()}`,
      clientId: selectedClient || undefined,
      userId: user?.id || "",
      sucursalId: user?.sucursalId || "",
      cajaId: caja?.id || "",
      subtotal: totals.subtotal,
      discount: totals.discountAmount,
      iva: totals.ivaAmount,
      total: totals.total,
      paymentMethod,
      status: "completada",
      items: cart,
      createdAt: new Date().toISOString(),
    }

    // Guardar venta
    const allSales = saleStorage.getAll()
    allSales.push(sale)
    saleStorage.save(allSales)

    // Actualizar inventario
    const allProducts = productStorage.getAll()
    cart.forEach((item) => {
      const productIndex = allProducts.findIndex((p) => p.id === item.productId)
      if (productIndex !== -1) {
        allProducts[productIndex].stock -= item.quantity

        // Registrar movimiento de inventario
        const movement: InventoryMovement = {
          id: `${Date.now()}-${item.productId}`,
          productId: item.productId,
          type: "salida",
          quantity: item.quantity,
          reason: `Venta ${sale.folio}`,
          userId: user?.id || "",
          sucursalId: user?.sucursalId || "",
          createdAt: new Date().toISOString(),
        }
        const allMovements = movementStorage.getAll()
        allMovements.push(movement)
        movementStorage.save(allMovements)
      }
    })
    productStorage.save(allProducts)

    // Si es a crédito, crear registro de crédito
    if (paymentMethod === "credito" && selectedClient) {
      const credit: Credit = {
        id: Date.now().toString(),
        clientId: selectedClient,
        saleId: sale.id,
        amount: totals.total,
        balance: totals.total,
        status: "pendiente",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días
        createdAt: new Date().toISOString(),
      }

      const allCredits = creditStorage.getAll()
      allCredits.push(credit)
      creditStorage.save(allCredits)

      // Actualizar crédito del cliente
      const allClients = clientStorage.getAll()
      const clientIndex = allClients.findIndex((c) => c.id === selectedClient)
      if (clientIndex !== -1) {
        allClients[clientIndex].currentCredit += totals.total
        clientStorage.save(allClients)
      }
    }

    // Mostrar ticket
    setLastSale(sale)
    setIsTicketOpen(true)

    // Limpiar carrito
    setCart([])
    setSelectedClient("")
    setDiscount(0)
    setPaymentMethod("efectivo")
    loadData()
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

  const totals = calculateTotals()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Punto de Venta</h1>
        <p className="text-muted-foreground mt-1">Realiza ventas y genera tickets</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Panel de productos */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar productos por nombre o código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm whitespace-nowrap">Tipo de Precio:</Label>
                  <Select value={priceType} onValueChange={(value: any) => setPriceType(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price1">{priceConfig.price1Name}</SelectItem>
                      <SelectItem value="price2">{priceConfig.price2Name}</SelectItem>
                      <SelectItem value="price3">{priceConfig.price3Name}</SelectItem>
                      <SelectItem value="price4">{priceConfig.price4Name}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto">
                {filteredProducts.map((product) => {
                  const displayPrice = product[priceType] || product.price
                  return (
                    <Card
                      key={product.id}
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => addToCart(product)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          {product.imageUrl && (
                            <div className="w-full h-24 mb-2">
                              <img
                                src={product.imageUrl || "/placeholder.svg"}
                                alt={product.name}
                                className="w-full h-full object-cover rounded"
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.svg?height=96&width=96"
                                }}
                              />
                            </div>
                          )}
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {product.stock}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{product.code}</p>
                          <p className="text-lg font-bold text-primary">{formatCurrency(displayPrice)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel de carrito */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Carrito ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Items del carrito */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">El carrito está vacío</p>
                ) : (
                  cart.map((item) => (
                    <div key={item.productId} className="flex items-center gap-2 p-2 bg-muted rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.productId, Number.parseInt(e.target.value) || 0)}
                          className="w-12 h-7 text-center p-0"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-sm font-semibold w-20 text-right">{formatCurrency(item.subtotal)}</p>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              <Separator />

              {/* Opciones de venta */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Cliente (Opcional)</Label>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin cliente</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Método de Pago</Label>
                  <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="credito">Crédito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Documento</Label>
                  <Select value={documentType} onValueChange={(value: any) => setDocumentType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ticket">
                        <div className="flex items-center gap-2">
                          <Receipt className="w-4 h-4" />
                          <span>Ticket</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="factura">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span>Factura</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Descuento (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={discount}
                    onChange={(e) => setDiscount(Number.parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="includeIVA"
                    checked={includeIVA}
                    onChange={(e) => setIncludeIVA(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="includeIVA" className="cursor-pointer">
                    Incluir IVA (16%)
                  </Label>
                </div>
              </div>

              <Separator />

              {/* Totales */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Descuento ({discount}%):</span>
                    <span className="font-medium text-red-600">-{formatCurrency(totals.discountAmount)}</span>
                  </div>
                )}
                {includeIVA && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IVA (16%):</span>
                    <span className="font-medium">{formatCurrency(totals.ivaAmount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-primary">{formatCurrency(totals.total)}</span>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="space-y-2 pt-2">
                <Button className="w-full" size="lg" onClick={handleCompleteSale} disabled={cart.length === 0}>
                  <Receipt className="w-4 h-4 mr-2" />
                  Completar Venta
                </Button>
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => {
                    setCart([])
                    setSelectedClient("")
                    setDiscount(0)
                  }}
                  disabled={cart.length === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpiar Carrito
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de ticket */}
      <Dialog open={isTicketOpen} onOpenChange={setIsTicketOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="print:hidden">
            <DialogTitle>Venta Completada - {documentType === "ticket" ? "Ticket" : "Factura"}</DialogTitle>
          </DialogHeader>
          {lastSale && (
            <div className="space-y-4">
              {/* Contenido del documento para imprimir */}
              <div id="printable-document" className="print:p-8">
                {documentType === "ticket" ? (
                  // Formato de Ticket
                  <div className="space-y-4 max-w-sm mx-auto">
                    <div className="text-center border-b pb-4">
                      <h2 className="text-2xl font-bold">{companyStorage.get()?.name || "Mi Empresa"}</h2>
                      <p className="text-sm text-muted-foreground">{companyStorage.get()?.address}</p>
                      <p className="text-sm text-muted-foreground">Tel: {companyStorage.get()?.phone}</p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Folio:</span>
                        <span className="font-mono font-semibold">{lastSale.folio}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fecha:</span>
                        <span>{new Date(lastSale.createdAt).toLocaleString("es-MX")}</span>
                      </div>
                      {lastSale.clientId && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cliente:</span>
                          <span>{clients.find((c) => c.id === lastSale.clientId)?.name}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Método de Pago:</span>
                        <span className="capitalize">{lastSale.paymentMethod}</span>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      {lastSale.items.map((item, index) => (
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
                        <span>{formatCurrency(lastSale.subtotal)}</span>
                      </div>
                      {lastSale.discount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Descuento:</span>
                          <span className="text-red-600">-{formatCurrency(lastSale.discount)}</span>
                        </div>
                      )}
                      {lastSale.iva > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">IVA:</span>
                          <span>{formatCurrency(lastSale.iva)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-primary">{formatCurrency(lastSale.total)}</span>
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
                        <h2 className="text-3xl font-bold">{companyStorage.get()?.name || "Mi Empresa"}</h2>
                        <p className="text-sm text-muted-foreground mt-2">{companyStorage.get()?.address}</p>
                        <p className="text-sm text-muted-foreground">Tel: {companyStorage.get()?.phone}</p>
                        <p className="text-sm text-muted-foreground">Email: {companyStorage.get()?.email}</p>
                        <p className="text-sm font-semibold mt-2">RFC: {companyStorage.get()?.rfc}</p>
                      </div>
                      <div className="text-right">
                        <h3 className="text-2xl font-bold text-primary">FACTURA</h3>
                        <p className="text-sm text-muted-foreground mt-2">Folio:</p>
                        <p className="text-lg font-mono font-bold">{lastSale.folio}</p>
                        <p className="text-sm text-muted-foreground mt-2">Fecha:</p>
                        <p className="text-sm">{new Date(lastSale.createdAt).toLocaleDateString("es-MX")}</p>
                      </div>
                    </div>

                    {/* Datos del cliente */}
                    {lastSale.clientId && (
                      <div className="border rounded-lg p-4 bg-muted/50">
                        <h4 className="font-semibold mb-2">Datos del Cliente</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Nombre:</p>
                            <p className="font-medium">{clients.find((c) => c.id === lastSale.clientId)?.name}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">RFC:</p>
                            <p className="font-medium">
                              {clients.find((c) => c.id === lastSale.clientId)?.rfc || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Email:</p>
                            <p className="font-medium">{clients.find((c) => c.id === lastSale.clientId)?.email}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Teléfono:</p>
                            <p className="font-medium">{clients.find((c) => c.id === lastSale.clientId)?.phone}</p>
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
                          {lastSale.items.map((item, index) => (
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
                          <span className="font-medium">{formatCurrency(lastSale.subtotal)}</span>
                        </div>
                        {lastSale.discount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Descuento:</span>
                            <span className="font-medium text-red-600">-{formatCurrency(lastSale.discount)}</span>
                          </div>
                        )}
                        {lastSale.iva > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">IVA (16%):</span>
                            <span className="font-medium">{formatCurrency(lastSale.iva)}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total:</span>
                          <span className="text-primary">{formatCurrency(lastSale.total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Método de pago */}
                    <div className="border-t pt-4">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Método de Pago:</span>{" "}
                        <span className="font-medium capitalize">{lastSale.paymentMethod}</span>
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
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setIsTicketOpen(false)}>
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

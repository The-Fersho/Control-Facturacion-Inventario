// Tipos principales de la aplicación

export interface User {
  id: string
  username: string
  password: string
  name: string
  role: "admin" | "cajero" | "gerente"
  sucursalId: string
  cajaId?: string // Asignar usuario a caja específica
  active: boolean
  createdAt: string
}

export interface Company {
  id: string
  name: string
  rfc: string
  address: string
  phone: string
  email: string
  logo?: string
  ivaRate: number // IVA configurable (por defecto 16%)
}

export interface Sucursal {
  id: string
  name: string
  address: string
  phone: string
  active: boolean
}

export interface Caja {
  id: string
  name: string
  sucursalId: string
  active: boolean
}

export interface Category {
  id: string
  name: string
  description: string
}

export interface Product {
  id: string
  code: string
  name: string
  description: string
  categoryId: string
  price1: number // Precio general
  price2: number // Precio con descuento
  price3: number // Precio mayorista
  price4: number // Precio mayorista especial
  cost: number
  stock: number
  minStock: number
  sucursalId: string
  active: boolean
  createdAt: string
}

export interface Client {
  id: string
  name: string
  rfc?: string
  email?: string
  phone: string
  address: string
  creditLimit: number
  currentCredit: number
  active: boolean
  createdAt: string
}

export interface Sale {
  id: string
  folio: string
  clientId?: string
  userId: string
  sucursalId: string
  cajaId: string
  subtotal: number
  discount: number
  iva: number
  total: number
  paymentMethod: "efectivo" | "tarjeta" | "transferencia" | "credito"
  documentType: "ticket" | "factura" // Tipo de documento
  status: "completada" | "cancelada"
  items: SaleItem[]
  createdAt: string
}

export interface SaleItem {
  productId: string
  productName: string
  productCode: string // Agregar código de producto
  quantity: number
  price: number
  priceType: string // Tipo de precio usado (price1, price2, etc)
  discount: number
  subtotal: number
}

export interface Credit {
  id: string
  clientId: string
  saleId: string
  amount: number
  balance: number
  status: "pendiente" | "pagado" | "vencido"
  dueDate: string // Fecha límite configurable
  createdAt: string
}

export interface Payment {
  id: string
  creditId: string
  amount: number
  paymentMethod: "efectivo" | "tarjeta" | "transferencia"
  userId: string
  createdAt: string
}

export interface InventoryMovement {
  id: string
  productId: string
  type: "entrada" | "salida" | "ajuste"
  quantity: number
  reason: string
  userId: string
  sucursalId: string
  createdAt: string
}

export interface PriceConfig {
  id: string
  price1Name: string
  price2Name: string
  price3Name: string
  price4Name: string
}

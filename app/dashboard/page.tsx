"use client"

import { useEffect, useState } from "react"
import { StatCard } from "@/components/dashboard/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Users, ShoppingCart, DollarSign, TrendingUp, AlertTriangle } from "lucide-react"
import { productStorage, clientStorage, saleStorage, creditStorage } from "@/lib/storage"

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockProducts: 0,
    totalClients: 0,
    totalSales: 0,
    todaySales: 0,
    monthlySales: 0,
    pendingCredits: 0,
    creditAmount: 0,
  })

  useEffect(() => {
    // Cargar estadísticas
    const products = productStorage.getAll()
    const clients = clientStorage.getAll()
    const sales = saleStorage.getAll()
    const credits = creditStorage.getAll()

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todaySales = sales.filter((sale) => {
      const saleDate = new Date(sale.createdAt)
      saleDate.setHours(0, 0, 0, 0)
      return saleDate.getTime() === today.getTime() && sale.status === "completada"
    })

    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    const monthlySales = sales.filter((sale) => {
      const saleDate = new Date(sale.createdAt)
      return (
        saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear && sale.status === "completada"
      )
    })

    const pendingCredits = credits.filter((c) => c.status === "pendiente")

    setStats({
      totalProducts: products.length,
      lowStockProducts: products.filter((p) => p.stock <= p.minStock).length,
      totalClients: clients.length,
      totalSales: sales.filter((s) => s.status === "completada").length,
      todaySales: todaySales.reduce((sum, sale) => sum + sale.total, 0),
      monthlySales: monthlySales.reduce((sum, sale) => sum + sale.total, 0),
      pendingCredits: pendingCredits.length,
      creditAmount: pendingCredits.reduce((sum, credit) => sum + credit.balance, 0),
    })
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Resumen general de tu negocio</p>
      </div>

      {/* Estadísticas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Ventas de Hoy"
          value={formatCurrency(stats.todaySales)}
          icon={DollarSign}
          description="Total del día"
        />
        <StatCard
          title="Ventas del Mes"
          value={formatCurrency(stats.monthlySales)}
          icon={TrendingUp}
          description="Total mensual"
        />
        <StatCard
          title="Total de Productos"
          value={stats.totalProducts}
          icon={Package}
          description={`${stats.lowStockProducts} con stock bajo`}
        />
        <StatCard title="Clientes Registrados" value={stats.totalClients} icon={Users} description="Total activos" />
      </div>

      {/* Información adicional */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Ventas Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Total de Ventas</p>
                  <p className="text-sm text-muted-foreground">Todas las ventas completadas</p>
                </div>
                <p className="text-2xl font-bold">{stats.totalSales}</p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="font-medium">Ventas de Hoy</p>
                  <p className="text-sm text-muted-foreground">Transacciones completadas</p>
                </div>
                <p className="text-2xl font-bold text-primary">{formatCurrency(stats.todaySales)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Créditos Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Créditos Activos</p>
                  <p className="text-sm text-muted-foreground">Pendientes de pago</p>
                </div>
                <p className="text-2xl font-bold">{stats.pendingCredits}</p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="font-medium">Monto Total</p>
                  <p className="text-sm text-muted-foreground">Por cobrar</p>
                </div>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {formatCurrency(stats.creditAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {stats.lowStockProducts > 0 && (
        <Card className="border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 dark:text-orange-100">Productos con Stock Bajo</h3>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  Tienes {stats.lowStockProducts} producto{stats.lowStockProducts !== 1 ? "s" : ""} con stock bajo o
                  agotado. Considera reabastecer tu inventario.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

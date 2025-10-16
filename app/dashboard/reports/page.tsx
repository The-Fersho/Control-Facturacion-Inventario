"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar } from "recharts"
import { TrendingUp, DollarSign, Package, Calendar } from "lucide-react"
import { saleStorage, productStorage, branchStorage, userStorage } from "@/lib/storage"
import type { Sale, Product, Branch, User } from "@/lib/types"

type ReportPeriod = "daily" | "weekly" | "monthly"

export default function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>("daily")
  const [selectedBranch, setSelectedBranch] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<string>("all")
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [reportData, setReportData] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (sales.length > 0) {
      generateReport()
    }
  }, [period, sales, selectedBranch, selectedUser])

  const loadData = () => {
    setSales(saleStorage.getAll().filter((s) => s.status === "completada"))
    setProducts(productStorage.getAll())
    setBranches(branchStorage.getAll())
    setUsers(userStorage.getAll())
  }

  const generateReport = () => {
    const now = new Date()
    let filteredSales: Sale[] = []
    let chartData: any[] = []

    let salesToAnalyze = sales
    if (selectedBranch !== "all") {
      salesToAnalyze = salesToAnalyze.filter((sale) => sale.branchId === selectedBranch)
    }
    if (selectedUser !== "all") {
      salesToAnalyze = salesToAnalyze.filter((sale) => sale.userId === selectedUser)
    }

    if (period === "daily") {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      filteredSales = salesToAnalyze.filter((sale) => {
        const saleDate = new Date(sale.createdAt)
        saleDate.setHours(0, 0, 0, 0)
        return saleDate.getTime() === today.getTime()
      })

      const hourlyData: { [key: string]: number } = {}
      for (let i = 0; i < 24; i++) {
        hourlyData[`${i}:00`] = 0
      }

      filteredSales.forEach((sale) => {
        const hour = new Date(sale.createdAt).getHours()
        hourlyData[`${hour}:00`] += sale.total
      })

      chartData = Object.entries(hourlyData).map(([hour, total]) => ({
        name: hour,
        ventas: total,
      }))
    } else if (period === "weekly") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      filteredSales = salesToAnalyze.filter((sale) => new Date(sale.createdAt) >= weekAgo)

      const dailyData: { [key: string]: number } = {}
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dateStr = date.toLocaleDateString("es-MX", { weekday: "short", day: "numeric" })
        dailyData[dateStr] = 0
      }

      filteredSales.forEach((sale) => {
        const dateStr = new Date(sale.createdAt).toLocaleDateString("es-MX", { weekday: "short", day: "numeric" })
        if (dailyData[dateStr] !== undefined) {
          dailyData[dateStr] += sale.total
        }
      })

      chartData = Object.entries(dailyData).map(([day, total]) => ({
        name: day,
        ventas: total,
      }))
    } else {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      filteredSales = salesToAnalyze.filter((sale) => new Date(sale.createdAt) >= monthAgo)

      const weeklyData: { [key: string]: number } = {}
      for (let i = 4; i >= 0; i--) {
        weeklyData[`Semana ${5 - i}`] = 0
      }

      filteredSales.forEach((sale) => {
        const daysAgo = Math.floor((now.getTime() - new Date(sale.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        const weekIndex = Math.floor(daysAgo / 7)
        if (weekIndex < 5) {
          weeklyData[`Semana ${5 - weekIndex}`] += sale.total
        }
      })

      chartData = Object.entries(weeklyData).map(([week, total]) => ({
        name: week,
        ventas: total,
      }))
    }

    const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0)
    const totalTransactions = filteredSales.length
    const averageTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0

    const productSales: { [key: string]: { name: string; quantity: number; total: number } } = {}
    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.productName,
            quantity: 0,
            total: 0,
          }
        }
        productSales[item.productId].quantity += item.quantity
        productSales[item.productId].total += item.subtotal
      })
    })

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    const paymentMethods: { [key: string]: number } = {
      efectivo: 0,
      tarjeta: 0,
      transferencia: 0,
      credito: 0,
    }

    filteredSales.forEach((sale) => {
      paymentMethods[sale.paymentMethod] += sale.total
    })

    const salesByBranch: { [key: string]: { name: string; total: number; transactions: number } } = {}
    if (period === "monthly") {
      filteredSales.forEach((sale) => {
        if (!salesByBranch[sale.branchId]) {
          const branch = branches.find((b) => b.id === sale.branchId)
          salesByBranch[sale.branchId] = {
            name: branch?.name || "Sin sucursal",
            total: 0,
            transactions: 0,
          }
        }
        salesByBranch[sale.branchId].total += sale.total
        salesByBranch[sale.branchId].transactions += 1
      })
    }

    const salesByUser: { [key: string]: { name: string; total: number; transactions: number } } = {}
    filteredSales.forEach((sale) => {
      if (!salesByUser[sale.userId]) {
        const user = users.find((u) => u.id === sale.userId)
        salesByUser[sale.userId] = {
          name: user?.name || "Usuario desconocido",
          total: 0,
          transactions: 0,
        }
      }
      salesByUser[sale.userId].total += sale.total
      salesByUser[sale.userId].transactions += 1
    })

    setReportData({
      totalSales,
      totalTransactions,
      averageTicket,
      chartData,
      topProducts,
      paymentMethods,
      filteredSales,
      salesByBranch: Object.values(salesByBranch).sort((a, b) => b.total - a.total),
      salesByUser: Object.values(salesByUser).sort((a, b) => b.total - a.total),
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount)
  }

  const getPeriodLabel = () => {
    switch (period) {
      case "daily":
        return "Hoy"
      case "weekly":
        return "Últimos 7 días"
      case "monthly":
        return "Último mes"
    }
  }

  if (!reportData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reportes</h1>
          <p className="text-muted-foreground mt-1">Análisis de ventas y estadísticas</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="w-[200px]">
            <Select value={period} onValueChange={(value: ReportPeriod) => setPeriod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Reporte Diario</SelectItem>
                <SelectItem value="weekly">Reporte Semanal</SelectItem>
                <SelectItem value="monthly">Reporte Mensual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-[200px]">
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las sucursales" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las sucursales</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-[200px]">
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los usuarios" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los usuarios</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ventas Totales</p>
                <h3 className="text-2xl font-bold mt-2">{formatCurrency(reportData.totalSales)}</h3>
                <p className="text-xs text-muted-foreground mt-1">{getPeriodLabel()}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Transacciones</p>
                <h3 className="text-2xl font-bold mt-2">{reportData.totalTransactions}</h3>
                <p className="text-xs text-muted-foreground mt-1">{getPeriodLabel()}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ticket Promedio</p>
                <h3 className="text-2xl font-bold mt-2">{formatCurrency(reportData.averageTicket)}</h3>
                <p className="text-xs text-muted-foreground mt-1">Por transacción</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Productos Vendidos</p>
                <h3 className="text-2xl font-bold mt-2">
                  {reportData.topProducts.reduce((sum: number, p: any) => sum + p.quantity, 0)}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Unidades totales</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tendencia de Ventas - {getPeriodLabel()}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={reportData.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Line type="monotone" dataKey="ventas" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {period === "monthly" && reportData.salesByBranch.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ventas por Sucursal - {getPeriodLabel()}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.salesByBranch}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Productos Más Vendidos</TabsTrigger>
          <TabsTrigger value="payments">Métodos de Pago</TabsTrigger>
          {period === "monthly" && <TabsTrigger value="branches">Por Sucursal</TabsTrigger>}
          <TabsTrigger value="users">Por Usuario</TabsTrigger>
          <TabsTrigger value="transactions">Últimas Transacciones</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Productos - {getPeriodLabel()}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Cantidad Vendida</TableHead>
                    <TableHead className="text-right">Total Vendido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.topProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No hay datos disponibles
                      </TableCell>
                    </TableRow>
                  ) : (
                    reportData.topProducts.map((product: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-right">{product.quantity}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(product.total)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Ventas por Método de Pago - {getPeriodLabel()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(reportData.paymentMethods).map(([method, total]: [string, any]) => {
                  const percentage =
                    reportData.totalSales > 0 ? ((total / reportData.totalSales) * 100).toFixed(1) : "0"
                  return (
                    <div key={method} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium capitalize">{method}</span>
                        <span className="text-muted-foreground">
                          {formatCurrency(total)} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {period === "monthly" && (
          <TabsContent value="branches">
            <Card>
              <CardHeader>
                <CardTitle>Ventas por Sucursal - {getPeriodLabel()}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sucursal</TableHead>
                      <TableHead className="text-right">Transacciones</TableHead>
                      <TableHead className="text-right">Total Vendido</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.salesByBranch.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          No hay datos disponibles
                        </TableCell>
                      </TableRow>
                    ) : (
                      reportData.salesByBranch.map((branch: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{branch.name}</TableCell>
                          <TableCell className="text-right">{branch.transactions}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(branch.total)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Ventas por Usuario - {getPeriodLabel()}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead className="text-right">Transacciones</TableHead>
                    <TableHead className="text-right">Total Vendido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.salesByUser.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No hay datos disponibles
                      </TableCell>
                    </TableRow>
                  ) : (
                    reportData.salesByUser.map((user: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-right">{user.transactions}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(user.total)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Últimas Transacciones - {getPeriodLabel()}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Folio</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Método de Pago</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.filteredSales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No hay transacciones en este período
                      </TableCell>
                    </TableRow>
                  ) : (
                    reportData.filteredSales.slice(0, 20).map((sale: Sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-mono font-medium">{sale.folio}</TableCell>
                        <TableCell>{new Date(sale.createdAt).toLocaleString("es-MX")}</TableCell>
                        <TableCell className="capitalize">{sale.paymentMethod}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(sale.total)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

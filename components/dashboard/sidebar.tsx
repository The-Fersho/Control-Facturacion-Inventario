"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  CreditCard,
  FileText,
  Building2,
  Store,
  Boxes,
  TrendingUp,
  TrendingDown,
  Wallet,
} from "lucide-react"

const menuItems = [
  {
    title: "Principal",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "gerente", "cajero"] },
      { name: "Punto de Venta", href: "/dashboard/pos", icon: ShoppingCart, roles: ["admin", "gerente", "cajero"] },
    ],
  },
  {
    title: "Inventario",
    items: [
      { name: "Productos", href: "/dashboard/products", icon: Package, roles: ["admin", "gerente"] },
      { name: "Categorías", href: "/dashboard/categories", icon: Boxes, roles: ["admin", "gerente"] },
      { name: "Entradas", href: "/dashboard/inventory/entries", icon: TrendingUp, roles: ["admin", "gerente"] },
      { name: "Salidas", href: "/dashboard/inventory/exits", icon: TrendingDown, roles: ["admin", "gerente"] },
    ],
  },
  {
    title: "Ventas",
    items: [
      { name: "Clientes", href: "/dashboard/clients", icon: Users, roles: ["admin", "gerente", "cajero"] },
      { name: "Créditos", href: "/dashboard/credits", icon: CreditCard, roles: ["admin", "gerente", "cajero"] },
      { name: "Ventas", href: "/dashboard/sales", icon: FileText, roles: ["admin", "gerente", "cajero"] },
    ],
  },
  {
    title: "Configuración",
    items: [
      { name: "Empresa", href: "/dashboard/settings/company", icon: Building2, roles: ["admin"] },
      { name: "Sucursales", href: "/dashboard/settings/branches", icon: Store, roles: ["admin"] },
      { name: "Cajas", href: "/dashboard/settings/cashiers", icon: Wallet, roles: ["admin"] },
      { name: "Usuarios", href: "/dashboard/settings/users", icon: Users, roles: ["admin"] },
      { name: "Reportes", href: "/dashboard/reports", icon: FileText, roles: ["admin", "gerente"] },
    ],
  },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()

  const filteredMenuItems = menuItems
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => user && item.roles.includes(user.role)),
    }))
    .filter((section) => section.items.length > 0)

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} aria-hidden="true" />}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border transition-transform duration-300 flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-border flex-shrink-0">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">Inventario</h1>
            <p className="text-xs text-muted-foreground">Sistema de gestión</p>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {filteredMenuItems.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        )}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}

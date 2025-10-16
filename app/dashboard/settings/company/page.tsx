"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, Percent, DollarSign } from "lucide-react"
import { companyStorage, priceConfigStorage } from "@/lib/storage"
import type { Company, PriceConfig } from "@/lib/types"

export default function CompanySettingsPage() {
  const [companyData, setCompanyData] = useState({
    name: "",
    rfc: "",
    address: "",
    phone: "",
    email: "",
    ivaRate: "16",
  })

  const [priceConfig, setPriceConfig] = useState({
    price1Name: "Precio General",
    price2Name: "Precio con Descuento",
    price3Name: "Precio Mayorista",
    price4Name: "Precio Mayorista Especial",
  })

  useEffect(() => {
    const company = companyStorage.get()
    if (company) {
      setCompanyData({
        name: company.name,
        rfc: company.rfc,
        address: company.address,
        phone: company.phone,
        email: company.email,
        ivaRate: company.ivaRate?.toString() || "16",
      })
    }

    const config = priceConfigStorage.get()
    if (config) {
      setPriceConfig({
        price1Name: config.price1Name,
        price2Name: config.price2Name,
        price3Name: config.price3Name,
        price4Name: config.price4Name,
      })
    }
  }, [])

  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const company: Company = {
      id: "1",
      name: companyData.name,
      rfc: companyData.rfc,
      address: companyData.address,
      phone: companyData.phone,
      email: companyData.email,
      ivaRate: Number.parseFloat(companyData.ivaRate),
    }

    companyStorage.save(company)
    alert("Información de la empresa actualizada correctamente")
  }

  const handlePriceConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const config: PriceConfig = {
      id: "1",
      price1Name: priceConfig.price1Name,
      price2Name: priceConfig.price2Name,
      price3Name: priceConfig.price3Name,
      price4Name: priceConfig.price4Name,
    }

    priceConfigStorage.save(config)
    alert("Configuración de precios actualizada correctamente")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración de la Empresa</h1>
        <p className="text-muted-foreground mt-1">Configura los datos de tu empresa y precios</p>
      </div>

      <Tabs defaultValue="empresa" className="w-full">
        <TabsList>
          <TabsTrigger value="empresa">Datos de Empresa</TabsTrigger>
          <TabsTrigger value="impuestos">Impuestos</TabsTrigger>
          <TabsTrigger value="precios">Configuración de Precios</TabsTrigger>
        </TabsList>

        <TabsContent value="empresa">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Datos de la Empresa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCompanySubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre / Razón Social</Label>
                  <Input
                    id="name"
                    value={companyData.name}
                    onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rfc">RFC</Label>
                  <Input
                    id="rfc"
                    value={companyData.rfc}
                    onChange={(e) => setCompanyData({ ...companyData, rfc: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    value={companyData.address}
                    onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={companyData.phone}
                      onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={companyData.email}
                      onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit">Guardar Cambios</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="impuestos">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="w-5 h-5" />
                Configuración de IVA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCompanySubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ivaRate">Tasa de IVA (%)</Label>
                  <Input
                    id="ivaRate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={companyData.ivaRate}
                    onChange={(e) => setCompanyData({ ...companyData, ivaRate: e.target.value })}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Ingresa el porcentaje de IVA que se aplicará a las ventas (ejemplo: 16 para 16%)
                  </p>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit">Guardar Configuración</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="precios">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Nombres de Precios de Venta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePriceConfigSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="price1Name">Nombre del Precio 1</Label>
                  <Input
                    id="price1Name"
                    value={priceConfig.price1Name}
                    onChange={(e) => setPriceConfig({ ...priceConfig, price1Name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price2Name">Nombre del Precio 2</Label>
                  <Input
                    id="price2Name"
                    value={priceConfig.price2Name}
                    onChange={(e) => setPriceConfig({ ...priceConfig, price2Name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price3Name">Nombre del Precio 3</Label>
                  <Input
                    id="price3Name"
                    value={priceConfig.price3Name}
                    onChange={(e) => setPriceConfig({ ...priceConfig, price3Name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price4Name">Nombre del Precio 4</Label>
                  <Input
                    id="price4Name"
                    value={priceConfig.price4Name}
                    onChange={(e) => setPriceConfig({ ...priceConfig, price4Name: e.target.value })}
                    required
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit">Guardar Nombres</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

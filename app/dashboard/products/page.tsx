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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Edit, Trash2, Package, Upload } from "lucide-react"
import { productStorage, categoryStorage, sucursalStorage, priceConfigStorage } from "@/lib/storage"
import type { Product, Category, Sucursal } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"

export default function ProductsPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [priceConfig, setPriceConfig] = useState({
    price1Name: "Precio General",
    price2Name: "Precio con Descuento",
    price3Name: "Precio Mayorista",
    price4Name: "Precio Mayorista Especial",
  })

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    categoryId: "",
    price1: "",
    price2: "",
    price3: "",
    price4: "",
    cost: "",
    stock: "",
    minStock: "",
    sucursalId: "",
    imageUrl: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setProducts(productStorage.getAll())
    setCategories(categoryStorage.getAll())
    setSucursales(sucursalStorage.getAll())
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

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || "Sin categoría"
  }

  const getSucursalName = (sucursalId: string) => {
    return sucursales.find((s) => s.id === sucursalId)?.name || "Sin sucursal"
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const productData: Product = {
      id: editingProduct?.id || Date.now().toString(),
      code: formData.code,
      name: formData.name,
      description: formData.description,
      categoryId: formData.categoryId,
      price: Number.parseFloat(formData.price1), // Precio principal
      price1: Number.parseFloat(formData.price1),
      price2: Number.parseFloat(formData.price2),
      price3: Number.parseFloat(formData.price3),
      price4: Number.parseFloat(formData.price4),
      cost: Number.parseFloat(formData.cost),
      stock: Number.parseFloat(formData.stock),
      minStock: Number.parseFloat(formData.minStock),
      sucursalId: formData.sucursalId,
      imageUrl: formData.imageUrl,
      active: true,
      createdAt: editingProduct?.createdAt || new Date().toISOString(),
    }

    const allProducts = productStorage.getAll()
    if (editingProduct) {
      const index = allProducts.findIndex((p) => p.id === editingProduct.id)
      allProducts[index] = productData
    } else {
      allProducts.push(productData)
    }

    productStorage.save(allProducts)
    loadData()
    resetForm()
    setIsDialogOpen(false)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith("image/")) {
        alert("Por favor selecciona un archivo de imagen válido")
        return
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("La imagen no debe superar los 5MB")
        return
      }

      // Crear preview local
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setImagePreview(base64String)
        setFormData({ ...formData, imageUrl: base64String })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setImagePreview(product.imageUrl || "")
    setFormData({
      code: product.code,
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      price1: (product.price1 || product.price).toString(),
      price2: (product.price2 || product.price).toString(),
      price3: (product.price3 || product.price).toString(),
      price4: (product.price4 || product.price).toString(),
      cost: product.cost.toString(),
      stock: product.stock.toString(),
      minStock: product.minStock.toString(),
      sucursalId: product.sucursalId,
      imageUrl: product.imageUrl || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar este producto?")) {
      const allProducts = productStorage.getAll().filter((p) => p.id !== id)
      productStorage.save(allProducts)
      loadData()
    }
  }

  const resetForm = () => {
    setEditingProduct(null)
    setImagePreview("")
    setFormData({
      code: "",
      name: "",
      description: "",
      categoryId: "",
      price1: "",
      price2: "",
      price3: "",
      price4: "",
      cost: "",
      stock: "",
      minStock: "",
      sucursalId: user?.sucursalId || "",
      imageUrl: "",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Productos</h1>
          <p className="text-muted-foreground mt-1">Gestiona tu catálogo de productos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
              <DialogDescription>
                {editingProduct ? "Modifica los datos del producto" : "Completa la información del nuevo producto"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="precios">Precios</TabsTrigger>
                  <TabsTrigger value="inventario">Inventario</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Código</Label>
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="categoryId">Categoría</Label>
                      <Select
                        value={formData.categoryId}
                        onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sucursalId">Sucursal</Label>
                      <Select
                        value={formData.sucursalId}
                        onValueChange={(value) => setFormData({ ...formData, sucursalId: value })}
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="imageUrl">Imagen del Producto</Label>
                    <div className="flex gap-2">
                      <Input
                        id="imageUrl"
                        placeholder="URL de imagen o sube una imagen local"
                        value={formData.imageUrl.startsWith("data:") ? "" : formData.imageUrl}
                        onChange={(e) => {
                          setFormData({ ...formData, imageUrl: e.target.value })
                          setImagePreview(e.target.value)
                        }}
                      />
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          id="image-upload"
                        />
                        <Button type="button" variant="outline" size="icon" asChild>
                          <label htmlFor="image-upload" className="cursor-pointer">
                            <Upload className="w-4 h-4" />
                          </label>
                        </Button>
                      </div>
                    </div>
                    {(imagePreview || formData.imageUrl) && (
                      <div className="mt-2 border rounded-lg p-2">
                        <img
                          src={imagePreview || formData.imageUrl || "/placeholder.svg"}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded mx-auto"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg?height=128&width=128"
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => {
                            setImagePreview("")
                            setFormData({ ...formData, imageUrl: "" })
                          }}
                        >
                          Eliminar imagen
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="precios" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="cost">Costo</Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price1">{priceConfig.price1Name}</Label>
                      <Input
                        id="price1"
                        type="number"
                        step="0.01"
                        value={formData.price1}
                        onChange={(e) => setFormData({ ...formData, price1: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price2">{priceConfig.price2Name}</Label>
                      <Input
                        id="price2"
                        type="number"
                        step="0.01"
                        value={formData.price2}
                        onChange={(e) => setFormData({ ...formData, price2: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price3">{priceConfig.price3Name}</Label>
                      <Input
                        id="price3"
                        type="number"
                        step="0.01"
                        value={formData.price3}
                        onChange={(e) => setFormData({ ...formData, price3: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price4">{priceConfig.price4Name}</Label>
                      <Input
                        id="price4"
                        type="number"
                        step="0.01"
                        value={formData.price4}
                        onChange={(e) => setFormData({ ...formData, price4: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="inventario" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stock">Stock Inicial</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minStock">Stock Mínimo</Label>
                      <Input
                        id="minStock"
                        type="number"
                        value={formData.minStock}
                        onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingProduct ? "Guardar Cambios" : "Crear Producto"}</Button>
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
                placeholder="Buscar por nombre o código..."
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
                <TableHead>Imagen</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Sucursal</TableHead>
                <TableHead className="text-right">Costo</TableHead>
                <TableHead className="text-right">{priceConfig.price1Name}</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No hay productos registrados</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl || "/placeholder.svg"}
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg?height=40&width=40"
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                          <Package className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono">{product.code}</TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{getCategoryName(product.categoryId)}</TableCell>
                    <TableCell>{getSucursalName(product.sucursalId)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(product.cost)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(product.price1 || product.price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={product.stock <= product.minStock ? "destructive" : "default"}>
                        {product.stock}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(product)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(product.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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

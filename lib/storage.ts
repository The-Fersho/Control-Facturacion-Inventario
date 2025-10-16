// Claves de almacenamiento
const STORAGE_KEYS = {
  USERS: "inventory_users",
  COMPANY: "inventory_company",
  SUCURSALES: "inventory_sucursales",
  CAJAS: "inventory_cajas",
  CATEGORIES: "inventory_categories",
  PRODUCTS: "inventory_products",
  CLIENTS: "inventory_clients",
  SALES: "inventory_sales",
  CREDITS: "inventory_credits",
  PAYMENTS: "inventory_payments",
  MOVEMENTS: "inventory_movements",
  CURRENT_USER: "inventory_current_user",
  PRICE_CONFIG: "inventory_price_config", // Nueva clave
}

// Funciones genéricas de almacenamiento
export const storage = {
  get: <T>(key: string): T | null => {
    if (typeof window === 'undefined') return null
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  },

  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return
    localStorage.setItem(key, JSON.stringify(value))
  },

  remove: (key: string): void => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(key)
  },

  clear: (): void => {
    if (typeof window === 'undefined') return
    localStorage.clear()
  },
}

// Inicializar datos de ejemplo
export const initializeDefaultData = () => {
  // Usuario admin por defecto\
  const users = storage.get<User[]>(STORAGE_KEYS.USERS)
  if (!users || users.length === 0) {
    const defaultUser: User = {
      id: '1',
      username: 'admin',
      password: 'admin123',
      name: 'Administrador',
      role: 'admin',
      sucursalId: '1',
      active: true,
      createdAt: new Date().toISOString(),
    }
    storage.set(STORAGE_KEYS.USERS, [defaultUser])
  }

  // Empresa por defecto
  const company = storage.get<Company>(STORAGE_KEYS.COMPANY)
  if (!company) {
    const defaultCompany: Company = {
      id: '1',
      name: 'Mi Empresa',
      rfc: 'XAXX010101000',
      address: 'Calle Principal #123',
      phone: '5551234567',
      email: 'contacto@miempresa.com',
    }
    storage.set(STORAGE_KEYS.COMPANY, defaultCompany)
  }

  // Sucursal por defecto\
  const sucursales = storage.get<Sucursal[]>(STORAGE_KEYS.SUCURSALES)
  if (!sucursales || sucursales.length === 0) {
    const defaultSucursal: Sucursal = {
      id: '1',
      name: 'Sucursal Principal',
      address: 'Calle Principal #123',
      phone: '5551234567',
      active: true,
    }
    storage.set(STORAGE_KEYS.SUCURSALES, [defaultSucursal])
  }

  // Caja por defecto\
  const cajas = storage.get<Caja[]>(STORAGE_KEYS.CAJAS)
  if (!cajas || cajas.length === 0) {
    const defaultCaja: Caja = {
      id: '1',
      name: 'Caja 1',
      sucursalId: '1',
      active: true,
    }
    storage.set(STORAGE_KEYS.CAJAS, [defaultCaja])
  }

  // Categorías por defecto\
  const categories = storage.get<Category[]>(STORAGE_KEYS.CATEGORIES)
  if (!categories || categories.length === 0) {
    const defaultCategories: Category[] = [
      { id: '1', name: 'General', description: 'Productos generales' },
      { id: '2', name: 'Electrónica', description: 'Productos electrónicos' },
      { id: '3', name: 'Alimentos', description: 'Productos alimenticios' },
    ]
    storage.set(STORAGE_KEYS.CATEGORIES, defaultCategories)
  }

  // Inicializar arrays vacíos si no existen\
  if (!storage.get<Product[]>(STORAGE_KEYS.PRODUCTS)) {
    storage.set(STORAGE_KEYS.PRODUCTS, [])
  }
  if (!storage.get<Client[]>(STORAGE_KEYS.CLIENTS)) {
    storage.set(STORAGE_KEYS.CLIENTS, [])
  }
  if (!storage.get<Sale[]>(STORAGE_KEYS.SALES)) {
    storage.set(STORAGE_KEYS.SALES, [])
  }
  if (!storage.get<Credit[]>(STORAGE_KEYS.CREDITS)) {
    storage.set(STORAGE_KEYS.CREDITS, [])
  }
  if (!storage.get<Payment[]>(STORAGE_KEYS.PAYMENTS)) {
    storage.set(STORAGE_KEYS.PAYMENTS, [])
  }
  if (!storage.get<InventoryMovement[]>(STORAGE_KEYS.MOVEMENTS)) {
    storage.set(STORAGE_KEYS.MOVEMENTS, [])
  }

  // Configuración de precios por defecto
  const priceConfig = storage.get<PriceConfig>(STORAGE_KEYS.PRICE_CONFIG)
  if (!priceConfig) {
    const defaultPriceConfig: PriceConfig = {
      id: '1',
      price1Name: 'Precio General',
      price2Name: 'Precio con Descuento',
      price3Name: 'Precio Mayorista',
      price4Name: 'Precio Mayorista Especial',
    }
    storage.set(STORAGE_KEYS.PRICE_CONFIG, defaultPriceConfig)
  }
}

// Funciones específicas para cada entidad
export const userStorage = {
  getAll: () => storage.get<User[]>(STORAGE_KEYS.USERS) || [],
  save: (users: User[]) => storage.set(STORAGE_KEYS.USERS, users),
  findByUsername: (username: string) => {
    const users = userStorage.getAll()
    return users.find((u) => u.username === username)
  },
}

export const companyStorage = {
  get: () => storage.get<Company>(STORAGE_KEYS.COMPANY),
  save: (company: Company) => storage.set(STORAGE_KEYS.COMPANY, company),
}

export const sucursalStorage = {
  getAll: () => storage.get<Sucursal[]>(STORAGE_KEYS.SUCURSALES) || [],
  save: (sucursales: Sucursal[]) => storage.set(STORAGE_KEYS.SUCURSALES, sucursales),
}

export const cajaStorage = {
  getAll: () => storage.get<Caja[]>(STORAGE_KEYS.CAJAS) || [],
  save: (cajas: Caja[]) => storage.set(STORAGE_KEYS.CAJAS, cajas),
}

export const categoryStorage = {
  getAll: () => storage.get<Category[]>(STORAGE_KEYS.CATEGORIES) || [],
  save: (categories: Category[]) => storage.set(STORAGE_KEYS.CATEGORIES, categories),
}

export const productStorage = {
  getAll: () => storage.get<Product[]>(STORAGE_KEYS.PRODUCTS) || [],
  save: (products: Product[]) => storage.set(STORAGE_KEYS.PRODUCTS, products),
}

export const clientStorage = {
  getAll: () => storage.get<Client[]>(STORAGE_KEYS.CLIENTS) || [],
  save: (clients: Client[]) => storage.set(STORAGE_KEYS.CLIENTS, clients),
}

export const saleStorage = {
  getAll: () => storage.get<Sale[]>(STORAGE_KEYS.SALES) || [],
  save: (sales: Sale[]) => storage.set(STORAGE_KEYS.SALES, sales),
}

export const creditStorage = {
  getAll: () => storage.get<Credit[]>(STORAGE_KEYS.CREDITS) || [],
  save: (credits: Credit[]) => storage.set(STORAGE_KEYS.CREDITS, credits),
}

export const paymentStorage = {
  getAll: () => storage.get<Payment[]>(STORAGE_KEYS.PAYMENTS) || [],
  save: (payments: Payment[]) => storage.set(STORAGE_KEYS.PAYMENTS, payments),
}

export const movementStorage = {
  getAll: () => storage.get<InventoryMovement[]>(STORAGE_KEYS.MOVEMENTS) || [],
  save: (movements: InventoryMovement[]) => storage.set(STORAGE_KEYS.MOVEMENTS, movements),
}

export const currentUserStorage = {
  get: () => storage.get<User>(STORAGE_KEYS.CURRENT_USER),
  set: (user: User) => storage.set(STORAGE_KEYS.CURRENT_USER, user),
  remove: () => storage.remove(STORAGE_KEYS.CURRENT_USER),
}

export const priceConfigStorage = {
  get: () => storage.get<PriceConfig>(STORAGE_KEYS.PRICE_CONFIG),
  save: (config: PriceConfig) => storage.set(STORAGE_KEYS.PRICE_CONFIG, config),
}

export const branchStorage = sucursalStorage

export { STORAGE_KEYS }

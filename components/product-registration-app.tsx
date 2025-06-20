"use client"

import { useState, useEffect, useRef } from "react"
import type React from "react"

// Supabase imports
import {
  fetchUsers,
  fetchProducts,
  fetchLocations,
  fetchPurposes,
  fetchCategories,
  fetchRegistrations,
  saveUser,
  saveProduct,
  saveLocation,
  savePurpose,
  saveCategory,
  saveRegistration,
  deleteUser,
  deleteProduct,
  deleteLocation,
  deletePurpose,
  deleteCategory,
  subscribeToUsers,
  subscribeToProducts,
  subscribeToLocations,
  subscribeToPurposes,
  subscribeToCategories,
  subscribeToRegistrations,
  isSupabaseConfigured,
  updateUser,
  updateLocation,
  updatePurpose,
  updateProduct,
  updateCategory,
  testSupabaseConnection,
} from "@/lib/supabase"

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Trash2, X, QrCode, ChevronDown, Edit, Printer } from "lucide-react"
import ProfessionalQRCode from "@/components/professional-qr-code"

interface Product {
  id: string
  name: string
  qrcode?: string
  categoryId?: string
  created_at?: string
  attachmentUrl?: string
  attachmentName?: string
}

interface Category {
  id: string
  name: string
}

interface Registration {
  id: string
  user: string
  product: string
  location: string
  purpose: string
  timestamp: string
  date: string
  time: string
  qrcode?: string
  created_at?: string
}

export default function ProductRegistrationApp() {
  // ALL HOOKS MUST BE AT THE TOP - NEVER CONDITIONAL
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string>("")

  // Basic state
  const [currentUser, setCurrentUser] = useState("")
  const [selectedProduct, setSelectedProduct] = useState("")
  const [location, setLocation] = useState("")
  const [purpose, setPurpose] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [importMessage, setImportMessage] = useState("")
  const [importError, setImportError] = useState("")

  // Connection state
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState("Controleren...")

  // Data arrays - SINGLE SOURCE OF TRUTH
  const [users, setUsers] = useState<string[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [purposes, setPurposes] = useState<string[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])

  // New item states
  const [newUserName, setNewUserName] = useState("")
  const [newProductName, setNewProductName] = useState("")
  const [newProductQrCode, setNewProductQrCode] = useState("")
  const [newProductCategory, setNewProductCategory] = useState("none")
  const [newLocationName, setNewLocationName] = useState("")
  const [newPurposeName, setNewPurposeName] = useState("")
  const [newCategoryName, setNewCategoryName] = useState("")

  // Edit states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [originalProduct, setOriginalProduct] = useState<Product | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [originalCategory, setOriginalCategory] = useState<Category | null>(null)
  const [showEditCategoryDialog, setShowEditCategoryDialog] = useState(false)

  const [editingUser, setEditingUser] = useState<string>("")
  const [originalUser, setOriginalUser] = useState<string>("")
  const [showEditUserDialog, setShowEditUserDialog] = useState(false)

  const [editingLocation, setEditingLocation] = useState<string>("")
  const [originalLocation, setOriginalLocation] = useState<string>("")
  const [showEditLocationDialog, setShowEditLocationDialog] = useState(false)

  const [editingPurpose, setEditingPurpose] = useState<string>("")
  const [originalPurpose, setOriginalPurpose] = useState<string>("")
  const [showEditPurposeDialog, setShowEditPurposeDialog] = useState(false)

  // Product selector states
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [productSearchQuery, setProductSearchQuery] = useState("")
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const productSelectorRef = useRef<HTMLDivElement>(null)
  const [userSearchQuery, setUserSearchQuery] = useState("")

  // QR Scanner states
  const [showQrScanner, setShowQrScanner] = useState(false)
  const [qrScanResult, setQrScanResult] = useState("")
  const [qrScanMode, setQrScanMode] = useState<"registration" | "product-management">("registration")
  const manualInputRef = useRef<HTMLInputElement>(null)

  // History filtering states
  const [historySearchQuery, setHistorySearchQuery] = useState("")
  const [selectedHistoryUser, setSelectedHistoryUser] = useState("all")
  const [selectedHistoryLocation, setSelectedHistoryLocation] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [sortBy, setSortBy] = useState("date")
  const [sortOrder, setSortOrder] = useState("newest")

  // Product search state
  const [productSearchFilter, setProductSearchFilter] = useState("")

  // Load data on component mount
  useEffect(() => {
    console.log("🚀 Starting app initialization...")
    loadAllData()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productSelectorRef.current && !productSelectorRef.current.contains(event.target as Node)) {
        setShowProductDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Set default user when users are loaded
  useEffect(() => {
    if (!currentUser && users.length > 0) {
      setCurrentUser(users[0])
      console.log("👤 Set default user:", users[0])
    }
  }, [users, currentUser])

  // Auto-focus en keyboard handling voor QR scanner
  useEffect(() => {
    if (showQrScanner) {
      // Meerdere pogingen om focus te krijgen
      const focusInput = () => {
        if (manualInputRef.current) {
          manualInputRef.current.focus()
          manualInputRef.current.select() // Selecteer eventuele bestaande tekst
        }
      }

      // Probeer focus direct
      focusInput()

      // Probeer opnieuw na korte delay
      setTimeout(focusInput, 50)
      setTimeout(focusInput, 150)
      setTimeout(focusInput, 300)

      // Keyboard event listener voor ESC
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          stopQrScanner()
        }
      }

      document.addEventListener("keydown", handleKeyDown)

      return () => {
        document.removeEventListener("keydown", handleKeyDown)
      }
    }
  }, [showQrScanner])

  const loadAllData = async () => {
    console.log("🔄 Loading all data...")
    setConnectionStatus("Verbinden met database...")

    try {
      const supabaseConfigured = isSupabaseConfigured()
      console.log("🔧 Supabase configured:", supabaseConfigured)

      if (supabaseConfigured) {
        console.log("🔄 Testing Supabase connection...")

        // Test connection first
        const connectionTest = await testSupabaseConnection()

        if (connectionTest) {
          console.log("🔄 Loading from Supabase...")
          const [usersResult, productsResult, locationsResult, purposesResult, categoriesResult, registrationsResult] =
            await Promise.all([
              fetchUsers(),
              fetchProducts(),
              fetchLocations(),
              fetchPurposes(),
              fetchCategories(),
              fetchRegistrations(),
            ])

          console.log("📊 Supabase results:", {
            users: { success: !usersResult.error, count: usersResult.data?.length || 0 },
            products: { success: !productsResult.error, count: productsResult.data?.length || 0 },
            locations: { success: !locationsResult.error, count: locationsResult.data?.length || 0 },
            purposes: { success: !locationsResult.error, count: locationsResult.data?.length || 0 },
            categories: { success: !categoriesResult.error, count: categoriesResult.data?.length || 0 },
          })

          // Check if we have successful connection
          const hasErrors = usersResult.error || productsResult.error || categoriesResult.error

          if (!hasErrors) {
            console.log("✅ Supabase connected successfully")
            setIsSupabaseConnected(true)
            setConnectionStatus("Supabase verbonden")

            // Set data from Supabase
            setUsers(usersResult.data || [])
            setProducts(productsResult.data || [])
            setLocations(locationsResult.data || [])
            setPurposes(purposesResult.data || [])
            setCategories(categoriesResult.data || [])
            setRegistrations(registrationsResult.data || [])

            // Set up real-time subscriptions
            setupSubscriptions()
          } else {
            console.log("️ Supabase data fetch failed - using mock data")
            setIsSupabaseConnected(false)
            setConnectionStatus("Mock data actief (data fetch failed)")
            loadMockData()
          }
        } else {
          console.log("⚠️ Supabase connection test failed - using mock data")
          setIsSupabaseConnected(false)
          setConnectionStatus("Mock data actief (connection failed)")
          loadMockData()
        }
      } else {
        console.log("⚠️ Supabase not configured - using mock data")
        setIsSupabaseConnected(false)
        setConnectionStatus("Mock data actief (not configured)")
        loadMockData()
      }

      console.log("🎯 App initialization complete - setting ready state")
      setIsReady(true)
    } catch (error) {
      console.error("❌ Error loading data:", error)
      setError(`Fout bij laden: ${error}`)
      setIsSupabaseConnected(false)
      setConnectionStatus("Mock data actief (error)")
      loadMockData()
      setIsReady(true) // Still show the app with mock data
    }
  }

  const loadMockData = () => {
    console.log("📱 Loading mock data...")
    const mockUsers = [
      "Tom Peckstadt",
      "Sven De Poorter",
      "Nele Herteleer",
      "Wim Peckstadt",
      "Siegfried Weverbergh",
      "Jan Janssen",
    ]
    const mockProducts = [
      { id: "1", name: "Interflon Metal Clean spray 500ml", qrcode: "IFLS001", categoryId: "1" },
      { id: "2", name: "Interflon Grease LT2 Lube shuttle 400gr", qrcode: "IFFL002", categoryId: "1" },
      { id: "3", name: "Interflon Maintenance Kit", qrcode: "IFD003", categoryId: "2" },
      { id: "4", name: "Interflon Food Lube spray 500ml", qrcode: "IFGR004", categoryId: "1" },
      { id: "5", name: "Interflon Foam Cleaner spray 500ml", qrcode: "IFMC005", categoryId: "2" },
      { id: "6", name: "Interflon Fin Super", qrcode: "IFMK006", categoryId: "3" },
    ]
    const mockLocations = [
      "Warehouse Dematic groot boven",
      "Warehouse Interflon",
      "Warehouse Dematic klein beneden",
      "Onderhoud werkplaats",
      "Kantoor 1.1",
    ]
    const mockPurposes = ["Presentatie", "Thuiswerken", "Reparatie", "Training", "Demonstratie"]
    const mockCategories = [
      { id: "1", name: "Smeermiddelen" },
      { id: "2", name: "Reinigers" },
      { id: "3", name: "Onderhoud" },
    ]

    // Mock registrations with realistic data
    const mockRegistrations = [
      {
        id: "1",
        user: "Tom Peckstadt",
        product: "Interflon Metal Clean spray 500ml",
        location: "Warehouse Interflon",
        purpose: "Reparatie",
        timestamp: "2025-06-15T05:41:00Z",
        date: "2025-06-15",
        time: "05:41",
        qrcode: "IFLS001",
      },
      {
        id: "2",
        user: "Nele Herteleer",
        product: "Interflon Metal Clean spray 500ml",
        location: "Warehouse Dematic klein beneden",
        purpose: "Training",
        timestamp: "2025-06-15T05:48:00Z",
        date: "2025-06-15",
        time: "05:48",
        qrcode: "IFLS001",
      },
      {
        id: "3",
        user: "Tom Peckstadt",
        product: "Interflon Grease LT2 Lube shuttle 400gr",
        location: "Warehouse Dematic groot boven",
        purpose: "Reparatie",
        timestamp: "2025-06-15T12:53:00Z",
        date: "2025-06-15",
        time: "12:53",
        qrcode: "IFFL002",
      },
      {
        id: "4",
        user: "Tom Peckstadt",
        product: "Interflon Grease LT2 Lube shuttle 400gr",
        location: "Warehouse Dematic groot boven",
        purpose: "Demonstratie",
        timestamp: "2025-06-16T20:32:00Z",
        date: "2025-06-16",
        time: "20:32",
        qrcode: "IFFL002",
      },
      {
        id: "5",
        user: "Sven De Poorter",
        product: "Interflon Metal Clean spray 500ml",
        location: "Warehouse Dematic groot boven",
        purpose: "Presentatie",
        timestamp: "2025-06-16T21:07:00Z",
        date: "2025-06-16",
        time: "21:07",
        qrcode: "IFLS001",
      },
      {
        id: "6",
        user: "Tom Peckstadt",
        product: "Interflon Maintenance Kit",
        location: "Onderhoud werkplaats",
        purpose: "Reparatie",
        timestamp: "2025-06-14T10:15:00Z",
        date: "2025-06-14",
        time: "10:15",
        qrcode: "IFD003",
      },
      {
        id: "7",
        user: "Siegfried Weverbergh",
        product: "Interflon Food Lube spray 500ml",
        location: "Warehouse Interflon",
        purpose: "Training",
        timestamp: "2025-06-14T14:22:00Z",
        date: "2025-06-14",
        time: "14:22",
        qrcode: "IFGR004",
      },
      {
        id: "8",
        user: "Wim Peckstadt",
        product: "Interflon Foam Cleaner spray 500ml",
        location: "Warehouse Dematic klein beneden",
        purpose: "Demonstratie",
        timestamp: "2025-06-13T09:30:00Z",
        date: "2025-06-13",
        time: "09:30",
        qrcode: "IFMC005",
      },
      {
        id: "9",
        user: "Sven De Poorter",
        product: "Interflon Maintenance Kit",
        location: "Onderhoud werkplaats",
        purpose: "Reparatie",
        timestamp: "2025-06-13T16:45:00Z",
        date: "2025-06-13",
        time: "16:45",
        qrcode: "IFD003",
      },
      {
        id: "10",
        user: "Tom Peckstadt",
        product: "Interflon Metal Clean spray 500ml",
        location: "Warehouse Dematic groot boven",
        purpose: "Presentatie",
        timestamp: "2025-06-12T11:20:00Z",
        date: "2025-06-12",
        time: "11:20",
        qrcode: "IFLS001",
      },
      {
        id: "11",
        user: "Siegfried Weverbergh",
        product: "Interflon Grease LT2 Lube shuttle 400gr",
        location: "Warehouse Interflon",
        purpose: "Training",
        timestamp: "2025-06-12T15:10:00Z",
        date: "2025-06-12",
        time: "15:10",
        qrcode: "IFFL002",
      },
      {
        id: "12",
        user: "Siegfried Weverbergh",
        product: "Interflon Food Lube spray 500ml",
        location: "Warehouse Dematic klein beneden",
        purpose: "Demonstratie",
        timestamp: "2025-06-11T08:55:00Z",
        date: "2025-06-11",
        time: "08:55",
        qrcode: "IFGR004",
      },
      {
        id: "13",
        user: "Tom Peckstadt",
        product: "Interflon Grease LT2 Lube shuttle 400gr",
        location: "Warehouse Dematic groot boven",
        purpose: "Reparatie",
        timestamp: "2025-06-10T13:40:00Z",
        date: "2025-06-10",
        time: "13:40",
        qrcode: "IFFL002",
      },
    ]

    setUsers(mockUsers)
    setProducts(mockProducts)
    setLocations(mockLocations)
    setPurposes(mockPurposes)
    setCategories(mockCategories)
    setRegistrations(mockRegistrations)
  }

  const setupSubscriptions = () => {
    console.log("🔔 Setting up real-time subscriptions...")

    const usersSub = subscribeToUsers((newUsers) => {
      console.log("🔔 Users updated via subscription:", newUsers.length)
      setUsers(newUsers)
    })

    const productsSub = subscribeToProducts((newProducts) => {
      console.log("🔔 Products updated via subscription:", newProducts.length)
      setProducts(newProducts)
    })

    const locationsSub = subscribeToLocations((newLocations) => {
      console.log("🔔 Locations updated via subscription:", newLocations.length)
      setLocations(newLocations)
    })

    const purposesSub = subscribeToPurposes((newPurposes) => {
      console.log("🔔 Purposes updated via subscription:", newPurposes.length)
      setPurposes(newPurposes)
    })

    const categoriesSub = subscribeToCategories((newCategories) => {
      console.log("🔔 Categories updated via subscription:", newCategories.length)
      setCategories(newCategories)
    })

    const registrationsSub = subscribeToRegistrations((newRegistrations) => {
      console.log("🔔 Registrations updated via subscription:", newRegistrations.length)
      setRegistrations(newRegistrations)
    })

    // Cleanup subscriptions on unmount
    return () => {
      usersSub?.unsubscribe?.()
      productsSub?.unsubscribe?.()
      locationsSub?.unsubscribe?.()
      purposesSub?.unsubscribe?.()
      categoriesSub?.unsubscribe?.()
      registrationsSub?.unsubscribe?.()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser || !selectedProduct || !location || !purpose) {
      return
    }

    setIsLoading(true)

    try {
      const now = new Date()
      const product = products.find((p) => p.name === selectedProduct)

      const registrationData = {
        user_name: currentUser,
        product_name: selectedProduct,
        location,
        purpose,
        timestamp: now.toISOString(),
        date: now.toISOString().split("T")[0],
        time: now.toTimeString().split(" ")[0],
        qr_code: product?.qrcode,
      }

      const result = await saveRegistration(registrationData)
      if (result.error) {
        console.error("Error saving registration:", result.error)
        setImportError("Fout bij opslaan registratie")
        setTimeout(() => setImportError(""), 3000)
      } else {
        console.log("✅ Registration saved")
        // FORCE LOCAL STATE UPDATE
        console.log("🔄 Forcing local registrations refresh...")
        const refreshResult = await fetchRegistrations()
        if (refreshResult.data) {
          console.log("🔄 Updating local registrations state...")
          setRegistrations(refreshResult.data)
        }
        setImportMessage("✅ Product geregistreerd!")
        setTimeout(() => setImportMessage(""), 2000)
      }

      // Reset form
      setSelectedProduct("")
      setProductSearchQuery("")
      setSelectedCategory("all")
      setLocation("")
      setPurpose("")
      setQrScanResult("")

      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error("Error saving registration:", error)
      setImportError("Fout bij opslaan registratie")
      setTimeout(() => setImportError(""), 3000)
    }

    setIsLoading(false)
  }

  // QR Scanner functions
  const startQrScanner = () => {
    setShowQrScanner(true)
  }

  const stopQrScanner = () => {
    setShowQrScanner(false)
  }

  // QR Code cleaning function voor draadloze scanners met keyboard layout problemen
  const cleanQrCode = (rawQrCode: string): string => {
    console.log("🧹 Cleaning QR code (AZERTY→QWERTY):", rawQrCode)

    // AZERTY naar QWERTY mapping (België/Frankrijk keyboard layout)
    const azertyToQwertyMap: Record<string, string> = {
      // Cijfer rij AZERTY → QWERTY
      "&": "1", // AZERTY 1 → QWERTY 1
      é: "2", // AZERTY 2 → QWERTY 2
      '"': "3", // AZERTY 3 → QWERTY 3
      "'": "4", // AZERTY 4 → QWERTY 4
      "(": "5", // AZERTY 5 → QWERTY 5
      "§": "6", // AZERTY 6 → QWERTY 6
      è: "7", // AZERTY 7 → QWERTY 7
      "!": "8", // AZERTY 8 → QWERTY 8
      ç: "9", // AZERTY 9 → QWERTY 9
      à: "0", // AZERTY 0 → QWERTY 0

      // Speciale karakters AZERTY → QWERTY
      "°": "_", // AZERTY _ → QWERTY _
      "-": "-", // Blijft hetzelfde
      "=": "=", // Blijft hetzelfde maar kan anders zijn

      // Letters die anders kunnen zijn
      a: "a",
      z: "z",
      e: "e",
      r: "r",
      t: "t",
      y: "y",
      u: "u",
      i: "i",
      o: "o",
      p: "p",
      q: "q",
      s: "s",
      d: "d",
      f: "f",
      g: "g",
      h: "h",
      j: "j",
      k: "k",
      l: "l",
      m: "m",
      w: "w",
      x: "x",
      c: "c",
      v: "v",
      b: "b",
      n: "n",

      // Hoofdletters
      A: "A",
      Z: "Z",
      E: "E",
      R: "R",
      T: "T",
      Y: "Y",
      U: "U",
      I: "I",
      O: "O",
      P: "P",
      Q: "Q",
      S: "S",
      D: "D",
      F: "F",
      G: "G",
      H: "H",
      J: "J",
      K: "K",
      L: "L",
      M: "M",
      W: "W",
      X: "X",
      C: "C",
      V: "V",
      B: "B",
      N: "N",
    }

    // Stap 1: Character-by-character mapping
    let cleaned = rawQrCode
      .split("")
      .map((char) => azertyToQwertyMap[char] || char)
      .join("")

    console.log("🔄 After AZERTY→QWERTY mapping:", cleaned)

    // Stap 2: Specifieke patronen voor jouw QR codes
    // Als we weten dat het patroon _581533 zou moeten zijn:
    const knownPatterns = [
      { wrong: '°(!&(""', correct: "_581533" },
      { wrong: "°(!&(", correct: "_5815" },
      // Voeg hier meer patronen toe als je ze tegenkomt
    ]

    for (const pattern of knownPatterns) {
      if (cleaned.includes(pattern.wrong)) {
        cleaned = cleaned.replace(pattern.wrong, pattern.correct)
        console.log(`🎯 Applied pattern fix: ${pattern.wrong} → ${pattern.correct}`)
      }
    }

    // Stap 3: Probeer exacte match met bestaande producten
    const exactMatch = products.find((p) => p.qrcode === cleaned)
    if (exactMatch) {
      console.log("✅ Found exact match after cleaning:", exactMatch.qrcode)
      return cleaned
    }

    // Stap 4: Fuzzy matching
    const fuzzyMatch = products.find(
      (p) =>
        p.qrcode &&
        (p.qrcode.replace(/[^A-Z0-9]/g, "") === cleaned.replace(/[^A-Z0-9]/g, "") ||
          cleaned.includes(p.qrcode.substring(0, 6)) ||
          p.qrcode.includes(cleaned.substring(0, 6))),
    )

    if (fuzzyMatch) {
      console.log("🎯 Found fuzzy match:", fuzzyMatch.qrcode)
      return fuzzyMatch.qrcode!
    }

    console.log("❌ No match found, returning cleaned version:", cleaned)
    return cleaned
  }

  const handleQrCodeDetected = (qrCode: string) => {
    console.log("📱 Raw QR code detected:", qrCode)

    // Clean de QR code voor draadloze scanner problemen
    const cleanedQrCode = cleanQrCode(qrCode)
    console.log("📱 Cleaned QR code:", cleanedQrCode)

    // Clear the input field
    setQrScanResult("")

    if (qrScanMode === "registration") {
      // Zoek eerst met de gecleande code
      let foundProduct = products.find((p) => p.qrcode === cleanedQrCode)

      // Als niet gevonden, probeer ook de originele code
      if (!foundProduct) {
        foundProduct = products.find((p) => p.qrcode === qrCode)
      }

      // Als nog steeds niet gevonden, probeer fuzzy matching
      if (!foundProduct && cleanedQrCode.length > 5) {
        foundProduct = products.find(
          (p) =>
            p.qrcode &&
            (p.qrcode.toLowerCase().includes(cleanedQrCode.toLowerCase()) ||
              cleanedQrCode.toLowerCase().includes(p.qrcode.toLowerCase())),
        )
      }

      if (foundProduct) {
        setSelectedProduct(foundProduct.name)
        setProductSearchQuery(foundProduct.name)
        if (foundProduct.categoryId) {
          setSelectedCategory(foundProduct.categoryId)
        }
        setImportMessage(`✅ Product gevonden: ${foundProduct.name}`)
        setTimeout(() => setImportMessage(""), 3000)
      } else {
        setImportError(`❌ Geen product gevonden voor QR code: ${cleanedQrCode} (origineel: ${qrCode})`)
        setTimeout(() => setImportError(""), 5000)
      }
    } else if (qrScanMode === "product-management") {
      setNewProductQrCode(cleanedQrCode)
      setImportMessage(`✅ QR code gescand: ${cleanedQrCode}`)
      setTimeout(() => setImportMessage(""), 3000)
    }

    stopQrScanner()
  }

  // Get filtered products for dropdown
  const getFilteredProducts = () => {
    const filtered = products
      .filter((product) => {
        if (selectedCategory === "all") return true
        return product.categoryId === selectedCategory
      })
      .filter(
        (product) =>
          product.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
          (product.qrcode && product.qrcode.toLowerCase().includes(productSearchQuery.toLowerCase())),
      )

    return filtered
  }

  // Handle product selection
  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product.name)
    setProductSearchQuery(product.name)
    setShowProductDropdown(false)
  }

  // Edit handlers
  const handleEditProduct = (product: Product) => {
    console.log("🔧 Starting product edit:", product)
    setOriginalProduct({ ...product })
    setEditingProduct({ ...product })
    setShowEditDialog(true)
  }

  const handleEditUser = (user: string) => {
    console.log("🔧 Starting user edit:", user)
    setOriginalUser(user)
    setEditingUser(user)
    setShowEditUserDialog(true)
  }

  const handleEditCategory = (category: Category) => {
    console.log("🔧 Starting category edit:", category)
    setOriginalCategory({ ...category })
    setEditingCategory({ ...category })
    setShowEditCategoryDialog(true)
  }

  const handleEditLocation = (location: string) => {
    console.log("🔧 Starting location edit:", location)
    setOriginalLocation(location)
    setEditingLocation(location)
    setShowEditLocationDialog(true)
  }

  const handleEditPurpose = (purpose: string) => {
    console.log("🔧 Starting purpose edit:", purpose)
    setOriginalPurpose(purpose)
    setEditingPurpose(purpose)
    setShowEditPurposeDialog(true)
  }

  // Save handlers
  const handleSaveProduct = async () => {
    if (!editingProduct || !originalProduct) return

    const hasChanges =
      editingProduct.name !== originalProduct.name ||
      editingProduct.qrcode !== originalProduct.qrcode ||
      editingProduct.categoryId !== originalProduct.categoryId

    if (!hasChanges) {
      setShowEditDialog(false)
      return
    }

    console.log("💾 Saving product changes:", { original: originalProduct, edited: editingProduct })

    const updateData = {
      name: editingProduct.name,
      qr_code: editingProduct.qrcode || null,
      category_id: editingProduct.categoryId ? Number.parseInt(editingProduct.categoryId) : null,
      // Behoud de bestaande attachment gegevens
      attachment_url: originalProduct.attachmentUrl || null,
      attachment_name: originalProduct.attachmentName || null,
    }

    const result = await updateProduct(originalProduct.id, updateData)

    if (result.error) {
      console.error("❌ Error updating product:", result.error)
      setImportError("Fout bij bijwerken product")
      setTimeout(() => setImportError(""), 3000)
    } else {
      console.log("✅ Product updated successfully")
      setImportMessage("✅ Product bijgewerkt!")
      setTimeout(() => setImportMessage(""), 2000)

      // FORCE LOCAL STATE UPDATE
      console.log("🔄 Forcing local products refresh...")
      const refreshResult = await fetchProducts()
      if (refreshResult.data) {
        console.log("🔄 Updating local products state...")
        setProducts(refreshResult.data)
      }
    }

    setShowEditDialog(false)
  }

  const handleSaveUser = async () => {
    if (!editingUser.trim() || !originalUser) return

    const hasChanges = editingUser.trim() !== originalUser
    if (!hasChanges) {
      setShowEditUserDialog(false)
      return
    }

    console.log("💾 Saving user changes:", { original: originalUser, edited: editingUser.trim() })

    const result = await updateUser(originalUser, editingUser.trim())

    if (result.error) {
      console.error("❌ Error updating user:", result.error)
      setImportError("Fout bij bijwerken gebruiker")
      setTimeout(() => setImportError(""), 3000)
    } else {
      console.log("✅ User updated successfully")
      setImportMessage("✅ Gebruiker bijgewerkt!")
      setTimeout(() => setImportMessage(""), 2000)

      // FORCE LOCAL STATE UPDATE
      console.log("🔄 Forcing local users refresh...")
      const refreshResult = await fetchUsers()
      if (refreshResult.data) {
        console.log("🔄 Updating local users state...")
        setUsers(refreshResult.data)
      }
    }

    setShowEditUserDialog(false)
  }

  const handleSaveCategory = async () => {
    if (!editingCategory || !originalCategory) return

    const hasChanges = editingCategory.name.trim() !== originalCategory.name
    if (!hasChanges) {
      setShowEditCategoryDialog(false)
      return
    }

    console.log("💾 Saving category changes:", { original: originalCategory, edited: editingCategory })

    const result = await updateCategory(originalCategory.id, { name: editingCategory.name.trim() })

    if (result.error) {
      console.error("❌ Error updating category:", result.error)
      setImportError("Fout bij bijwerken categorie")
      setTimeout(() => setImportError(""), 3000)
    } else {
      console.log("✅ Category updated successfully")
      setImportMessage("✅ Categorie bijgewerkt!")
      setTimeout(() => setImportMessage(""), 2000)

      // FORCE LOCAL STATE UPDATE
      console.log("🔄 Forcing local categories refresh...")
      const refreshResult = await fetchCategories()
      if (refreshResult.data) {
        console.log("🔄 Updating local categories state...")
        setCategories(refreshResult.data)
      }
    }

    setShowEditCategoryDialog(false)
  }

  const handleSaveLocation = async () => {
    if (!editingLocation.trim() || !originalLocation) return

    const hasChanges = editingLocation.trim() !== originalLocation
    if (!hasChanges) {
      setShowEditLocationDialog(false)
      return
    }

    console.log("💾 Saving location changes:", { original: originalLocation, edited: editingLocation.trim() })

    const result = await updateLocation(originalLocation, editingLocation.trim())

    if (result.error) {
      console.error("❌ Error updating location:", result.error)
      setImportError("Fout bij bijwerken locatie")
      setTimeout(() => setImportError(""), 3000)
    } else {
      console.log("✅ Location updated successfully")
      setImportMessage("✅ Locatie bijgewerkt!")
      setTimeout(() => setImportMessage(""), 2000)

      // FORCE LOCAL STATE UPDATE
      console.log("🔄 Forcing local locations refresh...")
      const refreshResult = await fetchLocations()
      if (refreshResult.data) {
        console.log("🔄 Updating local locations state...")
        setLocations(refreshResult.data)
      }
    }

    setShowEditLocationDialog(false)
  }

  const handleSavePurpose = async () => {
    if (!editingPurpose.trim() || !originalPurpose) return

    const hasChanges = editingPurpose.trim() !== originalPurpose
    if (!hasChanges) {
      setShowEditPurposeDialog(false)
      return
    }

    console.log("💾 Saving purpose changes:", { original: originalPurpose, edited: editingPurpose.trim() })

    const result = await updatePurpose(originalPurpose, editingPurpose.trim())

    if (result.error) {
      console.error("❌ Error updating purpose:", result.error)
      setImportError("Fout bij bijwerken doel")
      setTimeout(() => setImportError(""), 3000)
    } else {
      console.log("✅ Purpose updated successfully")
      setImportMessage("✅ Doel bijgewerkt!")
      setTimeout(() => setImportMessage(""), 2000)

      // FORCE LOCAL STATE UPDATE
      console.log("🔄 Forcing local purposes refresh...")
      const refreshResult = await fetchPurposes()
      if (refreshResult.data) {
        console.log("🔄 Updating local purposes state...")
        setPurposes(refreshResult.data)
      }
    }

    setShowEditPurposeDialog(false)
  }

  // Attachment handlers
  const handleAttachmentUpload = async (product: Product, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== "application/pdf") {
      setImportError("Alleen PDF bestanden zijn toegestaan")
      setTimeout(() => setImportError(""), 3000)
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setImportError("Bestand is te groot (max 10MB)")
      setTimeout(() => setImportError(""), 3000)
      return
    }

    try {
      const attachmentUrl = URL.createObjectURL(file)
      const updateData = {
        name: product.name,
        qr_code: product.qrcode || null,
        category_id: product.categoryId ? Number.parseInt(product.categoryId) : null,
        attachment_url: attachmentUrl,
        attachment_name: file.name,
      }

      setImportMessage("📎 Bezig met uploaden...")
      const result = await updateProduct(product.id, updateData)

      if (result.error) {
        setImportError("Fout bij uploaden bijlage")
        setTimeout(() => setImportError(""), 3000)
      } else {
        setImportMessage("✅ Bijlage toegevoegd!")
        setTimeout(() => setImportMessage(""), 2000)

        const refreshResult = await fetchProducts()
        if (refreshResult.data) {
          setProducts(refreshResult.data)
        }
      }
    } catch (error) {
      setImportError("Fout bij uploaden bijlage")
      setTimeout(() => setImportError(""), 3000)
    }

    event.target.value = ""
  }

  const handleRemoveAttachment = async (product: Product) => {
    try {
      const updateData = {
        name: product.name,
        qr_code: product.qrcode || null,
        category_id: product.categoryId ? Number.parseInt(product.categoryId) : null,
        attachment_url: null,
        attachment_name: null,
      }

      setImportMessage("🗑️ Bezig met verwijderen...")
      const result = await updateProduct(product.id, updateData)

      if (result.error) {
        setImportError("Fout bij verwijderen bijlage")
        setTimeout(() => setImportError(""), 3000)
      } else {
        setImportMessage("✅ Bijlage verwijderd!")
        setTimeout(() => setImportMessage(""), 2000)

        const refreshResult = await fetchProducts()
        if (refreshResult.data) {
          setProducts(refreshResult.data)
        }
      }
    } catch (error) {
      setImportError("Fout bij verwijderen bijlage")
      setTimeout(() => setImportError(""), 3000)
    }
  }

  const generateQRCode = async (product: Product) => {
    try {
      // Genereer een unieke QR code voor het product
      const timestamp = Date.now()
      const productCode = product.name.replace(/\s+/g, "").substring(0, 10).toUpperCase()
      const uniqueQRCode = `${productCode}_${timestamp.toString().slice(-6)}`

      const updateData = {
        name: product.name,
        qr_code: uniqueQRCode,
        category_id: product.categoryId ? Number.parseInt(product.categoryId) : null,
        attachment_url: product.attachmentUrl || null,
        attachment_name: product.attachmentName || null,
      }

      setImportMessage("📱 Bezig met QR-code genereren...")
      const result = await updateProduct(product.id, updateData)

      if (result.error) {
        setImportError("Fout bij genereren QR-code")
        setTimeout(() => setImportError(""), 3000)
      } else {
        setImportMessage(`✅ QR-code gegenereerd: ${uniqueQRCode}`)
        setTimeout(() => setImportMessage(""), 3000)

        const refreshResult = await fetchProducts()
        if (refreshResult.data) {
          setProducts(refreshResult.data)
        }
      }
    } catch (error) {
      setImportError("Fout bij genereren QR-code")
      setTimeout(() => setImportError(""), 3000)
    }
  }

  // PROFESSIONELE QR-CODE GENERATIE met externe API
  const generateRealQRCode = (text: string): string => {
    // Gebruik QR Server API voor professionele QR-codes
    const size = 200
    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&format=png&ecc=M`
    return apiUrl
  }

  // Print QR code function
  const printQRCode = async (product: Product) => {
    if (!product.qrcode) return

    try {
      const qrImageUrl = generateRealQRCode(product.qrcode)

      // Create a new window for printing
      const printWindow = window.open("", "_blank")
      if (!printWindow) return

      printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${product.name}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
              text-align: center;
            }
            .qr-container {
              display: inline-block;
              border: 2px solid #000;
              padding: 10px;
              margin: 10px;
              background: white;
            }
            .qr-code {
              width: 150px;
              height: 150px;
              margin-bottom: 10px;
            }
            .product-name {
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 5px;
              word-wrap: break-word;
              max-width: 150px;
            }
            .qr-text {
              font-size: 10px;
              font-family: monospace;
              color: #666;
            }
            @media print {
              body { margin: 0; padding: 5px; }
              .qr-container { 
                page-break-inside: avoid;
                margin: 5px;
                padding: 5px;
              }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="product-name">${product.name}</div>
            <img src="${qrImageUrl}" alt="QR Code" class="qr-code" />
            <div class="qr-text">${product.qrcode}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 1000);
            }
          </script>
        </body>
      </html>
    `)
      printWindow.document.close()
    } catch (error) {
      console.error("Error generating QR code for printing:", error)
      setImportError("Fout bij genereren QR-code voor afdrukken")
      setTimeout(() => setImportError(""), 3000)
    }
  }

  // 🆕 BULK QR LABELS PRINT FUNCTIE
  const printAllQRLabels = async () => {
    // Filter producten met QR codes
    const productsWithQR = products.filter((product) => product.qrcode)

    if (productsWithQR.length === 0) {
      setImportError("Geen producten met QR codes gevonden")
      setTimeout(() => setImportError(""), 3000)
      return
    }

    try {
      setImportMessage(`🖨️ Bezig met voorbereiden van ${productsWithQR.length} QR labels...`)

      // Create a new window for printing
      const printWindow = window.open("", "_blank")
      if (!printWindow) {
        setImportError("Kon print venster niet openen")
        setTimeout(() => setImportError(""), 3000)
        return
      }

      // Generate HTML for all labels
      let labelsHTML = ""

      for (const product of productsWithQR) {
        const qrImageUrl = generateRealQRCode(product.qrcode!)
        const categoryName = product.categoryId ? categories.find((c) => c.id === product.categoryId)?.name || "" : ""

        // Truncate product name if too long (max 35 characters for label)
        const truncatedName = product.name.length > 35 ? product.name.substring(0, 32) + "..." : product.name

        labelsHTML += `
          <div class="label">
            <div class="label-header">
              <div class="product-name">${truncatedName}</div>
              ${categoryName ? `<div class="category">${categoryName}</div>` : ""}
            </div>
            <div class="qr-section">
              <img src="${qrImageUrl}" alt="QR Code" class="qr-code" />
            </div>
            <div class="qr-text">${product.qrcode}</div>
          </div>
        `
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>QR Labels - Alle Producten</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body {
                font-family: Arial, sans-serif;
                background: white;
                padding: 5mm;
              }
              
              .labels-container {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 2mm;
                width: 100%;
              }
              
              .label {
                width: 70mm;
                height: 42mm;
                border: 1px solid #000;
                padding: 2mm;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                background: white;
                page-break-inside: avoid;
                position: relative;
              }
              
              .label-header {
                text-align: center;
                margin-bottom: 1mm;
              }
              
              .product-name {
                font-size: 8px;
                font-weight: bold;
                line-height: 1.1;
                margin-bottom: 1mm;
                word-wrap: break-word;
                hyphens: auto;
              }
              
              .category {
                font-size: 6px;
                color: #666;
                font-style: italic;
              }
              
              .qr-section {
                display: flex;
                justify-content: center;
                align-items: center;
                flex: 1;
              }
              
              .qr-code {
                width: 25mm;
                height: 25mm;
                display: block;
              }
              
              .qr-text {
                font-size: 6px;
                font-family: 'Courier New', monospace;
                text-align: center;
                color: #333;
                margin-top: 1mm;
                letter-spacing: 0.5px;
              }
              
              @media print {
                body {
                  padding: 0;
                  margin: 0;
                }
                
                .labels-container {
                  gap: 1mm;
                }
                
                .label {
                  border: 0.5px solid #000;
                }
                
                @page {
                  size: A4;
                  margin: 5mm;
                }
              }
              
              /* Responsive aanpassingen voor kleinere labels */
              @media print and (max-width: 210mm) {
                .label {
                  width: 65mm;
                  height: 38mm;
                }
                
                .qr-code {
                  width: 22mm;
                  height: 22mm;
                }
              }
            </style>
          </head>
          <body>
            <div class="labels-container">
              ${labelsHTML}
            </div>
            <script>
              window.onload = function() {
                // Wacht even tot alle QR code afbeeldingen geladen zijn
                setTimeout(function() {
                  window.print();
                  setTimeout(function() {
                    window.close();
                  }, 1000);
                }, 2000);
              }
            </script>
          </body>
        </html>
      `)

      printWindow.document.close()

      setImportMessage(`✅ ${productsWithQR.length} QR labels klaargezet voor afdrukken!`)
      setTimeout(() => setImportMessage(""), 3000)
    } catch (error) {
      console.error("Error generating bulk QR labels:", error)
      setImportError("Fout bij genereren QR labels")
      setTimeout(() => setImportError(""), 3000)
    }
  }

  // Add functions
  const addNewUser = async () => {
    if (newUserName.trim() && !users.includes(newUserName.trim())) {
      const userName = newUserName.trim()
      const result = await saveUser(userName)
      if (result.error) {
        setImportError("Fout bij opslaan gebruiker")
        setTimeout(() => setImportError(""), 3000)
      } else {
        // FORCE LOCAL STATE UPDATE - TOEGEVOEGD
        console.log("🔄 Forcing local users refresh...")
        const refreshResult = await fetchUsers()
        if (refreshResult.data) {
          console.log("🔄 Updating local users state...")
          setUsers(refreshResult.data)
        }
        setImportMessage("✅ Gebruiker toegevoegd!")
        setTimeout(() => setImportMessage(""), 2000)
      }
      setNewUserName("")
    }
  }

  const addNewProduct = async () => {
    if (newProductName.trim()) {
      const newProduct: Product = {
        id: Date.now().toString(),
        name: newProductName.trim(),
        qrcode: newProductQrCode.trim() || undefined,
        categoryId: newProductCategory === "none" ? undefined : newProductCategory,
        created_at: new Date().toISOString(),
      }

      const result = await saveProduct(newProduct)
      if (result.error) {
        setImportError("Fout bij opslaan product")
        setTimeout(() => setImportError(""), 3000)
      } else {
        // FORCE LOCAL STATE UPDATE - TOEGEVOEGD
        console.log("🔄 Forcing local products refresh...")
        const refreshResult = await fetchProducts()
        if (refreshResult.data) {
          console.log("🔄 Updating local products state...")
          setProducts(refreshResult.data)
        }
        setImportMessage("✅ Product toegevoegd!")
        setTimeout(() => setImportMessage(""), 2000)
      }

      setNewProductName("")
      setNewProductQrCode("")
      setNewProductCategory("none")
    }
  }

  const addNewLocation = async () => {
    if (newLocationName.trim() && !locations.includes(newLocationName.trim())) {
      const locationName = newLocationName.trim()
      const result = await saveLocation(locationName)
      if (result.error) {
        setImportError("Fout bij opslaan locatie")
        setTimeout(() => setImportError(""), 3000)
      } else {
        // FORCE LOCAL STATE UPDATE - TOEGEVOEGD
        console.log("🔄 Forcing local locations refresh...")
        const refreshResult = await fetchLocations()
        if (refreshResult.data) {
          console.log("🔄 Updating local locations state...")
          setLocations(refreshResult.data)
        }
        setImportMessage("✅ Locatie toegevoegd!")
        setTimeout(() => setImportMessage(""), 2000)
      }
      setNewLocationName("")
    }
  }

  const addNewPurpose = async () => {
    if (newPurposeName.trim() && !purposes.includes(newPurposeName.trim())) {
      const purposeName = newPurposeName.trim()
      const result = await savePurpose(purposeName)
      if (result.error) {
        setImportError("Fout bij opslaan doel")
        setTimeout(() => setImportError(""), 3000)
      } else {
        // FORCE LOCAL STATE UPDATE - TOEGEVOEGD
        console.log("🔄 Forcing local purposes refresh...")
        const refreshResult = await fetchPurposes()
        if (refreshResult.data) {
          console.log("🔄 Updating local purposes state...")
          setPurposes(refreshResult.data)
        }
        setImportMessage("✅ Doel toegevoegd!")
        setTimeout(() => setImportMessage(""), 2000)
      }
      setNewPurposeName("")
    }
  }

  const addNewCategory = async () => {
    if (newCategoryName.trim() && !categories.find((c) => c.name === newCategoryName.trim())) {
      const categoryName = newCategoryName.trim()
      const result = await saveCategory({ name: categoryName })
      if (result.error) {
        setImportError("Fout bij opslaan categorie")
        setTimeout(() => setImportError(""), 3000)
      } else {
        // FORCE LOCAL STATE UPDATE - TOEGEVOEGD
        console.log("🔄 Forcing local categories refresh...")
        const refreshResult = await fetchCategories()
        if (refreshResult.data) {
          console.log("🔄 Updating local categories state...")
          setCategories(refreshResult.data)
        }
        setImportMessage("✅ Categorie toegevoegd!")
        setTimeout(() => setImportMessage(""), 2000)
      }
      setNewCategoryName("")
    }
  }

  // Remove functions
  const removeUser = async (userToRemove: string) => {
    const result = await deleteUser(userToRemove)
    if (result.error) {
      setImportError("Fout bij verwijderen gebruiker")
      setTimeout(() => setImportError(""), 3000)
    } else {
      const refreshResult = await fetchUsers()
      if (refreshResult.data) {
        setUsers(refreshResult.data)
      }
      setImportMessage("✅ Gebruiker verwijderd!")
      setTimeout(() => setImportMessage(""), 2000)
    }
  }

  const removeProduct = async (productToRemove: Product) => {
    const result = await deleteProduct(productToRemove.id)
    if (result.error) {
      setImportError("Fout bij verwijderen product")
      setTimeout(() => setImportError(""), 3000)
    } else {
      const refreshResult = await fetchProducts()
      if (refreshResult.data) {
        setProducts(refreshResult.data)
      }
      setImportMessage("✅ Product verwijderd!")
      setTimeout(() => setImportMessage(""), 2000)
    }
  }

  const removeLocation = async (locationToRemove: string) => {
    const result = await deleteLocation(locationToRemove)
    if (result.error) {
      setImportError("Fout bij verwijderen locatie")
      setTimeout(() => setImportError(""), 3000)
    } else {
      const refreshResult = await fetchLocations()
      if (refreshResult.data) {
        setLocations(refreshResult.data)
      }
      setImportMessage("✅ Locatie verwijderd!")
      setTimeout(() => setImportMessage(""), 2000)
    }
  }

  const removePurpose = async (purposeToRemove: string) => {
    const result = await deletePurpose(purposeToRemove)
    if (result.error) {
      setImportError("Fout bij verwijderen doel")
      setTimeout(() => setImportError(""), 3000)
    } else {
      const refreshResult = await fetchPurposes()
      if (refreshResult.data) {
        setPurposes(refreshResult.data)
      }
      setImportMessage("✅ Doel verwijderd!")
      setTimeout(() => setImportMessage(""), 2000)
    }
  }

  const removeCategory = async (categoryToRemove: Category) => {
    const result = await deleteCategory(categoryToRemove.id)
    if (result.error) {
      setImportError("Fout bij verwijderen categorie")
      setTimeout(() => setImportError(""), 3000)
    } else {
      const refreshResult = await fetchCategories()
      if (refreshResult.data) {
        setCategories(refreshResult.data)
      }
      setImportMessage("✅ Categorie verwijderd!")
      setTimeout(() => setImportMessage(""), 2000)
    }
  }

  // Function to get filtered and sorted registrations
  const getFilteredAndSortedRegistrations = () => {
    const filtered = registrations.filter((registration) => {
      // Search filter
      if (historySearchQuery) {
        const searchLower = historySearchQuery.toLowerCase()
        const matchesSearch =
          registration.user.toLowerCase().includes(searchLower) ||
          registration.product.toLowerCase().includes(searchLower) ||
          registration.location.toLowerCase().includes(searchLower) ||
          registration.purpose.toLowerCase().includes(searchLower) ||
          (registration.qrcode && registration.qrcode.toLowerCase().includes(searchLower))

        if (!matchesSearch) return false
      }

      // User filter
      if (selectedHistoryUser !== "all" && registration.user !== selectedHistoryUser) {
        return false
      }

      // Location filter
      if (selectedHistoryLocation !== "all" && registration.location !== selectedHistoryLocation) {
        return false
      }

      // Date range filter
      if (dateFrom && registration.date < dateFrom) {
        return false
      }
      if (dateTo && registration.date > dateTo) {
        return false
      }

      return true
    })

    // Sort the filtered results
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case "date":
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          break
        case "user":
          comparison = a.user.localeCompare(b.user)
          break
        case "product":
          comparison = a.product.localeCompare(b.product)
          break
        case "location":
          comparison = a.location.localeCompare(b.location)
          break
        case "purpose":
          comparison = a.purpose.localeCompare(b.purpose)
          break
        default:
          comparison = 0
      }

      return sortOrder === "newest" ? -comparison : comparison
    })

    return sorted
  }

  // CSV Export function
  const exportToCSV = () => {
    const filteredData = getFilteredAndSortedRegistrations()

    if (filteredData.length === 0) {
      setImportError("Geen data om te exporteren")
      setTimeout(() => setImportError(""), 3000)
      return
    }

    const headers = ["Datum", "Tijd", "Gebruiker", "Product", "Locatie", "Doel", "QR Code"]
    const csvContent = [
      headers.join(","),
      ...filteredData.map((reg) =>
        [reg.date, reg.time, reg.user, reg.product, reg.location, reg.purpose, reg.qrcode || ""].map(
          (field) => `"${field.replace(/"/g, '""')}"`,
        ),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `product-registraties-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setImportMessage(`✅ ${filteredData.length} registraties geëxporteerd naar CSV`)
    setTimeout(() => setImportMessage(""), 3000)
  }

  // CSV Import function
  const importFromCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const csv = e.target?.result as string
        const lines = csv.split("\n")
        const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim())

        // Validate headers
        const expectedHeaders = ["Datum", "Tijd", "Gebruiker", "Product", "Locatie", "Doel"]
        const hasValidHeaders = expectedHeaders.every((header) => headers.includes(header))

        if (!hasValidHeaders) {
          setImportError("Ongeldig CSV formaat. Verwachte kolommen: Datum, Tijd, Gebruiker, Product, Locatie, Doel")
          setTimeout(() => setImportError(""), 5000)
          return
        }

        const importedRegistrations = []
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue

          const values = line.split(",").map((v) => v.replace(/"/g, "").trim())
          if (values.length < 6) continue

          const dateIndex = headers.indexOf("Datum")
          const timeIndex = headers.indexOf("Tijd")
          const userIndex = headers.indexOf("Gebruiker")
          const productIndex = headers.indexOf("Product")
          const locationIndex = headers.indexOf("Locatie")
          const purposeIndex = headers.indexOf("Doel")
          const qrcodeIndex = headers.indexOf("QR Code")

          const date = values[dateIndex]
          const time = values[timeIndex]
          const user = values[userIndex]
          const product = values[productIndex]
          const location = values[locationIndex]
          const purpose = values[purposeIndex]
          const qrcode = qrcodeIndex >= 0 ? values[qrcodeIndex] : ""

          if (date && time && user && product && location && purpose) {
            const timestamp = new Date(`${date}T${time}`).toISOString()

            const registrationData = {
              user_name: user,
              product_name: product,
              location,
              purpose,
              timestamp,
              date,
              time,
              qr_code: qrcode || null,
            }

            importedRegistrations.push(registrationData)
          }
        }

        if (importedRegistrations.length === 0) {
          setImportError("Geen geldige registraties gevonden in CSV")
          setTimeout(() => setImportError(""), 3000)
          return
        }

        // Save all imported registrations
        setImportMessage(`Bezig met importeren van ${importedRegistrations.length} registraties...`)
        let successCount = 0

        for (const regData of importedRegistrations) {
          const result = await saveRegistration(regData)
          if (!result.error) {
            successCount++
          }
        }

        // Refresh registrations
        const refreshResult = await fetchRegistrations()
        if (refreshResult.data) {
          setRegistrations(refreshResult.data)
        }

        setImportMessage(`✅ ${successCount} van ${importedRegistrations.length} registraties geïmporteerd`)
        setTimeout(() => setImportMessage(""), 3000)
      } catch (error) {
        console.error("Error importing CSV:", error)
        setImportError("Fout bij importeren CSV bestand")
        setTimeout(() => setImportError(""), 3000)
      }
    }

    reader.readAsText(file)
    event.target.value = ""
  }

  // Statistics calculations
  const getStatistics = () => {
    const totalRegistrations = registrations.length
    const uniqueUsers = new Set(registrations.map((r) => r.user)).size
    const uniqueProducts = new Set(registrations.map((r) => r.product)).size

    // Most active user
    const userCounts = registrations.reduce(
      (acc, reg) => {
        acc[reg.user] = (acc[reg.user] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
    const mostActiveUser = Object.entries(userCounts).reduce((a, b) => (a[1] > b[1] ? a : b), ["", 0])

    // Most used product
    const productCounts = registrations.reduce(
      (acc, reg) => {
        acc[reg.product] = (acc[reg.product] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
    const mostUsedProduct = Object.entries(productCounts).reduce((a, b) => (a[1] > b[1] ? a : b), ["", 0])

    // Most used location
    const locationCounts = registrations.reduce(
      (acc, reg) => {
        acc[reg.location] = (acc[reg.location] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
    const mostUsedLocation = Object.entries(locationCounts).reduce((a, b) => (a[1] > b[1] ? a : b), ["", 0])

    // Registrations per day (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split("T")[0]
    }).reverse()

    const dailyRegistrations = last7Days.map((date) => ({
      date,
      count: registrations.filter((r) => r.date === date).length,
    }))

    return {
      totalRegistrations,
      uniqueUsers,
      uniqueProducts,
      mostActiveUser: mostActiveUser[0] || "Geen data",
      mostActiveUserCount: mostActiveUser[1] || 0,
      mostUsedProduct: mostUsedProduct[0] || "Geen data",
      mostUsedProductCount: mostUsedProduct[1] || 0,
      mostUsedLocation: mostUsedLocation[0] || "Geen data",
      mostUsedLocationCount: mostUsedLocation[1] || 0,
      dailyRegistrations,
    }
  }

  // Get filtered users for search
  const getFilteredUsers = () => {
    if (!userSearchQuery) return users
    return users.filter((user) => user.toLowerCase().includes(userSearchQuery.toLowerCase()))
  }

  // Get filtered products for product management
  const getFilteredProductsForManagement = () => {
    if (!productSearchFilter) return products
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(productSearchFilter.toLowerCase()) ||
        (product.qrcode && product.qrcode.toLowerCase().includes(productSearchFilter.toLowerCase())),
    )
  }

  // Show loading state
  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <div>
                <h3 className="text-lg font-semibold">App wordt geladen...</h3>
                <p className="text-sm text-gray-600 mt-2">{connectionStatus}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Product Registratie</h1>
              <p className="text-gray-600 mt-1">
                Status: {isSupabaseConnected ? "🟢 Supabase verbonden" : "🟡 Mock data actief"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                {products.length} producten • {registrations.length} registraties
              </p>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {showSuccess && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">✅ Product succesvol geregistreerd!</AlertDescription>
          </Alert>
        )}

        {importMessage && (
          <Alert className="mb-4 border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-800">{importMessage}</AlertDescription>
          </Alert>
        )}

        {importError && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{importError}</AlertDescription>
          </Alert>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="register" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="register">Registreren</TabsTrigger>
            <TabsTrigger value="history">Historie</TabsTrigger>
            <TabsTrigger value="products">Producten</TabsTrigger>
            <TabsTrigger value="users">Gebruikers</TabsTrigger>
            <TabsTrigger value="locations">Locaties & Doelen</TabsTrigger>
            <TabsTrigger value="statistics">Statistieken</TabsTrigger>
          </TabsList>

          {/* Registration Tab */}
          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Product Registratie</CardTitle>
                <CardDescription>Registreer het gebruik van een product</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* User Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="user">Gebruiker</Label>
                    <div className="relative">
                      <Input
                        id="user-search"
                        type="text"
                        placeholder="Zoek gebruiker..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="mb-2"
                      />
                      <Select value={currentUser} onValueChange={setCurrentUser}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer gebruiker" />
                        </SelectTrigger>
                        <SelectContent>
                          {getFilteredUsers().map((user) => (
                            <SelectItem key={user} value={user}>
                              {user}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Product Selection with QR Scanner */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="product">Product</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setQrScanMode("registration")
                          startQrScanner()
                        }}
                        className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        QR Scannen
                      </Button>
                    </div>

                    {/* Category Filter */}
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter op categorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle categorieën</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Product Search and Dropdown */}
                    <div className="relative" ref={productSelectorRef}>
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="Zoek product of QR code..."
                          value={productSearchQuery}
                          onChange={(e) => {
                            setProductSearchQuery(e.target.value)
                            setShowProductDropdown(true)
                          }}
                          onFocus={() => setShowProductDropdown(true)}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowProductDropdown(!showProductDropdown)}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </div>

                      {showProductDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                          {getFilteredProducts().length > 0 ? (
                            getFilteredProducts().map((product) => (
                              <button
                                key={product.id}
                                type="button"
                                className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                onClick={() => handleProductSelect(product)}
                              >
                                <div className="font-medium">{product.name}</div>
                                {product.qrcode && <div className="text-sm text-gray-500">QR: {product.qrcode}</div>}
                                {product.categoryId && (
                                  <div className="text-xs text-blue-600">
                                    {categories.find((c) => c.id === product.categoryId)?.name}
                                  </div>
                                )}
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-gray-500">Geen producten gevonden</div>
                          )}
                        </div>
                      )}
                    </div>

                    {selectedProduct && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                        <div className="font-medium text-green-800">Geselecteerd: {selectedProduct}</div>
                        {(() => {
                          const product = products.find((p) => p.name === selectedProduct)
                          return (
                            product && (
                              <>
                                {product.qrcode && (
                                  <div className="text-sm text-green-600">QR Code: {product.qrcode}</div>
                                )}
                                {product.categoryId && (
                                  <div className="text-sm text-green-600">
                                    Categorie: {categories.find((c) => c.id === product.categoryId)?.name}
                                  </div>
                                )}
                              </>
                            )
                          )
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Location Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="location">Locatie</Label>
                    <Select value={location} onValueChange={setLocation}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer locatie" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((loc) => (
                          <SelectItem key={loc} value={loc}>
                            {loc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Purpose Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="purpose">Doel</Label>
                    <Select value={purpose} onValueChange={setPurpose}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer doel" />
                      </SelectTrigger>
                      <SelectContent>
                        {purposes.map((purp) => (
                          <SelectItem key={purp} value={purp}>
                            {purp}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!currentUser || !selectedProduct || !location || !purpose || isLoading}
                  >
                    {isLoading ? "Bezig met opslaan..." : "Registreer Product"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Registratie Historie</CardTitle>
                    <CardDescription>Overzicht van alle product registraties</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={exportToCSV} className="bg-green-50 text-green-700">
                      Export CSV
                    </Button>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={importFromCSV}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Button variant="outline" className="bg-blue-50 text-blue-700">
                        Import CSV
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div>
                    <Label htmlFor="search">Zoeken</Label>
                    <Input
                      id="search"
                      placeholder="Zoek in alle velden..."
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="user-filter">Gebruiker</Label>
                    <Select value={selectedHistoryUser} onValueChange={setSelectedHistoryUser}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle gebruikers</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user} value={user}>
                            {user}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="location-filter">Locatie</Label>
                    <Select value={selectedHistoryLocation} onValueChange={setSelectedHistoryLocation}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle locaties</SelectItem>
                        {locations.map((location) => (
                          <SelectItem key={location} value={location}>
                            {location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="sort">Sorteren</Label>
                    <div className="flex gap-2">
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date">Datum</SelectItem>
                          <SelectItem value="user">Gebruiker</SelectItem>
                          <SelectItem value="product">Product</SelectItem>
                          <SelectItem value="location">Locatie</SelectItem>
                          <SelectItem value="purpose">Doel</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={sortOrder} onValueChange={setSortOrder}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">↓</SelectItem>
                          <SelectItem value="oldest">↑</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Date Range Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <Label htmlFor="date-from">Van datum</Label>
                    <Input id="date-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="date-to">Tot datum</Label>
                    <Input id="date-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                  </div>
                </div>

                {/* Results Summary */}
                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">
                    {getFilteredAndSortedRegistrations().length} van {registrations.length} registraties
                  </p>
                </div>

                {/* History Table */}
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Datum</TableHead>
                        <TableHead>Tijd</TableHead>
                        <TableHead>Gebruiker</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Locatie</TableHead>
                        <TableHead>Doel</TableHead>
                        <TableHead>QR Code</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredAndSortedRegistrations().length > 0 ? (
                        getFilteredAndSortedRegistrations().map((registration) => (
                          <TableRow key={registration.id}>
                            <TableCell>{registration.date}</TableCell>
                            <TableCell>{registration.time}</TableCell>
                            <TableCell>{registration.user}</TableCell>
                            <TableCell>{registration.product}</TableCell>
                            <TableCell>{registration.location}</TableCell>
                            <TableCell>{registration.purpose}</TableCell>
                            <TableCell className="font-mono text-sm">{registration.qrcode || "-"}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                            Geen registraties gevonden
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Product Beheer</CardTitle>
                    <CardDescription>Beheer producten en hun QR codes</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={printAllQRLabels}
                      className="bg-purple-50 text-purple-700 hover:bg-purple-100"
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Print Alle QR Labels
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add New Product */}
                <div className="p-4 border rounded-md bg-gray-50">
                  <h3 className="font-semibold mb-4">Nieuw Product Toevoegen</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Input
                      placeholder="Product naam"
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                    />
                    <div className="relative">
                      <Input
                        placeholder="QR code (optioneel)"
                        value={newProductQrCode}
                        onChange={(e) => setNewProductQrCode(e.target.value)}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => {
                          setQrScanMode("product-management")
                          startQrScanner()
                        }}
                      >
                        <QrCode className="w-4 h-4" />
                      </Button>
                    </div>
                    <Select value={newProductCategory} onValueChange={setNewProductCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Categorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Geen categorie</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={addNewProduct} disabled={!newProductName.trim()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Toevoegen
                    </Button>
                  </div>
                </div>

                {/* Product Search */}
                <div>
                  <Label htmlFor="product-search">Zoek Product</Label>
                  <Input
                    id="product-search"
                    placeholder="Zoek op naam of QR code..."
                    value={productSearchFilter}
                    onChange={(e) => setProductSearchFilter(e.target.value)}
                    className="max-w-md"
                  />
                </div>

                {/* Products List */}
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>QR Code</TableHead>
                        <TableHead>Categorie</TableHead>
                        <TableHead>Bijlage</TableHead>
                        <TableHead>Acties</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredProductsForManagement().length > 0 ? (
                        getFilteredProductsForManagement().map((product) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {product.qrcode ? (
                                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                    {product.qrcode}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-sm">Geen QR code</span>
                                )}
                                {product.qrcode && (
                                  <div className="flex items-center gap-1">
                                    <ProfessionalQRCode value={product.qrcode} size={32} />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => printQRCode(product)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Printer className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {product.categoryId
                                ? categories.find((c) => c.id === product.categoryId)?.name || "Onbekend"
                                : "Geen categorie"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {product.attachmentUrl ? (
                                  <div className="flex items-center gap-2">
                                    <a
                                      href={product.attachmentUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                      📎 {product.attachmentName}
                                    </a>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveAttachment(product)}
                                      className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="relative">
                                    <input
                                      type="file"
                                      accept=".pdf"
                                      onChange={(e) => handleAttachmentUpload(product, e)}
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <Button variant="outline" size="sm" className="text-xs">
                                      📎 PDF toevoegen
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditProduct(product)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                {!product.qrcode && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => generateQRCode(product)}
                                    className="h-8 w-8 p-0 text-green-600"
                                  >
                                    <QrCode className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeProduct(product)}
                                  className="h-8 w-8 p-0 text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                            Geen producten gevonden
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Gebruiker Beheer</CardTitle>
                <CardDescription>Beheer gebruikers van het systeem</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add New User */}
                <div className="p-4 border rounded-md bg-gray-50">
                  <h3 className="font-semibold mb-4">Nieuwe Gebruiker Toevoegen</h3>
                  <div className="flex gap-4">
                    <Input
                      placeholder="Gebruiker naam"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={addNewUser} disabled={!newUserName.trim()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Toevoegen
                    </Button>
                  </div>
                </div>

                {/* Users List */}
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Gebruiker</TableHead>
                        <TableHead>Aantal Registraties</TableHead>
                        <TableHead>Laatste Activiteit</TableHead>
                        <TableHead>Acties</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => {
                        const userRegistrations = registrations.filter((r) => r.user === user)
                        const lastActivity = userRegistrations.length > 0 ? userRegistrations[0].date : "Nooit"
                        return (
                          <TableRow key={user}>
                            <TableCell className="font-medium">{user}</TableCell>
                            <TableCell>{userRegistrations.length}</TableCell>
                            <TableCell>{lastActivity}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditUser(user)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeUser(user)}
                                  className="h-8 w-8 p-0 text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Locations & Purposes Tab */}
          <TabsContent value="locations">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Locations */}
              <Card>
                <CardHeader>
                  <CardTitle>Locaties</CardTitle>
                  <CardDescription>Beheer beschikbare locaties</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Add New Location */}
                  <div className="p-4 border rounded-md bg-gray-50">
                    <h3 className="font-semibold mb-4">Nieuwe Locatie Toevoegen</h3>
                    <div className="flex gap-4">
                      <Input
                        placeholder="Locatie naam"
                        value={newLocationName}
                        onChange={(e) => setNewLocationName(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={addNewLocation} disabled={!newLocationName.trim()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Toevoegen
                      </Button>
                    </div>
                  </div>

                  {/* Locations List */}
                  <div className="space-y-2">
                    {locations.map((location) => {
                      const locationUsage = registrations.filter((r) => r.location === location).length
                      return (
                        <div key={location} className="flex items-center justify-between p-3 border rounded-md">
                          <div>
                            <div className="font-medium">{location}</div>
                            <div className="text-sm text-gray-500">{locationUsage} registraties</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditLocation(location)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLocation(location)}
                              className="h-8 w-8 p-0 text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Purposes */}
              <Card>
                <CardHeader>
                  <CardTitle>Doelen</CardTitle>
                  <CardDescription>Beheer beschikbare doelen</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Add New Purpose */}
                  <div className="p-4 border rounded-md bg-gray-50">
                    <h3 className="font-semibold mb-4">Nieuw Doel Toevoegen</h3>
                    <div className="flex gap-4">
                      <Input
                        placeholder="Doel naam"
                        value={newPurposeName}
                        onChange={(e) => setNewPurposeName(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={addNewPurpose} disabled={!newPurposeName.trim()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Toevoegen
                      </Button>
                    </div>
                  </div>

                  {/* Purposes List */}
                  <div className="space-y-2">
                    {purposes.map((purpose) => {
                      const purposeUsage = registrations.filter((r) => r.purpose === purpose).length
                      return (
                        <div key={purpose} className="flex items-center justify-between p-3 border rounded-md">
                          <div>
                            <div className="font-medium">{purpose}</div>
                            <div className="text-sm text-gray-500">{purposeUsage} registraties</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditPurpose(purpose)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removePurpose(purpose)}
                              className="h-8 w-8 p-0 text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Categories */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Categorieën</CardTitle>
                  <CardDescription>Beheer product categorieën</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Add New Category */}
                  <div className="p-4 border rounded-md bg-gray-50">
                    <h3 className="font-semibold mb-4">Nieuwe Categorie Toevoegen</h3>
                    <div className="flex gap-4">
                      <Input
                        placeholder="Categorie naam"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={addNewCategory} disabled={!newCategoryName.trim()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Toevoegen
                      </Button>
                    </div>
                  </div>

                  {/* Categories List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories.map((category) => {
                      const categoryProducts = products.filter((p) => p.categoryId === category.id).length
                      return (
                        <div key={category.id} className="flex items-center justify-between p-3 border rounded-md">
                          <div>
                            <div className="font-medium">{category.name}</div>
                            <div className="text-sm text-gray-500">{categoryProducts} producten</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCategory(category)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCategory(category)}
                              className="h-8 w-8 p-0 text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(() => {
                const stats = getStatistics()
                return (
                  <>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Totaal Registraties</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.totalRegistrations}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Actieve Gebruikers</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Gebruikte Producten</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.uniqueProducts}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Totaal Producten</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{products.length}</div>
                      </CardContent>
                    </Card>

                    <Card className="md:col-span-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Meest Actieve Gebruiker</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-lg font-semibold">{stats.mostActiveUser}</div>
                        <div className="text-sm text-gray-500">{stats.mostActiveUserCount} registraties</div>
                      </CardContent>
                    </Card>

                    <Card className="md:col-span-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Meest Gebruikt Product</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-lg font-semibold">{stats.mostUsedProduct}</div>
                        <div className="text-sm text-gray-500">{stats.mostUsedProductCount} keer gebruikt</div>
                      </CardContent>
                    </Card>

                    <Card className="lg:col-span-4">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Registraties Laatste 7 Dagen</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-7 gap-2">
                          {stats.dailyRegistrations.map((day) => (
                            <div key={day.date} className="text-center">
                              <div className="text-xs text-gray-500 mb-1">
                                {new Date(day.date).toLocaleDateString("nl-NL", { weekday: "short" })}
                              </div>
                              <div className="text-lg font-semibold">{day.count}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(day.date).toLocaleDateString("nl-NL", { month: "short", day: "numeric" })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )
              })()}
            </div>
          </TabsContent>
        </Tabs>

        {/* QR Scanner Modal */}
        {showQrScanner && (
          <Dialog open={showQrScanner} onOpenChange={stopQrScanner}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>QR Code Scanner</DialogTitle>
                <DialogDescription>
                  {qrScanMode === "registration"
                    ? "Scan een QR code om een product te selecteren"
                    : "Scan een QR code voor het nieuwe product"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <QrCode className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-4">
                    Richt je draadloze scanner op de QR code en scan, of voer de code handmatig in
                  </p>

                  {/* Manual Input Field - VERBETERD */}
                  <div className="space-y-3">
                    <Input
                      ref={(el) => {
                        manualInputRef.current = el
                        // Callback ref voor directe focus
                        if (el && showQrScanner) {
                          // Meerdere focus pogingen
                          el.focus()
                          setTimeout(() => el.focus(), 10)
                          setTimeout(() => el.focus(), 50)
                          setTimeout(() => el.focus(), 100)
                        }
                      }}
                      type="text"
                      placeholder="QR code hier..."
                      value={qrScanResult}
                      onChange={(e) => setQrScanResult(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && qrScanResult.trim()) {
                          handleQrCodeDetected(qrScanResult.trim())
                        }
                        if (e.key === "Escape") {
                          stopQrScanner()
                        }
                      }}
                      onBlur={(e) => {
                        // Auto-process als er een waarde is en focus verloren gaat
                        if (e.target.value.trim()) {
                          setTimeout(() => {
                            if (e.target.value.trim()) {
                              handleQrCodeDetected(e.target.value.trim())
                            }
                          }, 100)
                        }
                      }}
                      className="text-center font-mono"
                      autoFocus
                    />

                    {qrScanResult && (
                      <Button onClick={() => handleQrCodeDetected(qrScanResult)} className="w-full" variant="default">
                        ✅ Gebruik deze code
                      </Button>
                    )}
                  </div>

                  <div className="mt-4 text-xs text-gray-500">
                    <p>💡 Tips:</p>
                    <p>• Zorg dat je scanner op QWERTY/AZERTY is ingesteld</p>
                    <p>• Druk Enter om de code te gebruiken</p>
                    <p>• Druk ESC om te sluiten</p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Product Dialog */}
        {showEditDialog && editingProduct && (
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Product Bewerken</DialogTitle>
                <DialogDescription>Wijzig de product gegevens</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-product-name">Product Naam</Label>
                  <Input
                    id="edit-product-name"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-product-qr">QR Code</Label>
                  <Input
                    id="edit-product-qr"
                    value={editingProduct.qrcode || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, qrcode: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-product-category">Categorie</Label>
                  <Select
                    value={editingProduct.categoryId || "none"}
                    onValueChange={(value) =>
                      setEditingProduct({ ...editingProduct, categoryId: value === "none" ? undefined : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Geen categorie</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                    Annuleren
                  </Button>
                  <Button onClick={handleSaveProduct}>Opslaan</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit User Dialog */}
        {showEditUserDialog && (
          <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gebruiker Bewerken</DialogTitle>
                <DialogDescription>Wijzig de gebruiker naam</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-user-name">Gebruiker Naam</Label>
                  <Input id="edit-user-name" value={editingUser} onChange={(e) => setEditingUser(e.target.value)} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowEditUserDialog(false)}>
                    Annuleren
                  </Button>
                  <Button onClick={handleSaveUser}>Opslaan</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Category Dialog */}
        {showEditCategoryDialog && editingCategory && (
          <Dialog open={showEditCategoryDialog} onOpenChange={setShowEditCategoryDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Categorie Bewerken</DialogTitle>
                <DialogDescription>Wijzig de categorie naam</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-category-name">Categorie Naam</Label>
                  <Input
                    id="edit-category-name"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowEditCategoryDialog(false)}>
                    Annuleren
                  </Button>
                  <Button onClick={handleSaveCategory}>Opslaan</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Location Dialog */}
        {showEditLocationDialog && (
          <Dialog open={showEditLocationDialog} onOpenChange={setShowEditLocationDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Locatie Bewerken</DialogTitle>
                <DialogDescription>Wijzig de locatie naam</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-location-name">Locatie Naam</Label>
                  <Input
                    id="edit-location-name"
                    value={editingLocation}
                    onChange={(e) => setEditingLocation(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowEditLocationDialog(false)}>
                    Annuleren
                  </Button>
                  <Button onClick={handleSaveLocation}>Opslaan</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Purpose Dialog */}
        {showEditPurposeDialog && (
          <Dialog open={showEditPurposeDialog} onOpenChange={setShowEditPurposeDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Doel Bewerken</DialogTitle>
                <DialogDescription>Wijzig het doel</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-purpose-name">Doel</Label>
                  <Input
                    id="edit-purpose-name"
                    value={editingPurpose}
                    onChange={(e) => setEditingPurpose(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowEditPurposeDialog(false)}>
                    Annuleren
                  </Button>
                  <Button onClick={handleSavePurpose}>Opslaan</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}

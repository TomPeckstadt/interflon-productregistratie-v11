import { createClient } from "@supabase/supabase-js"

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log("🔧 Supabase Configuration Check:")
console.log("URL:", supabaseUrl ? "✅ Set" : "❌ Missing")
console.log("Key:", supabaseAnonKey ? "✅ Set" : "❌ Missing")

// Add this right after the existing console.log statements
console.log("🔧 Full environment check:")
console.log("- NODE_ENV:", process.env.NODE_ENV)
console.log("- URL length:", supabaseUrl?.length || 0)
console.log("- Key length:", supabaseAnonKey?.length || 0)
console.log("- URL starts with https:", supabaseUrl?.startsWith("https://"))
console.log("- URL contains supabase.co:", supabaseUrl?.includes("supabase.co"))

// Test the actual values (safely)
if (supabaseUrl && supabaseAnonKey) {
  console.log("🔧 Attempting to create Supabase client...")
  console.log("- URL format check:", /^https:\/\/[a-z]+\.supabase\.co$/.test(supabaseUrl))
  console.log("- Key format check:", supabaseAnonKey.length > 100)
}

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  console.log("🔧 Environment variables check:")
  console.log("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : "❌ MISSING")
  console.log(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY:",
    supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : "❌ MISSING",
  )

  const configured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl.includes("supabase"))
  console.log("🔍 Supabase configured:", configured)

  if (!configured) {
    console.log("❌ Supabase configuration failed:")
    if (!supabaseUrl) console.log("  - Missing NEXT_PUBLIC_SUPABASE_URL")
    if (!supabaseAnonKey) console.log("  - Missing NEXT_PUBLIC_SUPABASE_ANON_KEY")
    if (supabaseUrl && !supabaseUrl.includes("supabase")) console.log("  - Invalid URL format")
  }

  return configured
}

// Test Supabase connection
export const testSupabaseConnection = async () => {
  console.log("🔍 === DETAILED CONNECTION TEST ===")

  if (!supabase) {
    console.log("❌ No Supabase client available")
    return false
  }

  try {
    console.log("🔍 Testing basic connection...")

    // Test 1: Simple query
    console.log("🔍 Test 1: Basic select query...")
    const { data: testData, error: testError } = await supabase
      .from("users")
      .select("count", { count: "exact", head: true })

    if (testError) {
      console.error("❌ Basic query failed:", testError)
      console.error("❌ Error details:", {
        message: testError.message,
        details: testError.details,
        hint: testError.hint,
        code: testError.code,
      })
      return false
    }

    console.log("✅ Basic query successful")

    // Test 2: Check each table individually
    const tables = ["users", "products", "categories", "locations", "purposes", "registrations"]

    for (const table of tables) {
      console.log(`🔍 Testing table: ${table}`)
      try {
        const { data, error } = await supabase.from(table).select("*", { count: "exact", head: true })

        if (error) {
          console.error(`❌ Table ${table} failed:`, error)
        } else {
          console.log(`✅ Table ${table} accessible`)
        }
      } catch (err) {
        console.error(`❌ Table ${table} exception:`, err)
      }
    }

    console.log("✅ Supabase connection test completed")
    return true
  } catch (error) {
    console.error("❌ Supabase connection test error:", error)
    return false
  }
}

// Create Supabase client
let supabase: any = null

if (isSupabaseConfigured()) {
  try {
    supabase = createClient(supabaseUrl!, supabaseAnonKey!)
    console.log("✅ Supabase client initialized")
  } catch (error) {
    console.error("❌ Error creating Supabase client:", error)
    supabase = null
  }
} else {
  console.log("⚠️ Supabase not configured, using localStorage mode")
}

// Types
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

// Mock data for when Supabase is not configured
const mockUsers = ["Jan Janssen", "Marie Pietersen", "Piet de Vries", "Anna van der Berg"]
const mockProducts: Product[] = [
  { id: "1", name: "Interflon Fin Super", qrcode: "IFLS001", categoryId: "1" },
  { id: "2", name: "Interflon Food Lube", qrcode: "IFFL002", categoryId: "1" },
  { id: "3", name: "Interflon Degreaser", qrcode: "IFD003", categoryId: "2" },
  { id: "4", name: "Interflon Fin Grease", qrcode: "IFGR004", categoryId: "1" },
  { id: "5", name: "Interflon Metal Clean", qrcode: "IFMC005", categoryId: "2" },
  { id: "6", name: "Interflon Maintenance Kit", qrcode: "IFMK006", categoryId: "3" },
]
const mockLocations = ["Kantoor 1.1", "Kantoor 1.2", "Vergaderzaal A", "Warehouse", "Thuis"]
const mockPurposes = ["Presentatie", "Thuiswerken", "Reparatie", "Training", "Demonstratie"]
const mockCategories: Category[] = [
  { id: "1", name: "Smeermiddelen" },
  { id: "2", name: "Reinigers" },
  { id: "3", name: "Onderhoud" },
]
const mockRegistrations: Registration[] = []

// SIMPLIFIED: Fetch functions
export const fetchUsers = async () => {
  if (!supabase) {
    console.log("📊 No Supabase - using mock users")
    return { data: mockUsers, error: null }
  }

  try {
    console.log("📊 Fetching users from Supabase...")
    const { data, error } = await supabase.from("users").select("name").order("name")

    if (error) {
      console.error("❌ Error fetching users:", error)
      return { data: mockUsers, error }
    }

    const userNames = data?.map((user: any) => user.name) || []
    console.log(`📊 Fetched ${userNames.length} users from Supabase`)
    return { data: userNames.length > 0 ? userNames : mockUsers, error: null }
  } catch (error) {
    console.error("❌ Error in fetchUsers:", error)
    return { data: mockUsers, error }
  }
}

export const fetchProducts = async () => {
  if (!supabase) {
    console.log("📊 No Supabase - using mock products")
    return { data: mockProducts, error: null }
  }

  try {
    console.log("📊 Fetching products from Supabase...")
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error fetching products:", error)
      return { data: mockProducts, error }
    }

    const products =
      data?.map((product: any) => ({
        id: product.id.toString(),
        name: product.name,
        qrcode: product.qr_code,
        categoryId: product.category_id?.toString(),
        created_at: product.created_at,
        attachmentUrl: product.attachment_url,
        attachmentName: product.attachment_name,
      })) || []

    console.log(`📊 Fetched ${products.length} products from Supabase`)
    return { data: products.length > 0 ? products : mockProducts, error: null }
  } catch (error) {
    console.error("❌ Error in fetchProducts:", error)
    return { data: mockProducts, error }
  }
}

export const fetchLocations = async () => {
  if (!supabase) {
    console.log("📊 No Supabase - using mock locations")
    return { data: mockLocations, error: null }
  }

  try {
    console.log("📊 Fetching locations from Supabase...")
    const { data, error } = await supabase.from("locations").select("name").order("name")

    if (error) {
      console.error("❌ Error fetching locations:", error)
      return { data: mockLocations, error }
    }

    const locationNames = data?.map((location: any) => location.name) || []
    console.log(`📊 Fetched ${locationNames.length} locations from Supabase`)
    return { data: locationNames.length > 0 ? locationNames : mockLocations, error: null }
  } catch (error) {
    console.error("❌ Error in fetchLocations:", error)
    return { data: mockLocations, error }
  }
}

export const fetchPurposes = async () => {
  if (!supabase) {
    console.log("📊 No Supabase - using mock purposes")
    return { data: mockPurposes, error: null }
  }

  try {
    console.log("📊 Fetching purposes from Supabase...")
    const { data, error } = await supabase.from("purposes").select("name").order("name")

    if (error) {
      console.error("❌ Error fetching purposes:", error)
      return { data: mockPurposes, error }
    }

    const purposeNames = data?.map((purpose: any) => purpose.name) || []
    console.log(`📊 Fetched ${purposeNames.length} purposes from Supabase`)
    return { data: purposeNames.length > 0 ? purposeNames : mockPurposes, error: null }
  } catch (error) {
    console.error("❌ Error in fetchPurposes:", error)
    return { data: mockPurposes, error }
  }
}

export const fetchCategories = async () => {
  if (!supabase) {
    console.log("📊 No Supabase - using mock categories")
    return { data: mockCategories, error: null }
  }

  try {
    console.log("📊 Fetching categories from Supabase...")
    const { data, error } = await supabase.from("categories").select("*").order("name")

    if (error) {
      console.error("❌ Error fetching categories:", error)
      return { data: mockCategories, error }
    }

    const categories =
      data?.map((category: any) => ({
        id: category.id.toString(),
        name: category.name,
      })) || []

    console.log(`📊 Fetched ${categories.length} categories from Supabase`)
    return { data: categories.length > 0 ? categories : mockCategories, error: null }
  } catch (error) {
    console.error("❌ Error in fetchCategories:", error)
    return { data: mockCategories, error }
  }
}

export const fetchRegistrations = async () => {
  if (!supabase) {
    console.log("📊 No Supabase - using mock registrations")
    return { data: mockRegistrations, error: null }
  }

  try {
    console.log("📊 Fetching registrations from Supabase...")
    const { data, error } = await supabase.from("registrations").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error fetching registrations:", error)
      return { data: mockRegistrations, error }
    }

    const registrations =
      data?.map((registration: any) => ({
        id: registration.id.toString(),
        user: registration.user_name,
        product: registration.product_name,
        location: registration.location,
        purpose: registration.purpose,
        timestamp: registration.timestamp,
        date: registration.date,
        time: registration.time,
        qrcode: registration.qr_code,
        created_at: registration.created_at,
      })) || []

    console.log(`📊 Fetched ${registrations.length} registrations from Supabase`)
    return { data: registrations, error: null }
  } catch (error) {
    console.error("❌ Error in fetchRegistrations:", error)
    return { data: mockRegistrations, error }
  }
}

// SIMPLIFIED: Save functions
export const saveUser = async (name: string) => {
  if (!supabase) {
    console.log("💾 No Supabase - mock save user:", name)
    return { data: name, error: null }
  }

  try {
    console.log("💾 Saving user to Supabase:", name)
    const { data, error } = await supabase.from("users").insert([{ name }]).select()

    if (error) {
      console.error("❌ Error saving user:", error)
      return { data: null, error }
    }

    console.log("✅ User saved to Supabase")
    return { data: name, error: null }
  } catch (error) {
    console.error("❌ Error in saveUser:", error)
    return { data: null, error }
  }
}

export const saveProduct = async (product: Product) => {
  if (!supabase) {
    console.log("💾 No Supabase - mock save product:", product)
    return { data: product, error: null }
  }

  try {
    console.log("💾 Saving product to Supabase:", product)
    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          name: product.name,
          qr_code: product.qrcode || null,
          category_id: product.categoryId ? Number.parseInt(product.categoryId) : null,
        },
      ])
      .select()

    if (error) {
      console.error("❌ Error saving product:", error)
      return { data: null, error }
    }

    console.log("✅ Product saved to Supabase")
    const savedProduct: Product = {
      id: data[0].id.toString(),
      name: data[0].name,
      qrcode: data[0].qr_code,
      categoryId: data[0].category_id?.toString(),
      created_at: data[0].created_at,
    }
    return { data: savedProduct, error: null }
  } catch (error) {
    console.error("❌ Error in saveProduct:", error)
    return { data: null, error }
  }
}

export const saveLocation = async (name: string) => {
  if (!supabase) {
    console.log("💾 No Supabase - mock save location:", name)
    return { data: name, error: null }
  }

  try {
    console.log("💾 Saving location to Supabase:", name)
    const { data, error } = await supabase.from("locations").insert([{ name }]).select()

    if (error) {
      console.error("❌ Error saving location:", error)
      return { data: null, error }
    }

    console.log("✅ Location saved to Supabase")
    return { data: name, error: null }
  } catch (error) {
    console.error("❌ Error in saveLocation:", error)
    return { data: null, error }
  }
}

export const savePurpose = async (name: string) => {
  if (!supabase) {
    console.log("💾 No Supabase - mock save purpose:", name)
    return { data: name, error: null }
  }

  try {
    console.log("💾 Saving purpose to Supabase:", name)
    const { data, error } = await supabase.from("purposes").insert([{ name }]).select()

    if (error) {
      console.error("❌ Error saving purpose:", error)
      return { data: null, error }
    }

    console.log("✅ Purpose saved to Supabase")
    return { data: name, error: null }
  } catch (error) {
    console.error("❌ Error in savePurpose:", error)
    return { data: null, error }
  }
}

export const saveCategory = async (category: { name: string }) => {
  if (!supabase) {
    console.log("💾 No Supabase - mock save category:", category)
    const mockCategory: Category = { id: Date.now().toString(), name: category.name }
    return { data: mockCategory, error: null }
  }

  try {
    console.log("💾 Saving category to Supabase:", category)
    const { data, error } = await supabase
      .from("categories")
      .insert([{ name: category.name }])
      .select()

    if (error) {
      console.error("❌ Error saving category:", error)
      return { data: null, error }
    }

    console.log("✅ Category saved to Supabase")
    const savedCategory: Category = {
      id: data[0].id.toString(),
      name: data[0].name,
    }
    return { data: savedCategory, error: null }
  } catch (error) {
    console.error("❌ Error in saveCategory:", error)
    return { data: null, error }
  }
}

export const saveRegistration = async (registration: any) => {
  if (!supabase) {
    console.log("💾 No Supabase - mock save registration:", registration)
    return { data: registration, error: null }
  }

  try {
    console.log("💾 Saving registration to Supabase:", registration)
    const { data, error } = await supabase.from("registrations").insert([registration]).select()

    if (error) {
      console.error("❌ Error saving registration:", error)
      return { data: null, error }
    }

    console.log("✅ Registration saved to Supabase")
    return { data: data[0], error: null }
  } catch (error) {
    console.error("❌ Error in saveRegistration:", error)
    return { data: null, error }
  }
}

// SIMPLIFIED: Update functions
export const updateProduct = async (id: string, updates: any) => {
  if (!supabase) {
    console.log("🔄 No Supabase - mock update product:", { id, updates })
    return { data: { id, ...updates }, error: null }
  }

  try {
    console.log("🔄 === PRODUCT UPDATE DEBUG ===")
    console.log("🔄 Product ID:", id, typeof id)
    console.log("🔄 Updates received:", updates)

    // Ensure all fields are properly handled
    const updateData = {
      name: updates.name,
      qr_code: updates.qr_code,
      category_id: updates.category_id === null ? null : Number(updates.category_id),
      attachment_url: updates.attachment_url || null,
      attachment_name: updates.attachment_name || null,
    }

    console.log("🔄 Final update data:", updateData)
    console.log("🔄 Attempting to update product with ID:", Number(id))

    const { data, error } = await supabase.from("products").update(updateData).eq("id", Number(id)).select()

    console.log("🔄 Supabase response:", { data, error })

    if (error) {
      console.error("❌ Error updating product:", error)
      console.error("❌ Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      return { data: null, error }
    }

    if (!data || data.length === 0) {
      console.error("❌ No product found with ID:", id)
      return { data: null, error: { message: "Product not found" } }
    }

    console.log("✅ Product updated in Supabase:", data[0])
    return { data: data[0], error: null }
  } catch (error) {
    console.error("❌ Exception in updateProduct:", error)
    return { data: null, error }
  }
}

export const updateUser = async (oldName: string, newName: string) => {
  if (!supabase) {
    console.log("🔄 No Supabase - mock update user:", { oldName, newName })
    return { data: { name: newName }, error: null }
  }

  try {
    console.log("🔄 Updating user in Supabase:", { oldName, newName })
    const { data, error } = await supabase.from("users").update({ name: newName }).eq("name", oldName).select()

    if (error) {
      console.error("❌ Error updating user:", error)
      return { data: null, error }
    }

    console.log("✅ User updated in Supabase")
    return { data: { name: newName }, error: null }
  } catch (error) {
    console.error("❌ Error in updateUser:", error)
    return { data: null, error }
  }
}

export const updateCategory = async (id: string, updates: any) => {
  if (!supabase) {
    console.log("🔄 No Supabase - mock update category:", { id, updates })
    return { data: { id, ...updates }, error: null }
  }

  try {
    console.log("🔄 Updating category in Supabase:", { id, updates })
    const { data, error } = await supabase.from("categories").update(updates).eq("id", id).select()

    if (error) {
      console.error("❌ Error updating category:", error)
      return { data: null, error }
    }

    console.log("✅ Category updated in Supabase:", data)
    return { data: data[0], error: null }
  } catch (error) {
    console.error("❌ Error in updateCategory:", error)
    return { data: null, error }
  }
}

export const updateLocation = async (oldName: string, newName: string) => {
  if (!supabase) {
    console.log("🔄 No Supabase - mock update location:", { oldName, newName })
    return { data: { name: newName }, error: null }
  }

  try {
    console.log("🔄 Updating location in Supabase:", { oldName, newName })
    const { data, error } = await supabase.from("locations").update({ name: newName }).eq("name", oldName).select()

    if (error) {
      console.error("❌ Error updating location:", error)
      return { data: null, error }
    }

    console.log("✅ Location updated in Supabase")
    return { data: { name: newName }, error: null }
  } catch (error) {
    console.error("❌ Error in updateLocation:", error)
    return { data: null, error }
  }
}

export const updatePurpose = async (oldName: string, newName: string) => {
  if (!supabase) {
    console.log("🔄 No Supabase - mock update purpose:", { oldName, newName })
    return { data: { name: newName }, error: null }
  }

  try {
    console.log("🔄 Updating purpose in Supabase:", { oldName, newName })

    const { data, error } = await supabase.from("purposes").update({ name: newName }).eq("name", oldName).select()

    if (error) {
      console.error("❌ Error updating purpose:", error)
      return { data: null, error }
    }

    if (!data || data.length === 0) {
      console.error("❌ No purpose found to update:", oldName)
      return { data: null, error: { message: "Purpose not found" } }
    }

    console.log("✅ Purpose updated in Supabase:", data)
    return { data: { name: newName }, error: null }
  } catch (error) {
    console.error("❌ Error in updatePurpose:", error)
    return { data: null, error }
  }
}

// SIMPLIFIED: Delete functions
export const deleteUser = async (name: string) => {
  if (!supabase) {
    console.log("🗑️ No Supabase - mock delete user:", name)
    return { data: null, error: null }
  }

  try {
    console.log("🗑️ Deleting user from Supabase:", name)
    const { error } = await supabase.from("users").delete().eq("name", name)

    if (error) {
      console.error("❌ Error deleting user:", error)
      return { data: null, error }
    }

    console.log("✅ User deleted from Supabase")
    return { data: null, error: null }
  } catch (error) {
    console.error("❌ Error in deleteUser:", error)
    return { data: null, error }
  }
}

export const deleteProduct = async (id: string) => {
  if (!supabase) {
    console.log("🗑️ No Supabase - mock delete product:", id)
    return { data: null, error: null }
  }

  try {
    console.log("🗑️ Deleting product from Supabase:", id)
    const { error } = await supabase.from("products").delete().eq("id", id)

    if (error) {
      console.error("❌ Error deleting product:", error)
      return { data: null, error }
    }

    console.log("✅ Product deleted from Supabase")
    return { data: null, error: null }
  } catch (error) {
    console.error("❌ Error in deleteProduct:", error)
    return { data: null, error }
  }
}

export const deleteLocation = async (name: string) => {
  if (!supabase) {
    console.log("🗑️ No Supabase - mock delete location:", name)
    return { data: null, error: null }
  }

  try {
    console.log("🗑️ Deleting location from Supabase:", name)
    const { error } = await supabase.from("locations").delete().eq("name", name)

    if (error) {
      console.error("❌ Error deleting location:", error)
      return { data: null, error }
    }

    console.log("✅ Location deleted from Supabase")
    return { data: null, error: null }
  } catch (error) {
    console.error("❌ Error in deleteLocation:", error)
    return { data: null, error }
  }
}

export const deletePurpose = async (name: string) => {
  if (!supabase) {
    console.log("🗑️ No Supabase - mock delete purpose:", name)
    return { data: null, error: null }
  }

  try {
    console.log("🗑️ Deleting purpose from Supabase:", name)
    const { error } = await supabase.from("purposes").delete().eq("name", name)

    if (error) {
      console.error("❌ Error deleting purpose:", error)
      return { data: null, error }
    }

    console.log("✅ Purpose deleted from Supabase")
    return { data: null, error: null }
  } catch (error) {
    console.error("❌ Error in deletePurpose:", error)
    return { data: null, error }
  }
}

export const deleteCategory = async (id: string) => {
  if (!supabase) {
    console.log("🗑️ No Supabase - mock delete category:", id)
    return { data: null, error: null }
  }

  try {
    console.log("🗑️ Deleting category from Supabase:", id)
    const { error } = await supabase.from("categories").delete().eq("id", id)

    if (error) {
      console.error("❌ Error deleting category:", error)
      return { data: null, error }
    }

    console.log("✅ Category deleted from Supabase")
    return { data: null, error: null }
  } catch (error) {
    console.error("❌ Error in deleteCategory:", error)
    return { data: null, error }
  }
}

// SIMPLIFIED: Real-time subscriptions
export const subscribeToUsers = (callback: (users: string[]) => void) => {
  if (!supabase) {
    console.log("🔔 No Supabase - users subscription disabled")
    return null
  }

  console.log("🔔 Setting up users subscription...")
  const subscription = supabase
    .channel("users_changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "users" }, async () => {
      console.log("🔔 Users table changed - refetching...")
      const result = await fetchUsers()
      if (result.data) {
        callback(result.data)
      }
    })
    .subscribe()

  return subscription
}

export const subscribeToProducts = (callback: (products: Product[]) => void) => {
  if (!supabase) {
    console.log("🔔 No Supabase - products subscription disabled")
    return null
  }

  console.log("🔔 Setting up products subscription...")
  const subscription = supabase
    .channel("products_changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "products" }, async () => {
      console.log("🔔 Products table changed - refetching...")
      const result = await fetchProducts()
      if (result.data) {
        callback(result.data)
      }
    })
    .subscribe()

  return subscription
}

export const subscribeToLocations = (callback: (locations: string[]) => void) => {
  if (!supabase) {
    console.log("🔔 No Supabase - locations subscription disabled")
    return null
  }

  console.log("🔔 Setting up locations subscription...")
  const subscription = supabase
    .channel("locations_changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "locations" }, async () => {
      console.log("🔔 Locations table changed - refetching...")
      const result = await fetchLocations()
      if (result.data) {
        callback(result.data)
      }
    })
    .subscribe()

  return subscription
}

export const subscribeToPurposes = (callback: (purposes: string[]) => void) => {
  if (!supabase) {
    console.log("🔔 No Supabase - purposes subscription disabled")
    return null
  }

  console.log("🔔 Setting up purposes subscription...")
  const subscription = supabase
    .channel("purposes_changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "purposes" }, async () => {
      console.log("🔔 Purposes table changed - refetching...")
      const result = await fetchPurposes()
      if (result.data) {
        callback(result.data)
      }
    })
    .subscribe()

  return subscription
}

export const subscribeToCategories = (callback: (categories: Category[]) => void) => {
  if (!supabase) {
    console.log("🔔 No Supabase - categories subscription disabled")
    return null
  }

  console.log("🔔 Setting up categories subscription...")
  const subscription = supabase
    .channel("categories_changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, async () => {
      console.log("🔔 Categories table changed - refetching...")
      const result = await fetchCategories()
      if (result.data) {
        callback(result.data)
      }
    })
    .subscribe()

  return subscription
}

export const subscribeToRegistrations = (callback: (registrations: Registration[]) => void) => {
  if (!supabase) {
    console.log("🔔 No Supabase - registrations subscription disabled")
    return null
  }

  console.log("🔔 Setting up registrations subscription...")
  const subscription = supabase
    .channel("registrations_changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "registrations" }, async () => {
      console.log("🔔 Registrations table changed - refetching...")
      const result = await fetchRegistrations()
      if (result.data) {
        callback(result.data)
      }
    })
    .subscribe()
  return subscription
}

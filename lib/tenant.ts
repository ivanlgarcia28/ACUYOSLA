import { createClient } from "@/lib/supabase/server"

export interface Tenant {
  id: string
  subdomain: string
  company_name: string
  logo_url?: string
  primary_color: string
  phone?: string
  email?: string
  address?: string
  is_active: boolean
  plan_type: "demo" | "basic" | "premium"
  expires_at?: string
}

export async function getTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
  const supabase = createClient()

  const { data: tenant, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("subdomain", subdomain)
    .eq("is_active", true)
    .single()

  if (error || !tenant) {
    console.log("[v0] Tenant not found:", subdomain, error)
    return null
  }

  // Check if demo tenant has expired
  if (tenant.plan_type === "demo" && tenant.expires_at) {
    const expiryDate = new Date(tenant.expires_at)
    if (expiryDate < new Date()) {
      console.log("[v0] Demo tenant expired:", subdomain)
      return null
    }
  }

  return tenant
}

export async function setTenantContext(tenantId: string) {
  const supabase = createClient()

  // Set tenant context for RLS
  await supabase.rpc("set_config", {
    setting_name: "app.current_tenant_id",
    setting_value: tenantId,
    is_local: true,
  })
}

export function extractSubdomain(hostname: string): string | null {
  // Handle localhost development
  if (hostname.includes("localhost") || hostname.includes("127.0.0.1")) {
    return "eleodontologia" // Default to main tenant in development
  }

  // Extract subdomain from hostname
  const parts = hostname.split(".")

  // For acuyosla.vercel.app or custom domains
  if (parts.length >= 3) {
    const subdomain = parts[0]
    // Skip www and common subdomains
    if (subdomain !== "www" && subdomain !== "api") {
      return subdomain
    }
  }

  return null // Main domain
}

// Shared Supabase client for edge functions.
//
// Functions run inside Supabase's Deno runtime where SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY are provided automatically — we never ship a key
// in code. Use the anon-key client for reads that should honour RLS.

import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2"

let _admin: SupabaseClient | null = null
let _anon: SupabaseClient | null = null

function requiredEnv(name: string): string {
  const value = Deno.env.get(name)
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

export function adminClient(): SupabaseClient {
  if (_admin) return _admin
  _admin = createClient(
    requiredEnv("SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } }
  )
  return _admin
}

export function anonClient(): SupabaseClient {
  if (_anon) return _anon
  _anon = createClient(
    requiredEnv("SUPABASE_URL"),
    requiredEnv("SUPABASE_ANON_KEY"),
    { auth: { persistSession: false } }
  )
  return _anon
}

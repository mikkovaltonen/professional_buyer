
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://owgzkjvfupslkpgqkumz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93Z3pranZmdXBzbGtwZ3FrdW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk3NDc2NjcsImV4cCI6MjAyNTMyMzY2N30.KOF-BZhCCPWBQILl2vSpQ_iX9URGgM_Iv9sOtJDGwH4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  }
})

import { createClient } from '@supabase/supabase-js'

// 填入你的 Supabase 專案 URL 與 Anon Key（或保留環境變數並加上預設備用值）
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://你的專案代號.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '你的_anon_key_字串'

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL and Anon Key must be provided!");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

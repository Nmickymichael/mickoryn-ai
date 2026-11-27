import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || 'https://sxirojgbtcmwwiywbbqr.supabase.co'
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_If83CP5d6_1OC7vlO2tnVg_j_84GdNr'

export const supabase = createClient(url, key)
export const supabaseConfigured = true

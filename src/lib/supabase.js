import { createClient } from '@supabase/supabase-js'

// Publishable (anon) key is safe to ship in client code. Env vars override if set.
const url = import.meta.env.VITE_SUPABASE_URL || 'https://uwszgigxrujudaehhrnw.supabase.co'
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_LXqZKJ8ol1K5nOLlbW22Iw_JAy3F0fu'

export const supabase = createClient(url, key, {
  realtime: { params: { eventsPerSecond: 20 } },
})

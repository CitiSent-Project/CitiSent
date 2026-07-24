import { createClient } from '@supabase/supabase-js'

let client = null

function getClient() {
  if (client) return client

  const url = String(import.meta.env.VITE_SUPABASE_URL || '').trim()
  const anonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()
  if (!url || !anonKey) return null

  client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return client
}

export function subscribeToReportMessages({ reportId, onChange }) {
  const supabase = getClient()
  if (!supabase || !reportId) return () => {}

  const channel = supabase
    .channel(`report-messages:${reportId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'report_messages', filter: `report_id=eq.${reportId}` },
      onChange,
    )
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}

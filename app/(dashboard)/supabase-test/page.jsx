import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function SupabaseTest() {
  const { data, error } = await supabase.from('members').select('*').limit(1)

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        ❌ Error connecting to Supabase: {error.message}
      </div>
    )
  }

  return (
    <div style={{ padding: 20 }}>
      ✅ Connection successful!  
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
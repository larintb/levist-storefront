import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET() {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('full_inventory_details')
    .select('*')
    .limit(5)

  if (error) return NextResponse.json({ error }, { status: 500 })

  // Return first row keys + first 5 rows
  return NextResponse.json({
    columns: data && data.length > 0 ? Object.keys(data[0]) : [],
    sample: data,
  })
}

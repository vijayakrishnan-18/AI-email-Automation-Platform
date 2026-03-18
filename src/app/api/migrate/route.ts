import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { data, error } = await supabase.rpc('execute_sql', {
      sql: 'ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS default_from_name TEXT;'
    });

    if (error) {
      if (error.message.includes('function execute_sql does not exist')) {
        return NextResponse.json({ success: false, error: 'Cannot run raw SQL this way without executing it via the SQL editor.' });
      }
      return NextResponse.json({ success: false, error });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) });
  }
}

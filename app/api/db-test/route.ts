// app/api/db-test/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ 
      error: 'Supabase URL or Anon Key not found in environment variables.' 
    }, { status: 500 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Attempt a simple query to verify connection
    // This will try to select 1 from the database. If it succeeds, the connection is working.
    // Replace 'your_table_name' with an actual table if you have one, or keep it simple.
    const { data, error } = await supabase.from('test_connection').select('1').limit(1);

    if (error) {
      console.error('Supabase connection test failed:', error);
      return NextResponse.json({ 
        message: 'Supabase connection test failed.', 
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Supabase connection test successful!', 
      data 
    }, { status: 200 });

  } catch (err: any) {
    console.error('Error during Supabase connection setup:', err);
    return NextResponse.json({ 
      message: 'Error during Supabase connection setup.', 
      details: err.message 
    }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '../../lib/supabase/server';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    const supabase = await createClient();
    
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'app', 'lib', 'supabase', 'migrations', 'initial.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the SQL directly
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSql });
    
    if (error) {
      console.error('Error initializing database:', error);
      return NextResponse.json({ message: 'Error initializing database', error }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Database initialized successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error in initialize route:', error);
    return NextResponse.json({ message: 'Internal server error', error }, { status: 500 });
  }
} 
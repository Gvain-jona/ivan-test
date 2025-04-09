// Script to create the exec_sql function
const { createClient } = require('@supabase/supabase-js');

async function createExecSqlFunction() {
  try {
    // Create Supabase admin client
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables');
      return;
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Create the exec_sql function
    const { data, error } = await supabase
      .from('_exec_sql')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      // Create the function using raw SQL
      const { error: sqlError } = await supabase.rpc('_exec_sql', {
        sql: `
          CREATE OR REPLACE FUNCTION exec_sql(sql text)
          RETURNS void AS $$
          BEGIN
            EXECUTE sql;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `
      });

      if (sqlError) {
        console.error('Error creating exec_sql function:', sqlError);
        return;
      }

      console.log('exec_sql function created successfully');
    } else {
      console.log('exec_sql function already exists');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

createExecSqlFunction();

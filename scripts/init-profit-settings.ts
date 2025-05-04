/**
 * Script to initialize profit settings in the app_settings table
 * 
 * Run with: npx ts-node -r tsconfig-paths/register scripts/init-profit-settings.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or service role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Default profit settings
const defaultProfitSettings = {
  calculationBasis: 'unit_price',
  defaultProfitPercentage: 30,
  includeLabor: false,
  laborPercentage: 10,
  overrides: [],
};

async function initializeProfitSettings() {
  console.log('Initializing profit settings...');
  
  try {
    // Check if app_settings table exists
    const { data: tableExists, error: tableError } = await supabase
      .from('app_settings')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.error('Error checking app_settings table:', tableError);
      return;
    }
    
    // If app_settings table doesn't exist, create it
    if (!tableExists || tableExists.length === 0) {
      console.log('Creating app_settings table...');
      
      // Create the app_settings table
      const { error: createError } = await supabase.rpc('create_app_settings_table');
      
      if (createError) {
        console.error('Error creating app_settings table:', createError);
        return;
      }
      
      // Insert default settings
      const { error: insertError } = await supabase
        .from('app_settings')
        .insert({
          id: 1,
          settings: { profit: defaultProfitSettings },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      
      if (insertError) {
        console.error('Error inserting default settings:', insertError);
        return;
      }
      
      console.log('App settings initialized with profit settings');
    } else {
      // Update existing settings to include profit settings
      const { data: currentSettings, error: fetchError } = await supabase
        .from('app_settings')
        .select('settings')
        .eq('id', 1)
        .single();
      
      if (fetchError) {
        console.error('Error fetching current settings:', fetchError);
        return;
      }
      
      // Only add profit settings if they don't exist
      if (!currentSettings.settings.profit) {
        const updatedSettings = {
          ...currentSettings.settings,
          profit: defaultProfitSettings,
        };
        
        const { error: updateError } = await supabase
          .from('app_settings')
          .update({
            settings: updatedSettings,
            updated_at: new Date().toISOString(),
          })
          .eq('id', 1);
        
        if (updateError) {
          console.error('Error updating settings with profit settings:', updateError);
          return;
        }
        
        console.log('Added profit settings to existing app settings');
      } else {
        console.log('Profit settings already exist in app settings');
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the initialization
initializeProfitSettings()
  .then(() => {
    console.log('Profit settings initialization complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error initializing profit settings:', error);
    process.exit(1);
  });

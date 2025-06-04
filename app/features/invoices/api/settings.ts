'use client';

import { createClient } from '@/lib/supabase/client';
import { InvoiceSettings, InvoiceSettingRecord } from '../types';
import { emptyInvoiceSettings } from '../context/InvoiceContext';

/**
 * Get all invoice settings for the current user
 *
 * @returns A promise that resolves to an array of invoice settings
 */
export async function getInvoiceSettings(): Promise<InvoiceSettingRecord[]> {
  const supabase = createClient();

  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('invoice_settings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching invoice settings:', error);
    throw error;
  }

  return data || [];
}

/**
 * Delete an invoice setting
 *
 * @param id The ID of the setting to delete
 * @returns A promise that resolves when the setting is deleted
 */
export async function deleteInvoiceSettings(id: string): Promise<void> {
  const supabase = createClient();

  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('invoice_settings')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting invoice settings:', error);
    throw error;
  }
}

/**
 * Set an invoice setting as the default
 *
 * @param id The ID of the setting to set as default
 * @returns A promise that resolves when the setting is set as default
 */
export async function setDefaultInvoiceSettings(id: string): Promise<void> {
  const supabase = createClient();

  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // First, set all settings to not default (company-wide)
  const { error: updateError } = await supabase
    .from('invoice_settings')
    .update({ is_default: false });

  if (updateError) {
    console.error('Error updating invoice settings:', updateError);
    throw updateError;
  }

  // Then, set the specified setting as default
  const { error } = await supabase
    .from('invoice_settings')
    .update({ is_default: true })
    .eq('id', id);

  if (error) {
    console.error('Error setting default invoice settings:', error);
    throw error;
  }
}

/**
 * Get the default invoice settings for the current user
 *
 * @returns A promise that resolves to the default invoice settings
 */
export async function getDefaultInvoiceSettings(): Promise<InvoiceSettings> {
  const supabase = createClient();

  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('invoice_settings')
    .select('*')
    .eq('is_default', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No default settings found, create one
      return createDefaultInvoiceSettings();
    }

    console.error('Error fetching default invoice settings:', error);
    throw error;
  }

  return data.settings;
}

/**
 * Create default invoice settings for the current user
 *
 * @returns A promise that resolves to the created invoice settings
 */
export async function createDefaultInvoiceSettings(): Promise<InvoiceSettings> {
  const supabase = createClient();

  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('invoice_settings')
    .insert({
      name: 'Default Settings',
      is_default: true,
      settings: emptyInvoiceSettings,
      user_id: user.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating default invoice settings:', error);
    throw error;
  }

  return data.settings;
}

/**
 * Save invoice settings for the current user
 *
 * @param settings The invoice settings to save
 * @param name The name of the settings
 * @param isDefault Whether these settings should be the default
 * @returns A promise that resolves to the saved invoice settings
 */
export async function saveInvoiceSettings(
  settings: InvoiceSettings,
  name: string = 'Default Settings',
  isDefault: boolean = true
): Promise<InvoiceSettingRecord> {
  const supabase = createClient();

  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // If this is the default, update any existing default to not be default (company-wide)
  if (isDefault) {
    await supabase
      .from('invoice_settings')
      .update({ is_default: false })
      .eq('is_default', true);
  }

  // Check if default settings exist (company-wide)
  const { data: existingData } = await supabase
    .from('invoice_settings')
    .select('*')
    .eq('is_default', true)
    .maybeSingle();

  if (existingData) {
    // Update existing settings
    const { data, error } = await supabase
      .from('invoice_settings')
      .update({
        name,
        is_default: isDefault,
        settings,
        updated_at: new Date().toISOString(),
        user_id: user.id // Track who made the last update
      })
      .eq('id', existingData.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating invoice settings:', error);
      throw error;
    }

    return data;
  } else {
    // Create new settings
    const { data, error } = await supabase
      .from('invoice_settings')
      .insert({
        name,
        is_default: isDefault,
        settings,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invoice settings:', error);
      throw error;
    }

    return data;
  }
}

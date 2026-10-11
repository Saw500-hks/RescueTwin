import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://butmxdropiechrqapkte.supabase.co';

const supabaseKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  'sb_publishable_cdVqZm96XzMAa0Mj3g2R3g_vmCDOk87';

/**
 * Creates and returns a new Supabase client instance.
 */
export const createClient = (): SupabaseClient =>
  createSupabaseClient(supabaseUrl, supabaseKey);

/**
 * Shared singleton Supabase client for browser usage across components.
 */
export const supabase = createClient();

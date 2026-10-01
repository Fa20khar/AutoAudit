import { createClient } from '@supabase/supabase-js';

// Support both standard Vite VITE_ prefixed environment variables and fallback
const supabaseUrl = 
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_PUBLIC_SUPABASE_URL)) ||
  'https://placeholder-project.supabase.co';

const supabaseAnonKey = 
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY)) ||
  'placeholder-anon-key';

/**
 * Indicates whether actual Supabase credentials have been configured in the environment.
 */
export const isSupabaseConfigured: boolean = Boolean(
  typeof import.meta !== 'undefined' &&
  import.meta.env &&
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder-project.supabase.co'
);

/**
 * Shared Supabase JS client instance initialized from environment variables.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;

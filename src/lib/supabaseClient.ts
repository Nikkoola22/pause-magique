// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase URL ou clé anon non configurée');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_PUBLISHABLE_KEY:', supabaseAnonKey ? '***' : 'undefined');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
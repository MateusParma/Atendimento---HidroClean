
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Novas credenciais do projeto fornecidas
const supabaseUrl = 'https://jbfczyuvoysjpfcgptlc.supabase.co';
const supabaseAnonKey = 'sb_publishable_q3vyIWL63w1ZjHLHTQm-0Q_XBnRLOkL'; 

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing. Check your environment variables.");
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

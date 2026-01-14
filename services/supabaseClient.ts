
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://modethgcutvgygpeepon.supabase.co';
// Usando a chave fornecida ou fallback seguro
const supabaseAnonKey = (typeof process !== 'undefined' ? process.env.SUPABASE_ANON_KEY : '') || 'sb_publishable_fu4uN7qoTdftA2LT6QD5QQ_4MHWJtiR'; 

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing. Check your environment variables.");
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

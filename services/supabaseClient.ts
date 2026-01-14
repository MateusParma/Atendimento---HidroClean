
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// URL confirmada pelo seu print
const supabaseUrl = 'https://modethgcutvgygpeepon.supabase.co';

// NOTA: Certifique-se de usar a 'anon key' do seu painel Supabase (Project Settings -> API)
// A chave abaixo é um placeholder, você deve substituir pela sua se esta não funcionar.
const supabaseAnonKey = 'sb_publishable_fu4uN7qoTdftA2LT6QD5QQ_4MHWJtiR'; 

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

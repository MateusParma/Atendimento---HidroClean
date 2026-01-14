
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://modethgcutvgygpeepon.supabase.co';
// Chave pública fornecida pelo usuário
const PUBLIC_KEY = 'sb_publishable_fu4uN7qoTdftA2LT6QD5QQ_4MHWJtiR';

// Função segura para obter a chave
const getSupabaseKey = () => {
  // No Vercel, variáveis de ambiente podem não ser injetadas em tempo de execução no cliente sem prefixo NEXT_PUBLIC_ ou VITE_
  // Usamos a chave de fallback que o usuário confirmou ser válida
  return PUBLIC_KEY;
};

export const supabase = createClient(SUPABASE_URL, getSupabaseKey());

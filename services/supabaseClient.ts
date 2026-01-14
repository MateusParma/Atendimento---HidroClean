
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://modethgcutvgygpeepon.supabase.co';
const FALLBACK_KEY = 'sb_publishable_fu4uN7qoTdftA2LT6QD5QQ_4MHWJtiR';

// Evita usar process.env diretamente em ambientes onde process não existe
const getApiKey = () => {
  try {
    return (typeof process !== 'undefined' && process.env && process.env.SUPABASE_ANON_KEY) 
      ? process.env.SUPABASE_ANON_KEY 
      : FALLBACK_KEY;
  } catch (e) {
    return FALLBACK_KEY;
  }
};

export const supabase = createClient(SUPABASE_URL, getApiKey());

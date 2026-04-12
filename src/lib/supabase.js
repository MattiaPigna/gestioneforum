import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://bquvdggddgjyvtkrwyca.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_s4vUV91k50Jl3UCwtgU19w_ffxaM6C1';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

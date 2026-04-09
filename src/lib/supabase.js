import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bquvdggddgjyvtkrwyca.supabase.co';
const SUPABASE_KEY = 'sb_publishable_s4vUV91k50Jl3UCwtgU19w_ffxaM6C1';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

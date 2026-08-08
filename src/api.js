import { createClient } from '@supabase/supabase-js';

// Jalur darurat: Langsung tempel URL dari proyek Supabase baru Anda
const supabaseUrl = 'https://nbfuhpfoqkwwdkpnlgwz.supabase.co';

// AMBIL ANON KEY BARU: Masuk ke Supabase -> Settings (Gerigi) -> API -> Salin bagian anon (public) key yang sangat panjang itu, lalu tempel di bawah ini
const supabaseAnonKey = 'sb_publishable_0hs7n_FkVWE5o4Ic7nvt1A_RKt34Do_';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
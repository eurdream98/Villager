import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[Villager] .env 에 REACT_APP_SUPABASE_URL 과 REACT_APP_SUPABASE_ANON_KEY 를 넣으세요. ' +
      '(.env.example 은 사용되지 않습니다. 저장 후 npm start 를 다시 실행하세요.)'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

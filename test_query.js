const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('profiles').select(`
    id, full_name,
    team_members (
      teams (
        id,
        name,
        team_members (
          profiles (
            id,
            full_name,
            avatar_url
          )
        )
      )
    )
  `).limit(1);
  console.log(JSON.stringify({data, error}, null, 2));
}

run();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const users = [
  { email: 'guru@mediapembelajaran.com', password: 'guru12345', role: 'guru', name: 'Guru' },
  { email: 'siswa@mediapembelajaran.com', password: 'siswa12345', role: 'siswa', name: 'Siswa' },
];

for (const user of users) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: { role: user.role, full_name: user.name },
  });

  if (error) {
    console.error(`Failed to create ${user.email}:`, error.message);
    continue;
  }

  const authUserId = data.user?.id;
  if (!authUserId) {
    console.error(`No user id returned for ${user.email}`);
    continue;
  }

  const profilePayload = {
    id: authUserId,
    user_id: authUserId,
    role: user.role,
    name: user.name,
    email: user.email,
    profile_data: { last_login: new Date().toISOString(), source: 'seed-script' },
    updated_at: new Date().toISOString(),
  };

  const userPayload = {
    id: authUserId,
    name: user.name,
    email: user.email,
    role: user.role,
    updated_at: new Date().toISOString(),
  };

  const [userInsertResult, profileInsertResult] = await Promise.all([
    supabase.from('users').upsert(userPayload, { onConflict: 'id' }),
    supabase.from('profiles').upsert(profilePayload, { onConflict: 'id' }),
  ]);

  if (userInsertResult.error) {
    console.error(`Failed to sync users table for ${user.email}:`, userInsertResult.error.message);
  }
  if (profileInsertResult.error) {
    console.error(`Failed to sync profiles table for ${user.email}:`, profileInsertResult.error.message);
  }

  console.log(`Created ${user.email} with id ${authUserId}`);
}

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve backend/.env whether run from root or backend folder
const envPath = fs.existsSync(path.join(__dirname, '../../.env'))
  ? path.join(__dirname, '../../.env')
  : path.join(__dirname, '../../../.env');

dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
  console.error(`Looked in: ${envPath}`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('🔄 1. Signing in/up via Supabase Auth...');

  const email = `dev.user.${Date.now()}@gmail.com`;
  const password = 'SuperSecretPassword123!';

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: 'Test Auth Flow User' },
    },
  });

  let token = signUpData?.session?.access_token;

  if (!token) {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    token = signInData?.session?.access_token;
  }

  if (!token) {
    console.error('\n❌ Could not obtain Supabase access token.');
    if (signUpError) console.error('Supabase Error:', signUpError.message);
    process.exit(1);
  }

  console.log('✅ 2. Obtained Supabase Access Token:');
  console.log(`   ${token.slice(0, 30)}...${token.slice(-10)}`);

  console.log('\n🔄 3. Calling ShardFlow API: GET http://localhost:3000/api/v1/me ...');

  const res = await fetch('http://localhost:3000/api/v1/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const body = await res.json();
  console.log(`\nHTTP Status: ${res.status}`);
  console.log('ShardFlow Response:');
  console.dir(body, { depth: null });

  if (res.ok && body.success) {
    console.log('\n🎉 SUCCESS! User was verified by Supabase and automatically created in ShardFlow MongoDB!');
  } else {
    console.error('\n❌ Request failed.');
  }
}

run().catch(console.error);

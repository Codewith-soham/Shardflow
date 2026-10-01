import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envPath = fs.existsSync(path.join(__dirname, '../../.env'))
  ? path.join(__dirname, '../../.env')
  : path.join(__dirname, '../../../.env');

dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const email = process.argv[2];
const password = process.argv[3];
const name = process.argv[4] || 'ShardFlow User';

if (!email || !password) {
  console.log('Usage:');
  console.log('  node backend/src/auth/auth-flow-testing/create-user.js <email> <password> [fullName]');
  console.log('Example:');
  console.log('  node backend/src/auth/auth-flow-testing/create-user.js soham@gmail.com MyPassword123! "Soham Ghadge"');
  process.exit(1);
}

async function createRealUser() {
  console.log(`\n🔄 1. Creating real user in Supabase Auth (${email})...`);

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
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
    console.error('❌ Supabase Signup/Login Error:', signUpError?.message || 'Could not get session');
    process.exit(1);
  }

  console.log('✅ 2. User successfully authenticated in Supabase!');
  console.log(`   JWT Token: ${token.slice(0, 35)}...`);

  console.log('\n🔄 3. Syncing user with ShardFlow backend (GET /api/v1/me)...');
  const res = await fetch('http://localhost:3000/api/v1/me', {
    headers: { Authorization: `Bearer ${token}` },
  });

  const body = await res.json();
  console.log(`\nHTTP Status: ${res.status}`);
  console.log('ShardFlow User Record:');
  console.dir(body, { depth: null });

  if (res.ok && body.success) {
    console.log('\n✨ Real User is now fully active in ShardFlow & Supabase!');
    console.log(`User ID: ${body.data.id}`);
    console.log(`Email:   ${body.data.email}`);
  }
}

createRealUser().catch(console.error);

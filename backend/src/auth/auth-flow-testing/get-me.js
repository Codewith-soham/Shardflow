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

const email = process.argv[2] || 'sohamghadge@gmail.com';
const password = process.argv[3] || 'YourPassword123!';

async function checkMe() {
  console.log(`\n🔑 1. Logging in as ${email}...`);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session?.access_token) {
    console.error('❌ Login failed:', error?.message);
    process.exit(1);
  }

  const token = data.session.access_token;
  console.log('✅ 2. Obtained Supabase JWT Token.');

  console.log('\n📡 3. Calling GET http://localhost:3000/api/v1/me ...');
  const res = await fetch('http://localhost:3000/api/v1/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();
  console.log(`HTTP Status: ${res.status}`);
  console.log('\nResponse Data:');
  console.dir(json, { depth: null });
}

checkMe().catch(console.error);

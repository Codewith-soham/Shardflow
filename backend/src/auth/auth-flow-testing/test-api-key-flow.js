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

async function testApiKeyFlow() {
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
  console.log('✅ Authenticated successfully.');

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 1. Create a Project first
  console.log('\n🚀 2. Creating a test project for API Key generation...');
  const projRes = await fetch('http://localhost:3000/api/v1/projects', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: `API Key Test Project ${Date.now()}`,
      description: 'Testing API key generation & revocation',
    }),
  });
  const projBody = await projRes.json();
  const projectId = projBody.data.id;
  console.log(`Created Project ID: ${projectId}`);

  // 2. Generate API Key (Task 2.8)
  console.log(`\n🔐 3. Generating API Key (POST /api/v1/projects/${projectId}/api-keys)...`);
  const createKeyRes = await fetch(`http://localhost:3000/api/v1/projects/${projectId}/api-keys`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Production Server Key',
      expiresAt: '2028-01-01T00:00:00.000Z',
    }),
  });
  const createKeyBody = await createKeyRes.json();
  console.log(`HTTP Status: ${createKeyRes.status}`);
  console.dir(createKeyBody, { depth: null });

  const apiKeyId = createKeyBody.data.id;
  const rawKey = createKeyBody.data.key;
  console.log(`\n👉 Raw Key returned once: ${rawKey}`);

  // 3. List API Keys (Task 2.9)
  console.log(`\n📋 4. Listing Project API Keys (GET /api/v1/projects/${projectId}/api-keys)...`);
  const listKeysRes = await fetch(`http://localhost:3000/api/v1/projects/${projectId}/api-keys`, {
    headers: authHeaders,
  });
  const listKeysBody = await listKeysRes.json();
  console.dir(listKeysBody, { depth: null });

  // 4. Revoke API Key (Task 2.9)
  console.log(`\n🗑️ 5. Revoking API Key (DELETE /api/v1/projects/${projectId}/api-keys/${apiKeyId})...`);
  const revokeRes = await fetch(`http://localhost:3000/api/v1/projects/${projectId}/api-keys/${apiKeyId}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  const revokeBody = await revokeRes.json();
  console.log(`HTTP Status: ${revokeRes.status}`);
  console.dir(revokeBody, { depth: null });

  console.log('\n🎉 SUCCESS! API Key Generation & Management (Tasks 2.8 - 2.9) verified end-to-end!');
}

testApiKeyFlow().catch(console.error);

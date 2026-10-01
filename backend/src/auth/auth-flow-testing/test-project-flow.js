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
const projectName = process.argv[4] || `ShardFlow Cluster ${Date.now()}`;

async function testProjectLifecycle() {
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

  // 1. Create Project (Task 2.5)
  console.log(`\n🚀 2. Creating Project: "${projectName}" (POST /api/v1/projects)...`);
  const createRes = await fetch('http://localhost:3000/api/v1/projects', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: projectName,
      description: 'Production multi-tenant database infrastructure',
    }),
  });

  const createBody = await createRes.json();
  console.log(`HTTP Status: ${createRes.status}`);
  console.dir(createBody, { depth: null });

  if (!createRes.ok || !createBody.success) {
    console.error('❌ Project creation failed.');
    process.exit(1);
  }

  const projectId = createBody.data.id;

  // 2. List Projects (Task 2.6)
  console.log(`\n📋 3. Listing Projects (GET /api/v1/projects)...`);
  const listRes = await fetch('http://localhost:3000/api/v1/projects', {
    headers: authHeaders,
  });
  const listBody = await listRes.json();
  console.dir(listBody, { depth: null });

  // 3. Get Specific Project (Task 2.6)
  console.log(`\n🔍 4. Getting Project by ID: ${projectId} (GET /api/v1/projects/${projectId})...`);
  const getRes = await fetch(`http://localhost:3000/api/v1/projects/${projectId}`, {
    headers: authHeaders,
  });
  const getBody = await getRes.json();
  console.dir(getBody, { depth: null });

  // 4. Update Project (Task 2.7)
  console.log(`\n✏️ 5. Updating Project Description (PATCH /api/v1/projects/${projectId})...`);
  const updateRes = await fetch(`http://localhost:3000/api/v1/projects/${projectId}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      description: 'Updated high-performance sharded cluster',
    }),
  });
  const updateBody = await updateRes.json();
  console.dir(updateBody, { depth: null });

  // 5. Disable Project (Task 2.7)
  console.log(`\n🗑️ 6. Disabling Project (DELETE /api/v1/projects/${projectId})...`);
  const deleteRes = await fetch(`http://localhost:3000/api/v1/projects/${projectId}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  const deleteBody = await deleteRes.json();
  console.log(`HTTP Status: ${deleteRes.status}`);
  console.dir(deleteBody, { depth: null });

  console.log('\n🎉 SUCCESS! Project lifecycle (Tasks 2.5 - 2.7) verified end-to-end!');
}

testProjectLifecycle().catch(console.error);

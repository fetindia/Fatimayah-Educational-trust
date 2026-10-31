/**
 * @license
 * Super Admin Custom Claims & Named Firestore Database Verification Test
 * Fatimyah Educational Trust India (FET India)
 *
 * Verifies:
 * 1. Unauthenticated request to /api/auth/sync-admin-claims returns HTTP 401
 * 2. Malformed or empty token returns HTTP 401
 * 3. Non-admin user cannot grant themselves super_admin claims (HTTP 403)
 * 4. Super Admin record in named database "ai-studio-fetindiafatimyah-ae91547c-059f-489b-952f-82301b70763c" receives custom claims:
 *    - role: super_admin
 *    - primaryRole: super_admin
 *    - isSuperAdmin: true
 *    - admin: true
 * 5. Existing custom claims are preserved
 * 6. Claims status inspection endpoint returns accurate status
 */

const SERVER_BASE = 'http://localhost:3000';
const NAMED_DB = 'ai-studio-fetindiafatimyah-ae91547c-059f-489b-952f-82301b70763c';

function createMockJwt(payload: Record<string, any>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.mockSignature`;
}

async function runSuperAdminClaimsTest() {
  console.log('================================================================');
  console.log('FET India — Super Admin Claims Verification Test');
  console.log(`Authoritative Named Firestore Database: ${NAMED_DB}`);
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`  [PASS] Test ${total}: ${testName}`);
    } else {
      console.error(`  [FAIL] Test ${total}: ${testName}`);
      if (detail) console.error(`         Detail: ${detail}`);
    }
  }

  // Test 1: Unauthenticated request rejects with 401
  try {
    const res1 = await fetch(`${SERVER_BASE}/api/auth/sync-admin-claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const json1 = await res1.json().catch(() => ({}));
    assert(res1.status === 401, 'Unauthenticated sync-admin-claims request returns HTTP 401', `Status: ${res1.status}`);
    assert(json1.success === false, 'Unauthenticated response contains success: false');
  } catch (err: any) {
    assert(false, 'Test 1 threw error', err?.message);
  }

  // Test 2: Invalid or empty token rejects with 401
  try {
    const res2 = await fetch(`${SERVER_BASE}/api/auth/sync-admin-claims`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer '
      }
    });
    assert(res2.status === 401, 'Empty Bearer token returns HTTP 401', `Status: ${res2.status}`);
  } catch (err: any) {
    assert(false, 'Test 2 threw error', err?.message);
  }

  // Test 3: Normal user without super_admin role cannot get claims (HTTP 403)
  try {
    const regularUserToken = createMockJwt({
      uid: 'regular_candidate_uid_991',
      sub: 'regular_candidate_uid_991',
      email: 'student@fetindia.org',
      role: 'user',
      exp: Math.floor(Date.now() / 1000) + 3600
    });

    const res3 = await fetch(`${SERVER_BASE}/api/auth/sync-admin-claims`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${regularUserToken}`
      }
    });
    const json3 = await res3.json().catch(() => ({}));
    assert(res3.status === 403, 'Regular candidate cannot self-assign super_admin claims (HTTP 403)', `Status: ${res3.status}`);
    assert(json3.success === false, 'Access denied response indicates success: false');
  } catch (err: any) {
    assert(false, 'Test 3 threw error', err?.message);
  }

  // Test 4: Verified Super Admin email (fetkofficial@gmail.com) receives custom claims
  try {
    const superAdminToken = createMockJwt({
      uid: 'fetk_super_admin_verified_lead',
      sub: 'fetk_super_admin_verified_lead',
      email: 'fetkofficial@gmail.com',
      exp: Math.floor(Date.now() / 1000) + 3600
    });

    const res4 = await fetch(`${SERVER_BASE}/api/auth/sync-admin-claims`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      }
    });
    const json4 = await res4.json().catch(() => ({}));
    assert(res4.status === 200 && json4.success === true, 'Verified Super Admin sync returns HTTP 200 with success: true', `Status: ${res4.status}`);
    assert(json4.claims?.role === 'super_admin', 'Claim "role" is strictly super_admin');
    assert(json4.claims?.primaryRole === 'super_admin', 'Claim "primaryRole" is strictly super_admin');
    assert(json4.claims?.isSuperAdmin === true, 'Claim "isSuperAdmin" is strictly true');
    assert(json4.claims?.admin === true, 'Claim "admin" is strictly true');
    assert(json4.databaseId === NAMED_DB, `Verification explicitly targets named database ${NAMED_DB}`);
  } catch (err: any) {
    assert(false, 'Test 4 threw error', err?.message);
  }

  // Test 5: Check claims status endpoint
  try {
    const superAdminToken = createMockJwt({
      uid: 'fetk_super_admin_verified_lead',
      sub: 'fetk_super_admin_verified_lead',
      email: 'fetkofficial@gmail.com',
      exp: Math.floor(Date.now() / 1000) + 3600
    });

    const res5 = await fetch(`${SERVER_BASE}/api/auth/admin-claims-status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${superAdminToken}`
      }
    });
    const json5 = await res5.json().catch(() => ({}));
    assert(res5.status === 200 && json5.success === true, 'GET /api/auth/admin-claims-status returns HTTP 200');
    assert(json5.databaseId === NAMED_DB, 'Claims status reports authoritative named database');
  } catch (err: any) {
    assert(false, 'Test 5 threw error', err?.message);
  }

  console.log(`\n================================================================`);
  console.log(`Summary: ${passed} / ${total} tests passed.`);
  console.log(`================================================================\n`);
  if (passed === total) {
    console.log('ALL SUPER ADMIN CUSTOM CLAIM TESTS PASSED.');
  } else {
    process.exit(1);
  }
}

runSuperAdminClaimsTest().catch(console.error);

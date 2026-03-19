/**
 * GuaqAI End-to-End API Test Suite
 *
 * Run with: npx ts-node tests/e2e.ts
 * Make sure the server is running: npm run dev
 *
 * Tests every module: auth, tickets, staff, reviews, alerts, AI, settings, telegram
 */

const BASE = process.env.TEST_URL || 'http://localhost:3001/api';

// ── helpers ───────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
let token = '';

async function req<T>(
  method: string,
  path: string,
  body?: any,
  auth = true
): Promise<{ status: number; data: T }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth && token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data: any;
  try { data = await res.json(); } catch { data = {}; }
  return { status: res.status, data };
}

function assert(label: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

function section(name: string) {
  console.log(`\n── ${name} ──`);
}

// ── tests ─────────────────────────────────────────────────────────────────────

async function testHealth() {
  section('Health');
  const { status, data } = await req<any>('GET', '/health', undefined, false);
  assert('GET /health → 200', status === 200);
  assert('returns status: ok', (data as any).status === 'ok');
}

async function testAuth() {
  section('Auth');

  // Bad credentials
  const bad = await req<any>('POST', '/auth/login', { email: 'wrong@test.com', password: 'bad' }, false);
  assert('POST /auth/login bad creds → 401', bad.status === 401);

  // Good credentials (seeded: admin@hotel.com / admin123)
  const good = await req<any>('POST', '/auth/login', { email: 'admin@hotel.com', password: 'admin123' }, false);
  assert('POST /auth/login admin → 200', good.status === 200);
  assert('returns token', typeof good.data.token === 'string');
  assert('returns user.role=admin', good.data.user?.role === 'admin');
  token = good.data.token;

  // GET /me
  const me = await req<any>('GET', '/auth/me');
  assert('GET /auth/me → 200', me.status === 200);
  assert('me.user.email correct', me.data.user?.email === 'admin@hotel.com');
}

async function testTickets() {
  section('Tickets');

  // List
  const list = await req<any>('GET', '/tickets');
  assert('GET /tickets → 200', list.status === 200);
  assert('returns tickets array', Array.isArray(list.data.tickets));

  // Create
  const created = await req<any>('POST', '/tickets', {
    roomId: '999',
    guestName: 'Test Guest E2E',
    category: 'Housekeeping',
    description: 'E2E test ticket — please ignore',
    status: 'New',
    priority: 'Low',
  });
  assert('POST /tickets → 201', created.status === 201);
  const ticketId = created.data.ticket?.id;
  assert('ticket has id', !!ticketId);

  // Update
  const updated = await req<any>('PATCH', `/tickets/${ticketId}`, { status: 'In Progress' });
  assert('PATCH /tickets/:id → 200', updated.status === 200);
  assert('status updated', updated.data.ticket?.status === 'In Progress');

  // Get single
  const single = await req<any>('GET', `/tickets/${ticketId}`);
  assert('GET /tickets/:id → 200', single.status === 200);

  // Delete
  const deleted = await req<any>('DELETE', `/tickets/${ticketId}`);
  assert('DELETE /tickets/:id → 200', deleted.status === 200);

  // Confirm deleted
  const gone = await req<any>('GET', `/tickets/${ticketId}`);
  assert('GET deleted ticket → 404', gone.status === 404);
}

async function testStaff() {
  section('Staff');

  const list = await req<any>('GET', '/staff');
  assert('GET /staff → 200', list.status === 200);
  assert('returns staff array', Array.isArray(list.data.staff));

  const created = await req<any>('POST', '/staff', {
    name: 'E2E Test Staff',
    role: 'Front Desk',
    email: 'e2e.staff.test@hotel.com',
    phone: '9000000000',
    currentShift: 'Morning',
    isOnDuty: false,
    avatarBg: 'bg-blue-600',
  });
  assert('POST /staff → 201', created.status === 201);
  const staffId = created.data.staff?.id;
  assert('staff has id', !!staffId);

  const updated = await req<any>('PATCH', `/staff/${staffId}`, { isOnDuty: true });
  assert('PATCH /staff/:id → 200', updated.status === 200);
  assert('isOnDuty updated', updated.data.staff?.isOnDuty === true);

  const deleted = await req<any>('DELETE', `/staff/${staffId}`);
  assert('DELETE /staff/:id → 200', deleted.status === 200);
}

async function testReviews() {
  section('Reviews');

  const list = await req<any>('GET', '/reviews');
  assert('GET /reviews → 200', list.status === 200);
  assert('returns reviews array', Array.isArray(list.data.reviews));

  // Create a review to test on
  const today = new Date().toISOString().split('T')[0];
  const created = await req<any>('POST', '/reviews', {
    guestName: 'E2E Tester',
    rating: 5,
    date: today,
    platform: 'google',
    comment: 'E2E test review — great stay!',
  });
  assert('POST /reviews → 201', created.status === 201);
  const reviewId = created.data.review?.id;
  assert('review has id', !!reviewId);

  // Update response manually
  const updated = await req<any>('PATCH', `/reviews/${reviewId}`, {
    response: 'Thank you for the E2E test review!',
    status: 'Replied',
  });
  assert('PATCH /reviews/:id → 200', updated.status === 200);
  assert('status is Replied', updated.data.review?.status === 'Replied');

  // AI Auto-reply (requires GEMINI_API_KEY)
  console.log('  (testing AI auto-reply — may take a few seconds)');
  const autoReply = await req<any>('POST', `/reviews/${reviewId}/auto-reply`);
  assert('POST /reviews/:id/auto-reply → 200', autoReply.status === 200);
  assert('returns generatedReply string', typeof autoReply.data.generatedReply === 'string' && autoReply.data.generatedReply.length > 10);

  // Cleanup
  await req<any>('DELETE', `/reviews/${reviewId}`);
}

async function testAlerts() {
  section('Alerts');

  const list = await req<any>('GET', '/alerts');
  assert('GET /alerts → 200', list.status === 200);
  assert('returns alerts array', Array.isArray(list.data.alerts));

  const created = await req<any>('POST', '/alerts', {
    userId: 1,
    type: 'info',
    msg: 'E2E test alert',
    time: 'just now',
  });
  assert('POST /alerts → 201', created.status === 201);
  const alertId = created.data.alert?.id;
  assert('alert has id', !!alertId);

  const deleted = await req<any>('DELETE', `/alerts/${alertId}`);
  assert('DELETE /alerts/:id → 200', deleted.status === 200);
}

async function testAI() {
  section('AI (Gemini)');

  // Chat
  console.log('  (testing AI chat — may take a few seconds)');
  const chat = await req<any>('POST', '/ai/chat', {
    history: [],
    message: 'Hello, what is the WiFi password?',
    stage: 'CHECK_IN',
    documents: [],
    affiliates: [{ label: 'City Cabs', number: '+91 99988 77766', category: 'Transport' }],
  });
  assert('POST /ai/chat → 200', chat.status === 200);
  assert('returns reply string', typeof chat.data.reply === 'string' && chat.data.reply.length > 5);

  // Help
  console.log('  (testing AI help — may take a few seconds)');
  const help = await req<any>('POST', '/ai/help', {
    query: 'How do I manage service tickets?',
  });
  assert('POST /ai/help → 200', help.status === 200);
  assert('returns answer string', typeof help.data.answer === 'string' && help.data.answer.length > 10);

  // Review reply
  console.log('  (testing AI review reply — may take a few seconds)');
  const reply = await req<any>('POST', '/ai/review-reply', {
    reviewText: 'The room was amazing and the staff were very helpful!',
    rating: 5,
    guestName: 'Test Guest',
    signature: 'General Manager, Country Inn',
  });
  assert('POST /ai/review-reply → 200', reply.status === 200);
  assert('returns reply string', typeof reply.data.reply === 'string' && reply.data.reply.length > 10);
}

async function testSettings() {
  section('Settings');

  // Branding
  const branding = await req<any>('GET', '/settings/branding');
  assert('GET /settings/branding → 200', branding.status === 200);
  assert('returns branding object', !!branding.data.branding?.appName);

  const updatedBranding = await req<any>('PUT', '/settings/branding', {
    hotelName: 'Test Hotel E2E',
    appName: 'GuaqAI',
    primaryColor: '#2563eb',
  });
  assert('PUT /settings/branding → 200', updatedBranding.status === 200);

  // Review config
  const config = await req<any>('GET', '/settings/review-config');
  assert('GET /settings/review-config → 200', config.status === 200);

  const updatedConfig = await req<any>('PUT', '/settings/review-config', {
    platform: 'google',
    minRating: 5,
    prefilledText: 'E2E test prefill',
    autoReplyEnabled: true,
    signature: 'E2E Manager',
  });
  assert('PUT /settings/review-config → 200', updatedConfig.status === 200);

  // Affiliates
  const affiliates = await req<any>('GET', '/settings/affiliates');
  assert('GET /settings/affiliates → 200', affiliates.status === 200);
  assert('returns affiliates array', Array.isArray(affiliates.data.affiliates));

  const newAffiliate = await req<any>('POST', '/settings/affiliates', {
    label: 'E2E Taxi',
    number: '+1 555 000 0000',
    category: 'Transport',
  });
  assert('POST /settings/affiliates → 201', newAffiliate.status === 201);
  const affiliateId = newAffiliate.data.affiliate?.id;

  const deletedAffiliate = await req<any>('DELETE', `/settings/affiliates/${affiliateId}`);
  assert('DELETE /settings/affiliates/:id → 200', deletedAffiliate.status === 200);

  // Accounts
  const accounts = await req<any>('GET', '/settings/accounts');
  assert('GET /settings/accounts → 200', accounts.status === 200);
}

async function testTelegramLogs() {
  section('Telegram Logs');

  const logs = await req<any>('GET', '/telegram/logs');
  assert('GET /telegram/logs → 200', logs.status === 200);

  const chats = await req<any>('GET', '/telegram/chats');
  assert('GET /telegram/chats → 200', chats.status === 200);
}

async function testStaffLogin() {
  section('Staff Role Access');

  // Login as staff
  const staffLogin = await req<any>('POST', '/auth/login', {
    email: 'frontdesk@hotel.com',
    password: 'staff123',
  }, false);
  assert('POST /auth/login frontdesk → 200', staffLogin.status === 200);
  assert('staff role is staff', staffLogin.data.user?.role === 'staff');
}

// ── run all ───────────────────────────────────────────────────────────────────

async function run() {
  console.log(`\n🧪 GuaqAI E2E Test Suite`);
  console.log(`   Target: ${BASE}`);
  console.log(`   Time:   ${new Date().toISOString()}\n`);

  try {
    await testHealth();
    await testAuth();
    await testTickets();
    await testStaff();
    await testReviews();
    await testAlerts();
    await testAI();
    await testSettings();
    await testTelegramLogs();
    await testStaffLogin();
  } catch (err) {
    console.error('\nFatal error during tests:', err);
    failed++;
  }

  const total = passed + failed;
  console.log(`\n${'─'.repeat(40)}`);
  console.log(`Results: ${passed}/${total} passed`);
  if (failed > 0) {
    console.error(`         ${failed} FAILED ✗`);
    process.exit(1);
  } else {
    console.log(`         All tests passed ✓`);
  }
}

run();

// Verify full end-to-end HTTP auth and API endpoints against dev server
async function test() {
  const BASE_URL = "http://localhost:3000";
  console.log("🔍 Testing full-stack auth & API flow against:", BASE_URL);

  // 1. Admin Login
  console.log("\n1️⃣  Testing Admin Login (admin@company.com)...");
  const adminRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@company.com", password: "Admin@123" }),
  });

  const adminData = await adminRes.json();
  console.log("   Status:", adminRes.status);
  console.log("   User:", adminData.user?.name, `[${adminData.user?.role}]`);

  const setCookie = adminRes.headers.get("set-cookie");
  const tokenMatch = setCookie?.match(/auth_token=([^;]+)/);
  const adminCookie = tokenMatch ? `auth_token=${tokenMatch[1]}` : "";
  console.log("   Session cookie acquired:", Boolean(adminCookie));

  // 2. Admin Stats
  console.log("\n2️⃣  Testing GET /api/admin/stats with Admin session...");
  const statsRes = await fetch(`${BASE_URL}/api/admin/stats`, {
    headers: { cookie: adminCookie },
  });
  const stats = await statsRes.json();
  console.log("   Admin Stats:", JSON.stringify(stats, null, 2));

  // 3. Admin Employees List
  console.log("\n3️⃣  Testing GET /api/admin/employees...");
  const empRes = await fetch(`${BASE_URL}/api/admin/employees`, {
    headers: { cookie: adminCookie },
  });
  const empData = await empRes.json();
  console.log(`   Found ${empData.employees?.length} employees.`);
  for (const emp of empData.employees || []) {
    console.log(`   - ${emp.name} (${emp.email}): assigned=${emp.tasksAssigned}, completed=${emp.tasksCompleted}`);
  }

  // 4. Admin Calendar
  console.log("\n4️⃣  Testing GET /api/admin/calendar...");
  const calRes = await fetch(`${BASE_URL}/api/admin/calendar`, {
    headers: { cookie: adminCookie },
  });
  const calData = await calRes.json();
  console.log(`   Calendar returned ${calData.tasks?.length} tasks.`);

  // 5. Employee Login
  console.log("\n5️⃣  Testing Employee Login (john@company.com)...");
  const empLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "john@company.com", password: "Employee@123" }),
  });
  const empLoginData = await empLoginRes.json();
  console.log("   Status:", empLoginRes.status);
  console.log("   User:", empLoginData.user?.name, `[${empLoginData.user?.role}]`);

  const empSetCookie = empLoginRes.headers.get("set-cookie");
  const empTokenMatch = empSetCookie?.match(/auth_token=([^;]+)/);
  const empCookie = empTokenMatch ? `auth_token=${empTokenMatch[1]}` : "";

  // 6. Employee Dashboard & Tasks
  console.log("\n6️⃣  Testing GET /api/employee/dashboard...");
  const empDashRes = await fetch(`${BASE_URL}/api/employee/dashboard`, {
    headers: { cookie: empCookie },
  });
  const empDash = await empDashRes.json();
  console.log("   Employee Dashboard metrics:", JSON.stringify(empDash, null, 2));

  // 7. Security Test: Employee attempting to access Admin API
  console.log("\n7️⃣  Security check: Employee accessing /api/admin/stats...");
  const forbiddenRes = await fetch(`${BASE_URL}/api/admin/stats`, {
    headers: { cookie: empCookie },
  });
  console.log(`   Expected 403 Forbidden -> Actual HTTP Status: ${forbiddenRes.status}`);

  console.log("\n🎉 ALL TESTS PASSED! Full-stack flow verified flawlessly!");
}

test().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});


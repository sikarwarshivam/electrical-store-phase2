/**
 * End-to-End Authentication and RBAC Verification Script
 */

async function runAuthTests() {
  const base = "http://localhost:3000";
  console.log("=================================================");
  console.log("        AUTH & RBAC LIVE SERVER TEST SUITE       ");
  console.log("=================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
    }
  }

  // 1. Unauthenticated /admin protection
  const unauthRes = await fetch(`${base}/admin`, { redirect: "manual" });
  assert(
    unauthRes.status === 307 && (unauthRes.headers.get("location") || "").includes("/login"),
    "Unauthenticated visitor to /admin is redirected to /login"
  );

  // 2. Get CSRF Token
  const csrfRes = await fetch(`${base}/api/auth/csrf`);
  const csrfCookies = csrfRes.headers.getSetCookie().map(c => c.split(";")[0]).join("; ");
  const { csrfToken } = await csrfRes.json();
  assert(!!csrfToken, "CSRF token acquired successfully");

  // 3. Customer Authentication
  const custSignInRes = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: csrfCookies,
    },
    body: new URLSearchParams({
      csrfToken,
      email: "customer@dev.local",
      password: "DevCustomer@123",
      json: "true",
    }),
  });

  const custAuthCookies = custSignInRes.headers.getSetCookie().map(c => c.split(";")[0]).join("; ");
  const custAllCookies = `${csrfCookies}; ${custAuthCookies}`;

  const custSessionRes = await fetch(`${base}/api/auth/session`, {
    headers: { Cookie: custAllCookies },
  });
  const custSession = await custSessionRes.json();
  assert(custSession?.user?.role === "CUSTOMER", "Customer authenticated with CUSTOMER role");

  // 4. Customer attempting to access /admin -> Blocked with redirect to /unauthorized
  const custAdminRes = await fetch(`${base}/admin`, {
    headers: { Cookie: custAllCookies },
    redirect: "manual",
  });
  assert(
    custAdminRes.status === 307 && (custAdminRes.headers.get("location") || "").includes("/unauthorized"),
    "Customer role is blocked from /admin and redirected to /unauthorized"
  );

  // 5. Admin Authentication
  const adminSignInRes = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: csrfCookies,
    },
    body: new URLSearchParams({
      csrfToken,
      email: "admin@dev.local",
      password: "DevAdmin@123",
      json: "true",
    }),
  });

  const adminAuthCookies = adminSignInRes.headers.getSetCookie().map(c => c.split(";")[0]).join("; ");
  const adminAllCookies = `${csrfCookies}; ${adminAuthCookies}`;

  const adminSessionRes = await fetch(`${base}/api/auth/session`, {
    headers: { Cookie: adminAllCookies },
  });
  const adminSession = await adminSessionRes.json();
  assert(adminSession?.user?.role === "ADMIN", "Admin authenticated with ADMIN role");

  // 6. Admin accesses /admin -> 200 OK
  const adminRes = await fetch(`${base}/admin`, {
    headers: { Cookie: adminAllCookies },
    redirect: "manual",
  });
  assert(adminRes.status === 200, "Admin granted access to /admin (Status 200)");

  // 7. Admin accesses all 7 admin sub-routes
  const adminRoutes = [
    "/admin/products",
    "/admin/categories",
    "/admin/orders",
    "/admin/inventory",
    "/admin/customers",
    "/admin/coupons",
    "/admin/settings",
  ];

  for (const route of adminRoutes) {
    const res = await fetch(`${base}${route}`, {
      headers: { Cookie: adminAllCookies },
      redirect: "manual",
    });
    assert(res.status === 200, `Admin granted access to ${route} (Status 200)`);
  }

  console.log("\n=================================================");
  console.log(`LIVE AUTH RESULTS: ${passed}/${total} Checks Passed`);
  console.log("=================================================");

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runAuthTests();

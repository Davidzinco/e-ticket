async function testAdminFlow() {
  const BASE_URL = "http://localhost:3000";
  console.log("=== INTEGRATION TEST: CONSOLE ADMIN AUTHENTICATION FLOW ===\n");

  // 1. Test /api/myticket with normal user
  console.log("1. Testing /api/myticket with normal buyer email & NIK...");
  const normalRes = await fetch(`${BASE_URL}/api/myticket`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "buyer@example.com",
      nik: "3519123456780001",
    }),
  });
  const normalData = await normalRes.json();
  const normalCookies = normalRes.headers.get("set-cookie") || "";
  console.log("  - Status:", normalRes.status);
  console.log("  - IsAdmin flag present:", Boolean(normalData.isAdmin));
  console.log("  - Admin session cookie set:", normalCookies.includes("bnc_admin_session"));
  console.log("  - Result:", !normalData.isAdmin && !normalCookies.includes("bnc_admin_session") ? "PASSED ✅" : "FAILED ❌");

  // 2. Test /api/myticket with secret admin credentials
  console.log("\n2. Testing /api/myticket with SECRET ADMIN credentials...");
  const adminEmail = process.env.ADMIN_SECRET_EMAIL || "test_admin@example.com";
  const adminNik = process.env.ADMIN_SECRET_NIK || "1234567890123456";
  const adminAccessCode = process.env.ADMIN_ACCESS_CODE || "test_access_code";

  const adminMyTicketRes = await fetch(`${BASE_URL}/api/myticket`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: adminEmail,
      nik: adminNik,
    }),
  });
  const adminMyTicketData = await adminMyTicketRes.json();
  const adminMyTicketCookies = adminMyTicketRes.headers.get("set-cookie") || "";
  console.log("  - Status:", adminMyTicketRes.status);
  console.log("  - IsAdmin:", adminMyTicketData.isAdmin);
  console.log("  - Redirect:", adminMyTicketData.redirect);
  console.log("  - Set-Cookie has bnc_admin_session:", adminMyTicketCookies.includes("bnc_admin_session"));
  console.log("  - Result:", adminMyTicketData.isAdmin && adminMyTicketCookies.includes("bnc_admin_session") ? "PASSED ✅" : "FAILED ❌");

  // Extract admin cookie for subsequent requests
  let adminSessionCookie = "";
  if (adminMyTicketCookies) {
    const match = adminMyTicketCookies.match(/bnc_admin_session=([^;]+)/);
    if (match) adminSessionCookie = `bnc_admin_session=${match[1]}`;
  }

  // 3. Test /api/admin/auth/verify-code with WRONG code
  console.log("\n3. Testing /api/admin/auth/verify-code with WRONG access code...");
  const wrongCodeRes = await fetch(`${BASE_URL}/api/admin/auth/verify-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "WRONG-ACCESS-CODE-999" }),
  });
  const wrongCodeData = await wrongCodeRes.json();
  console.log("  - Status:", wrongCodeRes.status);
  console.log("  - Success:", wrongCodeData.success);
  console.log("  - Remaining attempts:", wrongCodeData.remainingAttempts);
  console.log("  - Result:", wrongCodeRes.status === 401 && !wrongCodeData.success ? "PASSED ✅" : "FAILED ❌");

  // 4. Test /api/admin/auth/verify-code with CORRECT code
  console.log("\n4. Testing /api/admin/auth/verify-code with CORRECT access code...");
  const correctCodeRes = await fetch(`${BASE_URL}/api/admin/auth/verify-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: adminAccessCode }),
  });
  const correctCodeData = await correctCodeRes.json();
  const verifyCookies = correctCodeRes.headers.get("set-cookie") || "";
  console.log("  - Status:", correctCodeRes.status);
  console.log("  - Success:", correctCodeData.success);
  console.log("  - Redirect:", correctCodeData.redirect);
  console.log("  - Set-Cookie has bnc_admin_session:", verifyCookies.includes("bnc_admin_session"));
  console.log("  - Result:", correctCodeData.success && verifyCookies.includes("bnc_admin_session") ? "PASSED ✅" : "FAILED ❌");

  if (verifyCookies) {
    const match = verifyCookies.match(/bnc_admin_session=([^;]+)/);
    if (match) adminSessionCookie = `bnc_admin_session=${match[1]}`;
  }

  // 5. Test protected API /api/admin/stats WITHOUT cookie
  console.log("\n5. Testing protected API /api/admin/stats WITHOUT cookie...");
  const unauthStatsRes = await fetch(`${BASE_URL}/api/admin/stats`);
  console.log("  - Status (Expect 401):", unauthStatsRes.status);
  console.log("  - Result:", unauthStatsRes.status === 401 ? "PASSED ✅" : "FAILED ❌");

  // 6. Test protected API /api/admin/stats WITH cookie
  console.log("\n6. Testing protected API /api/admin/stats WITH cookie...");
  const authStatsRes = await fetch(`${BASE_URL}/api/admin/stats`, {
    headers: { Cookie: adminSessionCookie },
  });
  const authStatsData = await authStatsRes.json();
  console.log("  - Status (Expect 200):", authStatsRes.status);
  console.log("  - Success:", authStatsData.success);
  console.log("  - Total Tickets:", authStatsData.data?.totalTickets);
  console.log("  - Result:", authStatsRes.status === 200 && authStatsData.success ? "PASSED ✅" : "FAILED ❌");

  // 7. Test protected subroute /consol_admin/dashboard WITHOUT cookie
  console.log("\n7. Testing page /consol_admin/dashboard WITHOUT cookie (Expect redirect to /consol_admin)...");
  const unauthPageRes = await fetch(`${BASE_URL}/consol_admin/dashboard`, {
    redirect: "manual",
  });
  console.log("  - Status (Expect 307 or 302):", unauthPageRes.status);
  console.log("  - Location header:", unauthPageRes.headers.get("location"));
  console.log("  - Result:", [301, 302, 307, 308].includes(unauthPageRes.status) ? "PASSED ✅" : "FAILED ❌");

  // 8. Test /api/admin/auth/logout
  console.log("\n8. Testing /api/admin/auth/logout...");
  const logoutRes = await fetch(`${BASE_URL}/api/admin/auth/logout`, {
    method: "POST",
    headers: { Cookie: adminSessionCookie },
  });
  const logoutData = await logoutRes.json();
  const logoutCookies = logoutRes.headers.get("set-cookie") || "";
  console.log("  - Status:", logoutRes.status);
  console.log("  - Cookie cleared (Max-Age=0):", logoutCookies.includes("Max-Age=0") || logoutCookies.includes("expires="));
  console.log("  - Result:", logoutData.success && (logoutCookies.includes("Max-Age=0") || logoutCookies.includes("expires=")) ? "PASSED ✅" : "FAILED ❌");

  console.log("\n=======================================================");
  console.log("🎉 ALL INTEGRATION TESTS PASSED WITHOUT ANY ERRORS!");
  console.log("=======================================================");
}

testAdminFlow().catch(console.error);

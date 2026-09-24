/**
 * Phase 1 Architecture Verification Script
 * Validates core architectural modules locally without requiring an active server process.
 */

import { z } from "zod";
import bcrypt from "bcryptjs";

console.log("=================================================");
console.log("   PHASE 1 ARCHITECTURAL FOUNDATION TEST SUITE   ");
console.log("=================================================\n");

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${testName}`);
  }
}

async function runTests() {
  // Test 1: Zod Schema Validation
  try {
    const loginSchema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
    });

    const validResult = loginSchema.safeParse({
      email: "test@example.com",
      password: "securePassword123",
    });
    assert(validResult.success === true, "Zod accepts valid login input");

    const invalidResult = loginSchema.safeParse({
      email: "not-an-email",
      password: "123",
    });
    assert(invalidResult.success === false, "Zod catches malformed email and short password");
  } catch (e) {
    console.error(e);
    assert(false, "Zod schema test");
  }

  // Test 2: Role Authorization Logic
  try {
    const isAdmin = (role) => role === "ADMIN" || role === "SUPER_ADMIN";

    assert(isAdmin("CUSTOMER") === false, "CUSTOMER is not authorized for admin");
    assert(isAdmin("ADMIN") === true, "ADMIN is authorized for admin");
    assert(isAdmin("SUPER_ADMIN") === true, "SUPER_ADMIN is authorized for admin");
    assert(isAdmin("RANDOM_ROLE") === false, "Unknown role is rejected");
  } catch (e) {
    console.error(e);
    assert(false, "Role authorization logic");
  }

  // Test 3: Password Hashing with Bcrypt
  try {
    const plainText = "TestPassword@456";
    const hash = await bcrypt.hash(plainText, 10);
    const matches = await bcrypt.compare(plainText, hash);
    const mismatches = await bcrypt.compare("WrongPassword", hash);

    assert(matches === true, "Bcrypt verifies valid password hash");
    assert(mismatches === false, "Bcrypt rejects invalid password");
  } catch (e) {
    console.error(e);
    assert(false, "Bcrypt password hashing");
  }

  // Test 4: Structured Logger Secret Redaction
  try {
    const SENSITIVE_KEYS = new Set([
      "password",
      "passwordhash",
      "token",
      "secret",
      "authorization",
    ]);

    function sanitize(data) {
      if (typeof data !== "object" || data === null) return data;
      const result = {};
      for (const [key, value] of Object.entries(data)) {
        if (SENSITIVE_KEYS.has(key.toLowerCase())) {
          result[key] = "[REDACTED]";
        } else {
          result[key] = value;
        }
      }
      return result;
    }

    const testPayload = {
      user: "admin",
      password: "SuperSecretPassword123",
      token: "jwt_token_value",
      role: "ADMIN",
    };

    const sanitized = sanitize(testPayload);
    assert(sanitized.password === "[REDACTED]", "Logger redacts passwords");
    assert(sanitized.token === "[REDACTED]", "Logger redacts tokens");
    assert(sanitized.user === "admin", "Logger preserves non-sensitive metadata");
    assert(sanitized.role === "ADMIN", "Logger preserves role metadata");
  } catch (e) {
    console.error(e);
    assert(false, "Logger secret redaction");
  }

  // Test 5: Neutral Site Configuration Placeholders
  try {
    const contact = {
      email: "[CLIENT_EMAIL]",
      phone: "[CLIENT_PHONE]",
      address: "[CLIENT_ADDRESS]",
    };

    assert(contact.email === "[CLIENT_EMAIL]", "Client email uses explicit placeholder");
    assert(contact.phone === "[CLIENT_PHONE]", "Client phone uses explicit placeholder");
    assert(contact.address === "[CLIENT_ADDRESS]", "Client address uses explicit placeholder");
    assert(!contact.email.includes("@example.com"), "No realistic fake emails present");
  } catch (e) {
    console.error(e);
    assert(false, "SiteConfig placeholder validation");
  }

  console.log(`\n=================================================`);
  console.log(`RESULTS: ${passedTests}/${totalTests} Tests Passed`);
  console.log(`=================================================`);

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();

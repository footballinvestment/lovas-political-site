// __tests__/lib/rate-limit.test.ts
import { checkRateLimit, getRateLimitInfo } from "@/lib/rate-limit";
import { headers } from "next/headers";

jest.mock("next/headers", () => ({
  headers: jest.fn(() => new Map([["x-forwarded-for", "127.0.0.1"]])),
}));

describe("Rate Limiting", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("alapértelmezett rate limit működik", async () => {
    const result = await checkRateLimit("default");
    expect(result).toBe(true);
  });

  test("login rate limit működik", async () => {
    // 5 próbálkozás megengedett 15 perc alatt
    for (let i = 0; i < 5; i++) {
      const result = await checkRateLimit("login");
      expect(result).toBe(true);
    }

    const sixthTry = await checkRateLimit("login");
    expect(sixthTry).toBe(false);
  });

  test("contact rate limit működik", async () => {
    // 10 üzenet megengedett óránként
    for (let i = 0; i < 10; i++) {
      const result = await checkRateLimit("contact");
      expect(result).toBe(true);
    }

    const eleventhTry = await checkRateLimit("contact");
    expect(eleventhTry).toBe(false);
  });

  test("admin route-ok rate limitje működik", async () => {
    for (let i = 0; i < 100; i++) {
      const result = await checkRateLimit("admin");
      expect(result).toBe(true);
    }

    const tooMany = await checkRateLimit("admin");
    expect(tooMany).toBe(false);
  });

  test("rate limit info visszaadja a helyes értékeket", () => {
    const info = getRateLimitInfo("login", "127.0.0.1");

    expect(info).toHaveProperty("remaining");
    expect(info).toHaveProperty("reset");
    expect(info.remaining).toBeLessThanOrEqual(5);
    expect(info.reset).toBeInstanceOf(Date);
  });
});

// __tests__/api/contact.test.ts
import { POST } from "@/app/api/contact/route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma");
jest.mock("@/lib/rate-limit", () => ({
  withRateLimit: (routeName: string, handler: Function) => handler(),
  checkRateLimit: jest.fn().mockResolvedValue(true),
}));

describe("Contact API with Rate Limit", () => {
  const validContactData = {
    name: "Test User",
    email: "test@example.com",
    subject: "Test Subject",
    message: "Test message that is long enough",
  };

  test("sikeres üzenetküldés rate limit alatt", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/contact", {
        method: "POST",
        body: JSON.stringify(validContactData),
      })
    );

    expect(response.status).toBe(200);
  });
});

// __tests__/api/auth.test.ts
import { POST } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest } from "next/server";

jest.mock("@/lib/rate-limit", () => ({
  withRateLimit: (routeName: string, handler: Function) => handler(),
  checkRateLimit: jest.fn().mockResolvedValue(true),
}));

describe("Auth API with Rate Limit", () => {
  test("login kérés rate limit alatt", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/auth/callback/credentials", {
        method: "POST",
        body: JSON.stringify({
          email: process.env.ADMIN_EMAIL,
          password: process.env.ADMIN_PASSWORD,
        }),
      })
    );

    expect(response.status).not.toBe(429);
  });
});

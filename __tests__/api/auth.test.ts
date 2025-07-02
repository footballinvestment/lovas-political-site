// __tests__/api/auth.test.ts
import { GET, POST } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRateLimit, checkRateLimit } from "@/lib/rate-limit";

jest.mock("@/lib/prisma");
jest.mock("@/lib/rate-limit", () => ({
  withRateLimit: (routeName: string, handler: Function) => handler(),
  checkRateLimit: jest.fn().mockResolvedValue(true),
}));

describe("Auth API", () => {
  const mockUser = {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (checkRateLimit as jest.Mock).mockResolvedValue(true);
  });

  test("verifies admin credentials under rate limit", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/auth/callback/credentials", {
        method: "POST",
        body: JSON.stringify(mockUser),
      })
    );
    expect(response.status).toBe(200);
  });

  test("blocks login attempts when rate limit exceeded", async () => {
    (checkRateLimit as jest.Mock).mockResolvedValue(false);

    const response = await POST(
      new NextRequest("http://localhost:3000/api/auth/callback/credentials", {
        method: "POST",
        body: JSON.stringify(mockUser),
      })
    );
    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.error).toBe("Too Many Requests");
  });

  test("rejects invalid credentials", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/auth/callback/credentials", {
        method: "POST",
        body: JSON.stringify({
          email: "wrong@email.com",
          password: "wrong",
        }),
      })
    );
    expect(response.status).toBe(401);
  });

  test("handles missing credentials", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/auth/callback/credentials", {
        method: "POST",
        body: JSON.stringify({}),
      })
    );
    expect(response.status).toBe(401);
  });

  test("verifies rate limit is checked", async () => {
    await POST(
      new NextRequest("http://localhost:3000/api/auth/callback/credentials", {
        method: "POST",
        body: JSON.stringify(mockUser),
      })
    );

    expect(checkRateLimit).toHaveBeenCalledWith("login");
    expect(checkRateLimit).toHaveBeenCalledTimes(1);
  });
});

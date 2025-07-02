// __tests__/api/themes.test.ts
import { GET, POST, PUT, DELETE } from "@/app/api/themes/route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { withRateLimit, checkRateLimit } from "@/lib/rate-limit";

jest.mock("@/lib/prisma");
jest.mock("next-auth/next");
jest.mock("@/lib/rate-limit", () => ({
  withRateLimit: (routeName: string, handler: Function) => handler(),
  checkRateLimit: jest.fn().mockResolvedValue(true),
}));

describe("Themes API", () => {
  const mockTheme = {
    id: "1",
    name: "Test Theme",
    fromColor: "#000000",
    toColor: "#FFFFFF",
    textColor: "#000000",
    type: "GLOBAL",
    isActive: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "admin@example.com" },
    });
    (checkRateLimit as jest.Mock).mockResolvedValue(true);
  });

  describe("GET /api/themes", () => {
    test("returns themes under rate limit", async () => {
      (prisma.theme.findMany as jest.Mock).mockResolvedValue([mockTheme]);
      const response = await GET();
      const data = await response.json();
      expect(data[0]).toMatchObject(mockTheme);
      expect(response.status).toBe(200);
    });

    test("blocks request when rate limit exceeded", async () => {
      (checkRateLimit as jest.Mock).mockResolvedValue(false);
      const response = await GET();
      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data.error).toBe("Too Many Requests");
    });
  });

  describe("POST /api/themes", () => {
    test("creates theme under rate limit", async () => {
      (prisma.theme.create as jest.Mock).mockResolvedValue(mockTheme);
      const response = await POST(
        new NextRequest("http://localhost:3000/api/themes", {
          method: "POST",
          body: JSON.stringify(mockTheme),
        })
      );
      expect(response.status).toBe(200);
    });

    test("blocks creation when rate limit exceeded", async () => {
      (checkRateLimit as jest.Mock).mockResolvedValue(false);
      const response = await POST(
        new NextRequest("http://localhost:3000/api/themes", {
          method: "POST",
          body: JSON.stringify(mockTheme),
        })
      );
      expect(response.status).toBe(429);
    });

    test("requires authentication", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      const response = await POST(
        new NextRequest("http://localhost:3000/api/themes", {
          method: "POST",
          body: JSON.stringify(mockTheme),
        })
      );
      expect(response.status).toBe(401);
    });
  });

  describe("PUT /api/themes", () => {
    test("updates theme under rate limit", async () => {
      (prisma.theme.update as jest.Mock).mockResolvedValue(mockTheme);
      const response = await PUT(
        new NextRequest("http://localhost:3000/api/themes", {
          method: "PUT",
          body: JSON.stringify({
            ...mockTheme,
            name: "Updated Theme",
          }),
        })
      );
      expect(response.status).toBe(200);
    });

    test("blocks update when rate limit exceeded", async () => {
      (checkRateLimit as jest.Mock).mockResolvedValue(false);
      const response = await PUT(
        new NextRequest("http://localhost:3000/api/themes", {
          method: "PUT",
          body: JSON.stringify(mockTheme),
        })
      );
      expect(response.status).toBe(429);
    });
  });

  describe("DELETE /api/themes", () => {
    test("deletes theme under rate limit", async () => {
      (prisma.theme.delete as jest.Mock).mockResolvedValue(mockTheme);
      const response = await DELETE(
        new NextRequest("http://localhost:3000/api/themes?id=1")
      );
      expect(response.status).toBe(200);
    });

    test("blocks deletion when rate limit exceeded", async () => {
      (checkRateLimit as jest.Mock).mockResolvedValue(false);
      const response = await DELETE(
        new NextRequest("http://localhost:3000/api/themes?id=1")
      );
      expect(response.status).toBe(429);
    });
  });

  test("verifies rate limit is checked for each method", async () => {
    await GET();
    await POST(
      new NextRequest("http://localhost:3000/api/themes", {
        method: "POST",
        body: JSON.stringify(mockTheme),
      })
    );

    expect(checkRateLimit).toHaveBeenCalledWith("default");
    expect(checkRateLimit).toHaveBeenCalledWith("admin");
    expect(checkRateLimit).toHaveBeenCalledTimes(2);
  });
});

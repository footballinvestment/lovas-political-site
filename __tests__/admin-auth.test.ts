// __tests__/admin-auth.test.ts
import { GET, POST } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

jest.mock("next-auth");

describe("Admin Authentication", () => {
  test("sikeres admin bejelentkezés", async () => {
    const credentials = {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    };

    const response = await POST(
      new NextRequest("http://localhost:3000/api/auth/callback/credentials", {
        method: "POST",
        body: JSON.stringify(credentials),
      })
    );

    expect(response.status).toBe(200);
  });

  test("védett admin route ellenőrzése", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const response = await GET(
      new NextRequest("http://localhost:3000/api/admin")
    );

    expect(response.status).toBe(401);
  });
});

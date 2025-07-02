// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { withRateLimit } from "@/lib/rate-limit";

const handler = NextAuth(authOptions);

export const GET = handler;
export const POST = async (request: Request) => {
  return withRateLimit("auth", async () => handler(request));
};

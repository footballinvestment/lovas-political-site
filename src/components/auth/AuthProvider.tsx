// src/components/auth/AuthProvider.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function AuthProvider({ children }: Props) {
  return <SessionProvider>{children}</SessionProvider>;
}

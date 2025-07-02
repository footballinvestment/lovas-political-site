// src/components/admin/AdminSecurityProvider.tsx
"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import AdminSessionProvider from "./AdminSessionProvider";

interface AdminSecurityProviderProps {
  children: React.ReactNode;
  session?: any;
}

export default function AdminSecurityProvider({ 
  children, 
  session 
}: AdminSecurityProviderProps) {
  return (
    <SessionProvider session={session}>
      <AdminSessionProvider>
        {children}
      </AdminSessionProvider>
    </SessionProvider>
  );
}

// Usage example for admin layout:
/*
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminSecurityProvider>
      <div className="admin-layout">
        <AdminNav />
        <main className="admin-content">
          {children}
        </main>
      </div>
    </AdminSecurityProvider>
  );
}
*/
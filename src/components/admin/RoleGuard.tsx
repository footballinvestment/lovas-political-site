// src/components/admin/RoleGuard.tsx
"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { UserRole, hasPermission } from "@/lib/rbac";
import { ShieldX } from "lucide-react";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

export default function RoleGuard({ 
  children, 
  allowedRoles, 
  fallback,
  showFallback = false 
}: RoleGuardProps) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status !== "authenticated" || !session?.user?.role) {
    if (showFallback && fallback) {
      return <>{fallback}</>;
    }
    return null;
  }

  const userRole = session.user.role as string;
  const hasAccess = hasPermission(userRole, allowedRoles);

  if (!hasAccess) {
    if (showFallback && fallback) {
      return <>{fallback}</>;
    }
    
    if (showFallback) {
      return (
        <div className="flex items-center justify-center p-4 text-gray-500 dark:text-gray-400">
          <ShieldX className="h-5 w-5 mr-2" />
          <span className="text-sm">Nincs jogosultság a megtekintéshez</span>
        </div>
      );
    }
    
    return null;
  }

  return <>{children}</>;
}

// Convenience components for specific roles
export function AdminOnly({ children, fallback, showFallback }: Omit<RoleGuardProps, 'allowedRoles'>) {
  return (
    <RoleGuard 
      allowedRoles={[UserRole.ADMIN]} 
      fallback={fallback}
      showFallback={showFallback}
    >
      {children}
    </RoleGuard>
  );
}

export function EditorAndAbove({ children, fallback, showFallback }: Omit<RoleGuardProps, 'allowedRoles'>) {
  return (
    <RoleGuard 
      allowedRoles={[UserRole.EDITOR, UserRole.ADMIN]} 
      fallback={fallback}
      showFallback={showFallback}
    >
      {children}
    </RoleGuard>
  );
}

export function ModeratorAndAbove({ children, fallback, showFallback }: Omit<RoleGuardProps, 'allowedRoles'>) {
  return (
    <RoleGuard 
      allowedRoles={[UserRole.MODERATOR, UserRole.EDITOR, UserRole.ADMIN]} 
      fallback={fallback}
      showFallback={showFallback}
    >
      {children}
    </RoleGuard>
  );
}
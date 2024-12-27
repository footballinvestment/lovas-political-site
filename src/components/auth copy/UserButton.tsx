"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export const UserButton = () => {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />;
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-700">{session.user.name}</span>
        <button
          onClick={() => signOut()}
          className="text-sm text-red-600 hover:text-red-700"
        >
          Kilépés
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn("google")}
      className="text-sm text-blue-600 hover:text-blue-700"
    >
      Bejelentkezés
    </button>
  );
};

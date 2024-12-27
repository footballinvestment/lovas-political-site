// src/components/auth/UserButton.tsx
"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";

export const UserButton = () => {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />;
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt="Profile"
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
              {session.user.name?.[0]}
            </div>
          )}
          <span className="text-sm text-gray-700 hidden md:inline">
            {session.user.name}
          </span>
        </div>
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
      className="text-sm bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors"
    >
      Bejelentkezés
    </button>
  );
};

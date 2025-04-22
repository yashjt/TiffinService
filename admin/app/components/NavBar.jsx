"use client";

import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";

export default function NavBar() {
  const { user, error, isLoading } = useUser();

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Menu App
        </Link>
        <div>
          {!isLoading && !user && (
            <Link
              href="/api/auth/login"
              className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded"
            >
              Login
            </Link>
          )}
          {user && (
            <div className="flex items-center gap-4">
              <span>Welcome, {user.name}!</span>
              <Link
                href="/api/auth/logout"
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded"
              >
                Logout
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

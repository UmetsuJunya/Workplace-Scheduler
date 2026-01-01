"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED === "true";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // If auth is disabled, skip authentication check
      if (!AUTH_ENABLED) {
        setIsChecking(false);
        return;
      }

      // Skip auth check on login and signup pages
      if (pathname === "/login" || pathname === "/signup") {
        setIsChecking(false);
        return;
      }

      // Check if user has token first
      const token = localStorage.getItem("access_token");

      if (token) {
        // User is already logged in, allow access
        setIsChecking(false);
        return;
      }

      // No token - check if registration is allowed (no users exist yet)
      try {
        const response = await fetch(`${API_URL}/auth/can-register`);
        if (response.ok) {
          const { canRegister } = await response.json();
          if (canRegister) {
            // No users exist, redirect to signup
            router.push("/signup");
            setIsChecking(false);
            return;
          }
        }
      } catch (error) {
        console.error("Failed to check registration status:", error);
      }

      // No token and users exist, redirect to login
      router.push("/login");
      setIsChecking(false);
    };

    checkAuth();
  }, [pathname, router]);

  // Show loading state while checking auth
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

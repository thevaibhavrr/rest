"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const AUTH_STORAGE_KEY = "rural-bites-auth";
const AUTH_EXPIRY_DAYS = 1;

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const authData = localStorage.getItem(AUTH_STORAGE_KEY);
        if (authData) {
          const parsed = JSON.parse(authData);
          const now = new Date().getTime();
          const expiryTime = parsed.timestamp + (AUTH_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
          
          if (now < expiryTime) {
            // Still valid, redirect to home dashboard
            router.push("/home");
            return;
          } else {
            // Expired, clear storage and redirect to login
            localStorage.removeItem(AUTH_STORAGE_KEY);
          }
        }
        // No valid auth, redirect to login
        router.push("/login");
      } catch (error) {
        console.error("Failed to check authentication", error);
        localStorage.removeItem(AUTH_STORAGE_KEY);
        router.push("/login");
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2f6b4f] border-t-transparent"></div>
        <p className="mt-4 text-sm text-[#4f5d63]">
          {isChecking ? "Checking authentication..." : "Redirecting..."}
        </p>
      </div>
    </div>
  );
}

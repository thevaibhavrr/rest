"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page
    router.push("/login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2f6b4f] border-t-transparent"></div>
        <p className="mt-4 text-sm text-[#4f5d63]">Redirecting to login...</p>
      </div>
    </div>
  );
}

"use client";

import type { FormEvent } from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const VALID_USERNAME = "abx";
const VALID_PASSWORD = "1234";
const AUTH_STORAGE_KEY = "rural-bites-auth";
const AUTH_EXPIRY_DAYS = 1;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const isFormComplete = username.trim().length > 0 && password.trim().length > 0;
  const currentYear = new Date().getFullYear();

  // Check for existing valid authentication
  useEffect(() => {
    try {
      const authData = localStorage.getItem(AUTH_STORAGE_KEY);
      if (authData) {
        const parsed = JSON.parse(authData);
        const now = new Date().getTime();
        const expiryTime = parsed.timestamp + (AUTH_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        
        if (now < expiryTime) {
          // Still valid, redirect to home
          router.push("/");
          return;
        } else {
          // Expired, clear storage
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("Failed to check authentication", error);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const normalizedUsername = username.trim().toLowerCase();
    const normalizedPassword = password.trim();

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (
      normalizedUsername === VALID_USERNAME &&
      normalizedPassword === VALID_PASSWORD
    ) {
      try {
        // Store authentication with timestamp
        const authData = {
          username: normalizedUsername,
          timestamp: new Date().getTime(),
        };
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
        
        setStatus("success");
        setMessage("Login successful! Redirecting...");
        setPassword("");
        
        // Redirect after short delay
        setTimeout(() => {
          router.push("/");
        }, 1000);
      } catch (error) {
        setStatus("error");
        setMessage("Failed to save authentication. Please try again.");
      }
    } else {
      setStatus("error");
      setMessage(
        "The username or password does not match our records. Please try again."
      );
    }
    
    setIsLoading(false);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#fef9f3] via-[#f5efe0] to-[#e7f2ea] px-1 py-12 text-[#273036]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -right-24 top-24 h-64 w-64 rounded-full bg-gradient-to-br from-[#f3d3a1] to-[#8dc69b] opacity-70 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -left-16 bottom-20 h-72 w-72 rounded-full bg-gradient-to-br from-[#8dc69b] to-[#f8e4c6] opacity-60 blur-3xl"
          aria-hidden="true"
        />
      </div>

      <div className="relative z-10 w-full max-w-sm space-y-8">
        <header className="text-center">
          <span className="inline-block rounded-full bg-[#ebf4ef] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#2f6b4f]">
            Waiter Login
          </span>
          <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">
            Rural Bites Service Desk
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#4f5d63]">
            Check in to manage tables, run KOT tickets, and keep the rural
            dining floor moving smoothly.
          </p>
        </header>

        <section className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-xl shadow-[#c0d8cc]/60 backdrop-blur">
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="text-sm font-medium text-[#2f6b4f]"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                placeholder="Enter your username"
                required
                disabled={isLoading}
                className="w-full rounded-2xl border border-[#cddbd1] bg-white/90 px-4 py-3 text-sm shadow-inner outline-none transition focus:border-[#2f6b4f] focus:ring-2 focus:ring-[#8dc69b] sm:text-base disabled:opacity-60"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-[#2f6b4f]"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="Enter your password"
                required
                disabled={isLoading}
                className="w-full rounded-2xl border border-[#cddbd1] bg-white/90 px-4 py-3 text-sm shadow-inner outline-none transition focus:border-[#2f6b4f] focus:ring-2 focus:ring-[#8dc69b] sm:text-base disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={!isFormComplete || isLoading}
              className="w-full rounded-2xl bg-gradient-to-r from-[#3d8c66] via-[#2f6b4f] to-[#246048] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#8dc69b]/50 transition hover:scale-[1.01] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6b4f] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>

            <div className="rounded-2xl bg-[#f7f1e7]/80 p-4 text-xs text-[#4f5d63]">
              <p className="font-semibold text-[#2f6b4f]">Demo access</p>
              <p className="mt-1">
                Username: <span className="font-mono text-[#2f6b4f]">abx</span>
              </p>
              <p>
                Password: <span className="font-mono text-[#2f6b4f]">1234</span>
              </p>
            </div>

            <div aria-live="polite" className="min-h-[1.25rem] text-xs">
              {status === "success" && (
                <p className="text-[#2f6b4f]">{message}</p>
              )}
              {status === "error" && (
                <p className="text-[#c05b43]">{message}</p>
              )}
            </div>
          </form>

          <p className="mt-6 text-center text-xs text-[#5d6b72]">
            Shift sync happens even on low bandwidth. Remember to log out at
            day end.
          </p>
        </section>

        <div className="text-center">
          <div className="mx-auto flex max-w-xs items-center justify-center gap-2 rounded-2xl bg-white/70 px-4 py-3 text-xs text-[#2f6b4f] shadow">
            <span
              className="h-2 w-2 rounded-full bg-[#2f6b4f]"
              aria-hidden="true"
            />
            <p>Optimized for village hotspots & low-bandwidth kiosks</p>
          </div>
        </div>

        <div className="rounded-3xl border border-dashed border-[#d6e4d8] bg-white/40 p-4 text-xs text-[#4f5d63]">
          <strong className="font-semibold text-[#2f6b4f]">
            Floor readiness checklist
          </strong>
          <ul className="mt-2 list-disc space-y-2 pl-4">
            <li>Confirm sanitizer refill before opening each section.</li>
            <li>Mark tables online within 2 minutes after cleaning.</li>
            <li>
              Need support? Email
              <a
                className="ml-1 text-[#2f6b4f] underline"
                href="mailto:support@ruralbites.in"
              >
                support@ruralbites.in
              </a>
              .
            </li>
          </ul>
        </div>
      </div>

      <footer className="relative z-10 mt-12 text-center text-xs text-[#5d6b72]">
        &copy; {currentYear} Rural Bites Cooperative. All rights reserved.
      </footer>
    </div>
  );
}

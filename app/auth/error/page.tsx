"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

const ERRORS: Record<string, string> = {
  Configuration: "Server configuration error. Please contact support.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "The sign-in link has expired. Please try again.",
  Default: "An unexpected error occurred. Please try again.",
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") ?? "Default";
  const message = ERRORS[error] ?? ERRORS.Default;

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <div className="max-w-md w-full bg-card border border-red-500/30 rounded-2xl p-10 shadow-card">
        <h1 className="font-display text-2xl font-bold text-red-400 mb-2">Sign-in Error</h1>
        <p className="text-slate-400 mb-8">{message}</p>
        <Link
          href="/auth/signin"
          className="px-6 py-3 rounded-lg bg-neon-cyan text-black font-semibold hover:opacity-90 transition-opacity inline-block"
        >
          Try Again
        </Link>
      </div>
    </main>
  );
}

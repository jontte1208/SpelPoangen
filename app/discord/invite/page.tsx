"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";

const inviteUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL;

export default function DiscordInvitePage() {
  const searchParams = useSearchParams();

  const nextPath = useMemo(() => {
    const next = searchParams.get("next");
    return next && next.startsWith("/") ? next : "/dashboard";
  }, [searchParams]);

  useEffect(() => {
    if (!inviteUrl) {
      return;
    }

    window.location.assign(inviteUrl);
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-card p-8 text-center shadow-card">
        <h1 className="font-display text-3xl font-bold tracking-widest text-neon-cyan">
          Redirecting To Discord
        </h1>
        <p className="mt-4 text-slate-300">
          You are signed in. We are sending you to the Discord invite now.
        </p>

        {inviteUrl ? (
          <a
            href={inviteUrl}
            className="mt-6 inline-flex rounded-lg bg-[#5865F2] px-6 py-3 font-semibold text-white hover:opacity-90"
          >
            Open Discord Invite
          </a>
        ) : (
          <p className="mt-6 text-amber-300">
            NEXT_PUBLIC_DISCORD_INVITE_URL is not configured.
          </p>
        )}

        <div className="mt-6">
          <Link
            href={nextPath}
            className="inline-flex rounded-lg border border-white/20 px-5 py-2 text-sm text-slate-200 hover:bg-white/5"
          >
            Continue To Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

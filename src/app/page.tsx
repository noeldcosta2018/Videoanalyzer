import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UrlInputForm } from "@/components/url-input-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-900">
        <span className="text-white font-semibold text-sm tracking-tight">Videoanalyzer</span>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-zinc-500 text-xs hidden sm:block">{user.email}</span>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                  Sign in
                </Button>
              </Link>
              <Link href="/login">
                <Button size="sm" className="bg-white text-zinc-950 hover:bg-zinc-100 font-semibold">
                  Sign up free
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-24">
        <div className="flex flex-col items-center gap-8 w-full max-w-2xl text-center">
          <Badge variant="outline" className="text-zinc-400 border-zinc-700 text-xs px-3 py-1">
            Phase 1 MVP — Free Beta
          </Badge>

          <div className="flex flex-col gap-3">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Watch less. Understand more.
            </h1>
            <p className="text-lg text-zinc-400 max-w-xl mx-auto">
              Paste a YouTube URL — get a rich interactive notebook with summaries,
              transcripts, mind maps, and more.
            </p>
          </div>

          <Suspense fallback={null}>
            <UrlInputForm />
          </Suspense>

          <p className="text-xs text-zinc-600">
            Free tier: 60 minutes/month · No credit card required
          </p>
        </div>
      </main>
    </div>
  );
}

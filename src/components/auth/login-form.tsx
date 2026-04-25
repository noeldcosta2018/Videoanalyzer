"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
    }

    const pending = sessionStorage.getItem("pending_url");
    sessionStorage.removeItem("pending_url");
    router.push(pending ? `/?url=${encodeURIComponent(pending)}` : "/");
    router.refresh();
  }

  async function handleMagicLink() {
    if (!email) { setError("Enter your email first."); return; }
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setMagicSent(true);
  }

  if (magicSent) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center text-zinc-300 text-sm">
        Check your email — we sent a magic link to <strong>{email}</strong>.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 h-11"
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 h-11"
      />

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <Button
        type="submit"
        disabled={loading}
        className="h-11 bg-white text-zinc-950 hover:bg-zinc-100 font-semibold"
      >
        {loading ? "…" : mode === "signin" ? "Sign in" : "Create account"}
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={handleMagicLink}
        disabled={loading}
        className="h-11 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
      >
        Email me a magic link
      </Button>

      <p className="text-center text-zinc-500 text-sm">
        {mode === "signin" ? "No account? " : "Have an account? "}
        <button
          type="button"
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}
          className="text-zinc-300 hover:text-white underline"
        >
          {mode === "signin" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </form>
  );
}

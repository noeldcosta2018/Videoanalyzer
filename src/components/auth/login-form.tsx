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
  const [confirmSent, setConfirmSent] = useState(false);

  const supabase = createClient();

  function resume() {
    const pending = sessionStorage.getItem("pending_url");
    sessionStorage.removeItem("pending_url");
    router.push(pending ? `/?url=${encodeURIComponent(pending)}` : "/");
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      resume();
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      // If session is immediately available, email confirmation is disabled — go straight in
      if (data.session) {
        resume();
      } else {
        // Email confirmation required — show message
        setConfirmSent(true);
        setLoading(false);
      }
    }
  }

  async function handleMagicLink() {
    if (!email) { setError("Enter your email first."); return; }
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setConfirmSent(true);
  }

  if (confirmSent) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center flex flex-col gap-3">
        <p className="text-white font-medium">Check your email</p>
        <p className="text-zinc-400 text-sm">
          We sent a link to <strong>{email}</strong>. Click it to{" "}
          {mode === "signup" ? "confirm your account and sign in" : "sign in"}.
        </p>
        <p className="text-zinc-600 text-xs">
          No email? Check spam, or{" "}
          <button
            onClick={() => setConfirmSent(false)}
            className="underline text-zinc-400 hover:text-white"
          >
            try again
          </button>
          .
        </p>
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
        placeholder="Password (min 6 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
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
        Email me a magic link instead
      </Button>

      <p className="text-center text-zinc-500 text-sm">
        {mode === "signin" ? "No account? " : "Have an account? "}
        <button
          type="button"
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}
          className="text-zinc-300 hover:text-white underline"
        >
          {mode === "signin" ? "Sign up free" : "Sign in"}
        </button>
      </p>
    </form>
  );
}

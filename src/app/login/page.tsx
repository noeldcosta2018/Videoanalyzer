import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Sign in</h1>
          <p className="text-zinc-400 text-sm mt-1">to your Videoanalyzer account</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}

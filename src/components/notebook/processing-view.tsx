"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function ProcessingView({ notebookId }: { notebookId: string }) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/notebook/${notebookId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "ready") {
          clearInterval(interval);
          router.refresh();
        } else if (data.status === "failed") {
          clearInterval(interval);
          router.refresh();
        }
      } catch {
        // Network blip — keep polling
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [notebookId, router]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-2 border-zinc-700 border-t-white rounded-full animate-spin mx-auto" />
        <p className="text-white font-medium">Analyzing your video…</p>
        <p className="text-zinc-500 text-sm">
          This can take a few minutes for long videos.<br />
          You can close this tab — we'll keep processing.
        </p>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NotebookView } from "@/components/notebook/notebook-view";
import { ProcessingView } from "@/components/notebook/processing-view";

export default async function NotebookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: notebook } = await db
    .from("notebooks")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!notebook) redirect("/");

  if (notebook.status === "processing" || notebook.status === "pending") {
    return <ProcessingView notebookId={id} />;
  }

  if (notebook.status === "failed") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-red-400 text-lg font-medium">Processing failed</p>
          <p className="text-zinc-500 text-sm">Something went wrong analyzing this video.</p>
          <a href="/" className="text-zinc-400 underline text-sm">Try again</a>
        </div>
      </div>
    );
  }

  const { data: source } = await db
    .from("sources")
    .select("*")
    .eq("notebook_id", id)
    .maybeSingle();

  return <NotebookView notebook={notebook} source={source} />;
}

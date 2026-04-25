export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NotebookView } from "@/components/notebook/notebook-view";

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

  const { data: source } = await db
    .from("sources")
    .select("*")
    .eq("notebook_id", id)
    .eq("kind", "youtube_url")
    .maybeSingle();

  return <NotebookView notebook={notebook} source={source} />;
}

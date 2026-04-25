export default function NotebookPage({ params }: { params: { id: string } }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
      <div className="text-center flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Notebook: {params.id}</h1>
        <p className="text-zinc-400">Processing… (pipeline not yet wired)</p>
      </div>
    </main>
  );
}

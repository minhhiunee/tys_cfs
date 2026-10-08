import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <span className="text-lg font-semibold tracking-tight">CFS</span>
          <Link
            href="/admin"
            className="text-sm text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline"
          >
            Admin
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-12">
        <h1 className="text-2xl font-semibold leading-tight">
          Share anonymously
        </h1>
        <p className="mt-3 text-base leading-relaxed text-zinc-600">
          Submit text, images, or video for moderation. Your identity is not
          required. The public submission form arrives in Phase 3.
        </p>
        <p className="mt-8 rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-6 text-center text-sm text-zinc-500">
          Submission page — coming soon
        </p>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">
              Real Estate Marketplace &amp; AI Listing Assistant
            </h1>
            <p className="text-sm text-slate-400">
              Browse properties, manage listings, and use AI to write better
              descriptions, highlights, and inquiry messages.
            </p>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold mb-2">Coming soon</h2>
          <p className="text-sm text-slate-300">We&apos;re building:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-400">
            <li>Property search and filters</li>
            <li>Agent dashboard to create and manage listings</li>
            <li>AI-powered listing description generator</li>
            <li>AI highlights and inquiry drafts for buyers</li>
          </ul>
        </section>
      </div>
    </main>
  );
}

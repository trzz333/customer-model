import type { Metadata } from "next";
import { GLOSSARY, WORLDS } from "@/lib/business";
import { ARCHETYPES, ENGINE_VERSION } from "@/lib/sim";

export const metadata: Metadata = {
  title: "Glossary — Customer Model",
  description:
    "Plain-language definitions for the Customer Model stress-test: the customer worlds, the behavioral terms, and the seven customer archetypes.",
};

export default function GlossaryPage() {
  return (
    <main className="min-h-screen max-w-[900px] mx-auto px-4 sm:px-6 py-8">
      <header className="mb-8">
        <a href="/" className="text-xs text-muted-fg hover:text-foreground underline decoration-dotted underline-offset-2">← Back to the tool</a>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-3">Glossary</h1>
        <p className="text-muted-fg mt-1 max-w-2xl">
          The vocabulary the stress-test uses, in plain terms. The same definitions
          appear as hover notes inside the tool; this page collects them so a class
          can read them up front.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-primary-light mb-3">Terms</h2>
        <dl className="space-y-3">
          {GLOSSARY.map((g) => (
            <div key={g.term} className="rounded-xl border border-card-border bg-card p-4">
              <dt className="text-sm font-semibold">{g.term}</dt>
              <dd className="text-sm text-muted-fg leading-relaxed mt-1">{g.def}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mb-10">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-primary-light mb-1">Customer worlds</h2>
        <p className="text-sm text-muted-fg mb-3 max-w-2xl">
          A world is a crowd: a particular mix of the archetypes below. The same
          business is dropped into each one, so the result depends on who the
          customers are, not only on the business.
        </p>
        <dl className="space-y-3">
          {WORLDS.map((w) => (
            <div key={w.key} className="rounded-xl border border-card-border bg-card p-4">
              <dt className="text-sm font-semibold">{w.name}</dt>
              <dd className="text-sm text-muted-fg leading-relaxed mt-1">{w.blurb}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mb-10">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-primary-light mb-1">Customer archetypes</h2>
        <p className="text-sm text-muted-fg mb-3 max-w-2xl">
          Seven ways a customer can react to your moves, from loyal regulars to
          deal-chasers who leave the moment something cheaper appears. Each one
          follows a fixed rule, and every customer world is a mix of them. The
          names borrow from strategies in Axelrod&apos;s repeated-game tournaments,
          but you don&apos;t need any game theory to read them: the plain
          description is what matters.
        </p>
        <dl className="space-y-3">
          {ARCHETYPES.map((a) => (
            <div key={a.key} className="rounded-xl border border-card-border bg-card p-4">
              <dt className="flex items-baseline gap-2 flex-wrap">
                <span className="h-2.5 w-2.5 rounded-full shrink-0 self-center" style={{ backgroundColor: a.color }} />
                <span className="text-sm font-semibold">{a.name}</span>
                <span className="text-xs text-muted-fg">≈ {a.axelrod}</span>
              </dt>
              <dd className="text-sm text-muted-fg leading-relaxed mt-1">{a.tagline}</dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className="border-t border-card-border pt-4 text-xs text-muted-fg">
        Engine {ENGINE_VERSION}. <a href="/" className="hover:text-foreground underline decoration-dotted underline-offset-2">Back to the tool →</a>
      </footer>
    </main>
  );
}

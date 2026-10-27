export function PageIntro({ eyebrow, title, lede }: { eyebrow: string; title: string; lede: string }) {
  return (
    <header className="mb-6 max-w-3xl">
      <p className="text-sm font-semibold tracking-wide text-savings uppercase">{eyebrow}</p>
      <h1 className="mt-1 font-display text-4xl tracking-tight sm:text-5xl">{title}</h1>
      <p className="mt-3 text-lg text-muted">{lede}</p>
    </header>
  );
}

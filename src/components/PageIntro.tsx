export function PageIntro({ eyebrow, title, lede }: { eyebrow: string; title: string; lede: string }) {
  return (
    <header className="mb-6 max-w-3xl">
      <p className="wds-eyebrow eyebrow">{eyebrow}</p>
      <h1 className="display-sm mt-2 mb-0">{title}</h1>
      <p className="wds-lead mt-3 mb-0">{lede}</p>
    </header>
  );
}

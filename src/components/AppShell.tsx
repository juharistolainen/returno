import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { BuildStamp } from "./BuildStamp.tsx";
import { isCalculatorPath } from "../lib/paths.ts";
import { defaultScenario, resolveScenario, scenarioEqual, scenarioToSearch, type Scenario } from "../lib/scenario.ts";
import { readStoredScenario, writeStoredScenario } from "../lib/storage.ts";

const views = [
  { to: "/savings", label: "Savings" },
  { to: "/stocks", label: "Stocks" },
  { to: "/compare", label: "Compare" },
  { to: "/goal", label: "Goal" },
] as const;

export function RootLayout() {
  const scenario = useLeafScenario();
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-20 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="flex items-center gap-3 rounded-lg text-ink no-underline">
            <Mark />
            <span>
              <span className="display-xs block">Returno</span>
              <span className="body-sm mt-1 block text-muted">Expected returns, in euros</span>
            </span>
          </Link>
          <div className="flex flex-col gap-3 sm:items-end">
            <nav aria-label="Calculators" className="grid grid-cols-2 gap-1 rounded-2xl border border-line bg-tint p-2 sm:grid-cols-4">
              {views.map((view) => (
                <Link
                  key={view.to}
                  to={view.to}
                  search={scenarioToSearch(scenario) as Scenario}
                  className="body-sm-strong flex min-h-[var(--control-md)] items-center justify-center rounded-xl px-4 text-center text-muted no-underline aria-[current=page]:bg-card aria-[current=page]:text-ink"
                >
                  {view.label}
                </Link>
              ))}
            </nav>
            <CopyLinkButton />
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <PersistScenario />
        <Outlet />
      </main>
      <footer className="wds-band wds-band--dark px-6 py-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <p className="body-sm max-w-3xl">
            Estimates only, not financial advice. Returno does not know future rates, returns, fees, tax, or inflation.
            A constant rate is a sketch, not a forecast.
          </p>
          <BuildStamp version={__APP_VERSION__} builtAt={__BUILD_TIME__} />
        </div>
      </footer>
    </div>
  );
}

export function NotFound() {
  useEffect(() => {
    document.title = "Page not found — Returno";
    let meta = document.head.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "robots");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "noindex");
  }, []);

  return (
    <div className="wds-card mx-auto max-w-lg">
      <h1 className="display-sm">That page is not here</h1>
      <p className="mt-2 text-muted">The calculators live on Savings, Stocks, Compare, and Goal.</p>
      <Link
        to="/savings"
        search={scenarioToSearch(defaultScenario) as Scenario}
        className="wds-btn wds-btn--text mt-6"
      >
        Open the savings calculator
      </Link>
    </div>
  );
}

function useLeafScenario(): Scenario {
  const location = useLocation();
  const raw = isRecord(location.search) ? location.search : {};
  return resolveScenario(raw, readStoredScenario());
}

function PersistScenario() {
  const location = useLocation();

  useEffect(() => {
    // Remember the scenario the calculator is showing. Leave the URL alone:
    // a visit with no query stays bare until the person edits a field.
    if (!isCalculatorPath(location.pathname)) return;
    const raw = isRecord(location.search) ? location.search : {};
    const shown = resolveScenario(raw, readStoredScenario());
    const stored = readStoredScenario();
    if (!stored || !scenarioEqual(stored, shown)) writeStoredScenario(shown);
  }, [location.pathname, location.search]);

  return null;
}

function CopyLinkButton() {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const busy = useRef(false);

  const copyLink = () => {
    if (busy.current) return;
    busy.current = true;
    window.setTimeout(() => {
      busy.current = false;
    }, 400);
    const url = window.location.href;
    const mark = (next: "copied" | "failed") => {
      setStatus(next);
      window.setTimeout(() => setStatus("idle"), 2000);
    };
    if (copyWithTextarea(url)) {
      mark("copied");
      return;
    }
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      mark("failed");
    }, 300);
    const finish = (next: "copied" | "failed") => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      mark(next);
    };
    if (!navigator.clipboard?.writeText) {
      finish("failed");
      return;
    }
    void navigator.clipboard.writeText(url).then(() => finish("copied")).catch(() => finish("failed"));
  };

  return (
    <>
      <button
        type="button"
        aria-live="polite"
        className={`wds-btn self-start sm:self-end ${
          status === "copied" ? "copy-btn--copied" : status === "failed" ? "copy-btn--failed" : "wds-btn--secondary"
        }`}
        onClick={() => copyLink()}
        onMouseDown={(event) => {
          if (event.button === 0) copyLink();
        }}
      >
        {status === "copied" ? "Link copied" : status === "failed" ? "Could not copy link" : "Copy link"}
      </button>
      {status !== "idle" ? (
        <p
          role="status"
          className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm text-paper shadow-md"
        >
          {status === "copied" ? "Link copied" : "Could not copy link"}
        </p>
      ) : null}
    </>
  );
}

function copyWithTextarea(url: string): boolean {
  try {
    const textarea = document.createElement("textarea");
    textarea.value = url;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, url.length);
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

function Mark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className="size-10 shrink-0">
      <rect width="32" height="32" rx="8" fill="var(--primary)" />
      <path d="M7 22.5h18" stroke="var(--on-primary)" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 19.5 13 15l4 3 7-8" stroke="var(--on-primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="10" r="1.7" fill="var(--on-primary)" />
    </svg>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

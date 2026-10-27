import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate, useRouterState } from "@tanstack/react-router";
import { isCalculatorPath } from "../lib/paths.ts";
import { defaultScenario, parseScenario, type Scenario } from "../lib/scenario.ts";
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
      <header className="border-b border-line/80 bg-card/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="flex items-center gap-3 rounded-lg">
            <Mark />
            <span>
              <span className="block font-display text-[1.7rem] leading-none tracking-tight">Returno</span>
              <span className="mt-1 block text-sm text-muted">Expected returns, in euros</span>
            </span>
          </Link>
          <div className="flex flex-col gap-3 sm:items-end">
            <nav aria-label="Calculators" className="grid grid-cols-2 gap-1 rounded-2xl bg-[#efe7da] p-1 text-sm font-medium sm:grid-cols-4 sm:rounded-full sm:gap-0">
              {views.map((view) => (
                <Link
                  key={view.to}
                  to={view.to}
                  search={scenario}
                  className="rounded-full px-3 py-1.5 text-center text-muted aria-[current=page]:bg-card aria-[current=page]:text-ink aria-[current=page]:shadow-sm"
                >
                  {view.label}
                </Link>
              ))}
            </nav>
            <CopyLinkButton />
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <PersistScenario />
        <Outlet />
      </main>
      <footer className="border-t border-line/80 px-4 py-6 text-sm text-muted">
        <p className="mx-auto max-w-6xl">
          Estimates only, not financial advice. Returno does not know future rates, returns, fees, tax, or inflation.
          A constant rate is a sketch, not a forecast.
        </p>
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
    <div className="mx-auto max-w-lg rounded-2xl border border-line bg-card px-6 py-10">
      <h1 className="font-display text-3xl">That page is not here</h1>
      <p className="mt-2 text-muted">The calculators live on Savings, Stocks, Compare, and Goal.</p>
      <Link
        to="/savings"
        search={defaultScenario}
        className="mt-6 inline-block font-medium text-savings underline underline-offset-4"
      >
        Open the savings calculator
      </Link>
    </div>
  );
}

function useLeafScenario(): Scenario {
  const search = useRouterState({
    select: (state) => state.matches[state.matches.length - 1]?.search,
  });
  const record = isRecord(search) ? search : {};
  if (Object.keys(record).length === 0) return readStoredScenario() ?? defaultScenario;
  return parseScenario(record);
}

function PersistScenario() {
  const location = useLocation();
  const navigate = useNavigate();
  const search = useRouterState({
    select: (state) => state.matches[state.matches.length - 1]?.search,
  });

  useEffect(() => {
    if (!isRecord(search)) return;
    const scenario = parseScenario(search);
    writeStoredScenario(scenario);
    const pathname = location.pathname;
    if (
      isCalculatorPath(pathname) &&
      (location.searchStr === "" || location.searchStr === "?")
    ) {
      void navigate({ to: pathname, search: scenario, replace: true });
    }
  }, [location.pathname, location.searchStr, navigate, search]);

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
        className={`self-start rounded-full border px-3 py-1 text-sm font-medium sm:self-end ${
          status === "copied"
            ? "border-savings bg-savings text-white"
            : status === "failed"
              ? "border-stocks bg-stocks-soft text-stocks"
              : "border-line bg-card text-savings"
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
          className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm text-white shadow-lg"
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
      <rect width="32" height="32" rx="8" fill="#0f6e62" />
      <path d="M7 22.5h18" stroke="#f4f0e7" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 19.5 13 15l4 3 7-8" stroke="#fffdf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="10" r="1.7" fill="#f3c7a6" />
    </svg>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

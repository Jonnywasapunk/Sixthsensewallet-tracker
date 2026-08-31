import Link from "next/link";
import { logout } from "./login/actions";
import {
  getBalances,
  getFlowTotals,
  getLastUpdated,
  getMovements,
  getWallets,
} from "@/lib/queries";
import { isWindowKey, WINDOWS, type WindowKey } from "@/lib/time-windows";
import {
  addrUrl,
  fmtAmount,
  fmtDateTime,
  fmtUpdatedZones,
  shortAddr,
  txUrl,
} from "@/lib/format";
import { getDict, type Dict, type Locale } from "@/lib/i18n";
import { LanguageToggle } from "@/app/_components/LanguageToggle";
import { WalletManager } from "@/app/_components/WalletManager";
import { refreshNow } from "@/app/actions/refresh";
import { RefreshButton } from "@/app/_components/RefreshButton";
import type { Balance } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // manual "Refresh now" runs the full indexer

const MOVEMENTS_LIMIT = 200;

/** Localised label for a time window. */
function windowLabel(t: Dict, key: WindowKey): string {
  return key === "month" ? t.window_month : key === "week" ? t.window_week : t.window_all;
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{
    w?: string;
    wallet?: string;
    wok?: string;
    werr?: string;
    rok?: string;
    rerr?: string;
  }>;
}) {
  const sp = await searchParams;
  const window: WindowKey = isWindowKey(sp.w) ? sp.w : "all";
  const walletId = sp.wallet && sp.wallet !== "all" ? sp.wallet : undefined;
  const { locale, t } = await getDict();

  const [wallets, balances, totals, movements, lastUpdated] = await Promise.all([
    getWallets(),
    getBalances(walletId),
    getFlowTotals({ window, walletId }),
    getMovements({ window, walletId, limit: MOVEMENTS_LIMIT }),
    getLastUpdated(),
  ]);

  const qp = (over: Record<string, string>) => {
    const p = new URLSearchParams();
    p.set("w", over.w ?? window);
    const wal = over.wallet ?? sp.wallet ?? "all";
    if (wal && wal !== "all") p.set("wallet", wal);
    return `/?${p.toString()}`;
  };

  const exportHref = (() => {
    const p = new URLSearchParams();
    p.set("w", window);
    if (walletId) p.set("wallet", walletId);
    return `/api/export?${p.toString()}`;
  })();

  const banner = feedbackBanner(sp, t);

  return (
    <main className="min-h-screen bg-bg">
      {/* Header */}
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span
              className="logo-mark block h-9 w-9"
              role="img"
              aria-label="Sixth Sense Pay"
            />
            <div>
              <h1 className="font-display text-xl leading-none text-text">
                Sixth Sense Pay
              </h1>
              <p className="text-xs text-text-muted">{t.tagline}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle current={locale as Locale} />
            <form action={logout}>
              <button className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-muted hover:bg-surface-2">
                {t.signOut}
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-6">
        {banner && (
          <div
            className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
              banner.tone === "pos"
                ? "border-pos/30 bg-pos/10 text-pos"
                : "border-neg/30 bg-neg/10 text-neg"
            }`}
          >
            {banner.message}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <nav className="inline-flex rounded-lg border border-border bg-surface p-1">
            {WINDOWS.map((w) => (
              <Link
                key={w.key}
                href={qp({ w: w.key })}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  window === w.key
                    ? "bg-accent text-white"
                    : "text-text-muted hover:bg-surface-2"
                }`}
              >
                {windowLabel(t, w.key)}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <WalletFilter
              wallets={wallets}
              current={sp.wallet ?? "all"}
              window={window}
              t={t}
            />
            <form action={refreshNow}>
              <RefreshButton label={t.refreshNow} pendingLabel={t.refreshing} />
            </form>
            <Link
              href={exportHref}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text hover:bg-surface-2"
              prefetch={false}
            >
              {t.exportCsv}
            </Link>
          </div>
        </div>

        {/* Balances */}
        <section className="mb-8">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
              {t.currentBalances}
            </h2>
            <span className="text-xs text-text-muted">
              {t.lastUpdated}:{" "}
              {lastUpdated ? (
                fmtUpdatedZones(lastUpdated).map((z, i) => (
                  <span key={z.label}>
                    {i > 0 && <span className="text-border"> · </span>}
                    <span className="text-text-muted">{z.label}</span>{" "}
                    <span className="text-text">{z.value}</span>
                  </span>
                ))
              ) : (
                <span className="text-text">{t.never}</span>
              )}
            </span>
          </div>
          <BalancesGrid balances={balances} t={t} />
        </section>

        {/* Flow totals for the window */}
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
            {t.movementTotals} · {windowLabel(t, window)}
          </h2>
          {totals.length === 0 ? (
            <Empty>{t.noMovements}</Empty>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {totals.map((tot) => (
                <div
                  key={tot.asset}
                  className="rounded-xl border border-border bg-surface p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-display text-lg text-text">
                      {tot.asset}
                    </span>
                    <span className="text-xs text-text-muted">
                      {tot.count} {t.txns}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <Row label={t.inbound} value={`+${fmtAmount(tot.inbound)}`} tone="pos" />
                    <Row label={t.outbound} value={`−${fmtAmount(tot.outbound)}`} tone="neg" />
                    <Row label={t.net} value={fmtAmount(tot.net)} strong />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Manage wallets */}
        <WalletManager wallets={wallets} t={t} />

        {/* Movements */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
            {t.movements}{" "}
            <span className="font-normal normal-case">
              ({t.latestLabel} {Math.min(movements.length, MOVEMENTS_LIMIT)})
            </span>
          </h2>
          {movements.length === 0 ? (
            <Empty>{t.noTransfers}</Empty>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-surface">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-muted">
                    <th className="px-4 py-3 font-medium">{t.colWhen}</th>
                    <th className="px-4 py-3 font-medium">{t.colWallet}</th>
                    <th className="px-4 py-3 font-medium">{t.colDir}</th>
                    <th className="px-4 py-3 font-medium">{t.colCounterparty}</th>
                    <th className="px-4 py-3 text-right font-medium">{t.colAmount}</th>
                    <th className="px-4 py-3 font-medium">{t.colAsset}</th>
                    <th className="px-4 py-3 font-medium">{t.colChain}</th>
                    <th className="px-4 py-3 font-medium">{t.colTx}</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr
                      key={`${m.tx_hash}-${m.direction}-${m.counterparty}-${m.amount}`}
                      className="border-b border-border/60 last:border-0 hover:bg-surface-2"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-text-muted">
                        {fmtDateTime(m.block_time)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">{m.wallet_label}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                            m.direction === "in"
                              ? "bg-pos/10 text-pos"
                              : "bg-neg/10 text-neg"
                          }`}
                        >
                          {m.direction === "in" ? t.dirIn : t.dirOut}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <a
                          href={addrUrl(m.chain, m.counterparty)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent-600 hover:underline"
                        >
                          {shortAddr(m.counterparty)}
                        </a>
                      </td>
                      <td
                        className={`whitespace-nowrap px-4 py-3 text-right font-medium ${
                          m.direction === "in" ? "text-pos" : "text-neg"
                        }`}
                      >
                        {m.direction === "in" ? "+" : "−"}
                        {fmtAmount(m.amount)}
                      </td>
                      <td className="px-4 py-3">{m.asset}</td>
                      <td className="px-4 py-3 capitalize">{m.chain}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <a
                          href={txUrl(m.chain, m.tx_hash)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent-600 hover:underline"
                        >
                          {shortAddr(m.tx_hash)}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function feedbackBanner(
  sp: { wok?: string; werr?: string; rok?: string; rerr?: string },
  t: Dict,
): { tone: "pos" | "neg"; message: string } | null {
  if (sp.rok === "1") return { tone: "pos", message: t.refreshDone };
  if (sp.rerr === "1") return { tone: "neg", message: t.refreshErrors };
  if (sp.wok === "added") return { tone: "pos", message: t.walletAdded };
  if (sp.wok === "removed") return { tone: "pos", message: t.walletRemoved };
  if (sp.werr === "exists") return { tone: "neg", message: t.errExists };
  if (sp.werr === "invalid") return { tone: "neg", message: t.errInvalid };
  if (sp.werr === "name") return { tone: "neg", message: t.errName };
  return null;
}

function BalancesGrid({ balances, t }: { balances: Balance[]; t: Dict }) {
  if (balances.length === 0) {
    return <Empty>{t.noBalances}</Empty>;
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {balances
        .slice()
        .sort(
          (a, b) =>
            a.chain.localeCompare(b.chain) || a.asset.localeCompare(b.asset),
        )
        .map((b) => (
          <div
            key={`${b.wallet_id}-${b.asset}`}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <div className="mb-1 text-xs uppercase tracking-wide text-text-muted">
              {b.asset} · <span className="capitalize">{b.chain}</span>
            </div>
            <div className="font-display text-xl text-text">
              {fmtAmount(b.amount)}
            </div>
          </div>
        ))}
    </div>
  );
}

function WalletFilter({
  wallets,
  current,
  window,
  t,
}: {
  wallets: { id: string; label: string }[];
  current: string;
  window: WindowKey;
  t: Dict;
}) {
  // Plain GET form — no client JS needed. Hidden `w` preserves the window.
  return (
    <form method="get" className="flex items-center gap-2">
      <input type="hidden" name="w" value={window} />
      <select
        name="wallet"
        defaultValue={current}
        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text"
      >
        <option value="all">{t.allWallets}</option>
        {wallets.map((w) => (
          <option key={w.id} value={w.id}>
            {w.label}
          </option>
        ))}
      </select>
      <button className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text hover:bg-surface-2">
        {t.apply}
      </button>
    </form>
  );
}

function Row({
  label,
  value,
  tone,
  strong,
}: {
  label: string;
  value: string;
  tone?: "pos" | "neg";
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-muted">{label}</span>
      <span
        className={`${strong ? "font-semibold text-text" : ""} ${
          tone === "pos" ? "text-pos" : tone === "neg" ? "text-neg" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface-2 px-4 py-8 text-center text-sm text-text-muted">
      {children}
    </div>
  );
}

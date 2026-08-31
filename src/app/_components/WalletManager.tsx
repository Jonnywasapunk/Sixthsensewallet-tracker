import { addWallet, deleteWallet } from "@/app/actions/wallets";
import { shortAddr } from "@/lib/format";
import type { Dict } from "@/lib/i18n";
import type { Wallet } from "@/lib/types";

/**
 * Add / remove tracked wallets. Pure server component: the add form and each
 * remove button post to Server Actions. New wallets are picked up by the
 * indexer automatically (STABLES × wallet), with balances loaded on add.
 */
export function WalletManager({
  wallets,
  t,
}: {
  wallets: Wallet[];
  t: Dict;
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
        {t.manageWallets}
      </h2>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Tracked wallets */}
        <div className="rounded-xl border border-border bg-surface p-4">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-text-muted">
            {t.trackedWallets}
          </h3>
          {wallets.length === 0 ? (
            <p className="py-4 text-sm text-text-muted">{t.noWallets}</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {wallets.map((w) => (
                <li
                  key={w.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-text">
                      {w.label}
                    </div>
                    <div className="text-xs text-text-muted">
                      <span className="capitalize">{w.chain}</span> ·{" "}
                      <span className="font-mono">{shortAddr(w.address)}</span>
                    </div>
                  </div>
                  <form action={deleteWallet}>
                    <input type="hidden" name="id" value={w.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-border px-2.5 py-1 text-xs text-neg hover:bg-neg/10"
                    >
                      {t.remove}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Add a wallet */}
        <div className="rounded-xl border border-border bg-surface p-4">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-text-muted">
            {t.addWallet}
          </h3>
          <form action={addWallet} className="space-y-3">
            <div>
              <label
                htmlFor="wm-label"
                className="mb-1 block text-xs font-medium text-text"
              >
                {t.fieldName}
              </label>
              <input
                id="wm-label"
                name="label"
                required
                maxLength={80}
                placeholder={t.fieldNamePlaceholder}
                className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent-050"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label
                  htmlFor="wm-chain"
                  className="mb-1 block text-xs font-medium text-text"
                >
                  {t.fieldChain}
                </label>
                <select
                  id="wm-chain"
                  name="chain"
                  defaultValue="polygon"
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent-050"
                >
                  <option value="polygon">{t.chainPolygon}</option>
                  <option value="tron">{t.chainTron}</option>
                </select>
              </div>
              <div className="col-span-2">
                <label
                  htmlFor="wm-address"
                  className="mb-1 block text-xs font-medium text-text"
                >
                  {t.fieldAddress}
                </label>
                <input
                  id="wm-address"
                  name="address"
                  required
                  placeholder={t.fieldAddressPlaceholder}
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent-050"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-600"
            >
              {t.add}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

import { addCvu, deleteCvu, updateCvuUser } from "@/app/actions/cvus";
import type { Dict } from "@/lib/i18n";
import type { Cvu } from "@/lib/types";

// Default user for new CVUs (can be changed per-row after adding).
const DEFAULT_CVU_USER = "support@sixthsensepay.com";

/**
 * CVUs (Kripton) — a manually managed reference list of virtual accounts.
 * Reference-only: no balances or indexing. Server component; add form and each
 * remove button post to Server Actions. Responsive: table on sm+, cards on
 * mobile (mirrors the movements view).
 */
export function CvuManager({ cvus, t }: { cvus: Cvu[]; t: Dict }) {
  const estadoLabel = (e: string) =>
    e === "Inactiva" ? t.estadoInactiva : t.estadoActiva;
  const estadoActive = (e: string) => e !== "Inactiva";

  return (
    <section className="mb-8">
      <div className="mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          {t.cvusTitle}
        </h2>
        <p className="mt-0.5 text-xs text-text-muted">{t.cvusSubtitle}</p>
      </div>

      {/* List */}
      <div className="mb-4">
        {cvus.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface-2 px-4 py-8 text-center text-sm text-text-muted">
            {t.noCvus}
          </div>
        ) : (
          <>
            {/* Mobile (<sm): cards */}
            <ul className="space-y-2 sm:hidden">
              {cvus.map((c) => (
                <li
                  key={`cc-${c.id}`}
                  className="rounded-xl border border-border bg-surface p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-text">
                      {c.alias}
                    </span>
                    <div className="flex items-center gap-2">
                      <EstadoBadge
                        active={estadoActive(c.estado)}
                        label={estadoLabel(c.estado)}
                      />
                      <form action={deleteCvu}>
                        <input type="hidden" name="id" value={c.id} />
                        <button
                          type="submit"
                          className="rounded-md border border-border px-2 py-0.5 text-xs text-neg hover:bg-neg/10"
                        >
                          {t.remove}
                        </button>
                      </form>
                    </div>
                  </div>
                  <div className="mt-2 font-mono text-xs text-text">{c.cvu}</div>
                  {c.numero && (
                    <div className="mt-1 text-xs text-text-muted">
                      {t.fieldNumero}: {c.numero}
                    </div>
                  )}
                  <div className="mt-2">
                    <label className="mb-1 block text-xs font-medium text-text-muted">
                      {t.fieldUsuario}
                    </label>
                    <EditUserForm id={c.id} usuario={c.usuario} saveLabel={t.save} />
                  </div>
                </li>
              ))}
            </ul>

            {/* >= sm: table */}
            <div className="hidden overflow-x-auto rounded-xl border border-border bg-surface sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-muted">
                    <th className="px-4 py-3 font-medium">{t.fieldAlias}</th>
                    <th className="px-4 py-3 font-medium">{t.fieldCvu}</th>
                    <th className="px-4 py-3 font-medium">{t.fieldNumero}</th>
                    <th className="px-4 py-3 font-medium">{t.fieldEstado}</th>
                    <th className="px-4 py-3 font-medium">{t.fieldUsuario}</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {cvus.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-border/60 last:border-0 hover:bg-surface-2"
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-text">
                        {c.alias}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-text-muted">
                        {c.cvu}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-text-muted">
                        {c.numero ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <EstadoBadge
                          active={estadoActive(c.estado)}
                          label={estadoLabel(c.estado)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <EditUserForm
                          id={c.id}
                          usuario={c.usuario}
                          saveLabel={t.save}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <form action={deleteCvu}>
                          <input type="hidden" name="id" value={c.id} />
                          <button
                            type="submit"
                            className="rounded-md border border-border px-2.5 py-1 text-xs text-neg hover:bg-neg/10"
                          >
                            {t.remove}
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Add a CVU */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-text-muted">
          {t.addCvu}
        </h3>
        <form
          action={addCvu}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6"
        >
          <Field label={t.fieldAlias} className="lg:col-span-1">
            <input
              name="alias"
              required
              maxLength={60}
              className={inputCls}
              placeholder="sense.9"
            />
          </Field>
          <Field label={t.fieldCvu} className="lg:col-span-2">
            <input
              name="cvu"
              required
              inputMode="numeric"
              pattern="\d{22}"
              title="22 dígitos"
              className={`${inputCls} font-mono`}
              placeholder="0000065900001540084xxx"
            />
          </Field>
          <Field label={t.fieldNumero} className="lg:col-span-1">
            <input name="numero" className={inputCls} placeholder="30718…" />
          </Field>
          <Field label={t.fieldUsuario} className="lg:col-span-1">
            <input
              name="usuario"
              type="email"
              defaultValue={DEFAULT_CVU_USER}
              className={inputCls}
              placeholder="user@…"
            />
          </Field>
          <Field label={t.fieldEstado} className="lg:col-span-1">
            <select name="estado" defaultValue="Activa" className={inputCls}>
              <option value="Activa">{t.estadoActiva}</option>
              <option value="Inactiva">{t.estadoInactiva}</option>
            </select>
          </Field>
          <div className="sm:col-span-2 lg:col-span-6">
            <button
              type="submit"
              className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-600 sm:w-auto"
            >
              {t.add}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

const inputCls =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent-050";

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium text-text">{label}</label>
      {children}
    </div>
  );
}

/** Inline per-row editor for the CVU's linked user. Plain form → Server Action,
 *  no client JS; submits the new value and re-renders with a confirmation. */
function EditUserForm({
  id,
  usuario,
  saveLabel,
}: {
  id: string;
  usuario: string | null;
  saveLabel: string;
}) {
  return (
    <form action={updateCvuUser} className="flex items-center gap-1.5">
      <input type="hidden" name="id" value={id} />
      <input
        name="usuario"
        type="email"
        defaultValue={usuario ?? ""}
        placeholder="—"
        className="min-w-0 flex-1 rounded-md border border-border bg-surface-2 px-2 py-1 text-xs text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent-050 sm:w-52 sm:flex-none"
      />
      <button
        type="submit"
        className="whitespace-nowrap rounded-md border border-border px-2 py-1 text-xs text-text-muted hover:bg-surface-2"
      >
        {saveLabel}
      </button>
    </form>
  );
}

function EstadoBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-xs font-medium ${
        active ? "bg-pos/10 text-pos" : "bg-text-muted/10 text-text-muted"
      }`}
    >
      {label}
    </span>
  );
}

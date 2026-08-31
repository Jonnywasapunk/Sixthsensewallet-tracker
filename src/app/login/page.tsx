import { login } from "./actions";
import { getDict } from "@/lib/i18n";
import { LanguageToggle } from "@/app/_components/LanguageToggle";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const sp = await searchParams;
  const hasError = sp.error === "1";
  const next = sp.next ?? "/";
  const { locale, t } = await getDict();

  return (
    <main className="relative min-h-screen grid place-items-center bg-bg px-4">
      <div className="absolute right-4 top-4">
        <LanguageToggle current={locale} />
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          {/* Official SSP isotype, tinted with our accent palette. */}
          <span
            className="logo-mark mx-auto mb-4 block h-14 w-14"
            role="img"
            aria-label="Sixth Sense Pay"
          />
          <h1 className="font-display text-2xl text-text">Sixth Sense Pay</h1>
          <p className="mt-1 text-sm text-text-muted">{t.tagline}</p>
        </div>

        <form
          action={login}
          className="rounded-2xl border border-border bg-surface p-6 shadow-sm"
        >
          <input type="hidden" name="next" value={next} />
          <label
            htmlFor="passcode"
            className="mb-2 block text-sm font-medium text-text"
          >
            {t.passcode}
          </label>
          <input
            id="passcode"
            name="passcode"
            type="password"
            autoComplete="off"
            autoFocus
            required
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent-050"
          />
          {hasError && <p className="mt-2 text-sm text-neg">{t.incorrect}</p>}
          <button
            type="submit"
            className="mt-4 w-full rounded-lg bg-accent px-4 py-2 font-medium text-white transition-colors hover:bg-accent-600"
          >
            {t.enter}
          </button>
        </form>
      </div>
    </main>
  );
}

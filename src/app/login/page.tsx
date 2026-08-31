import { login } from "./actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const sp = await searchParams;
  const hasError = sp.error === "1";
  const next = sp.next ?? "/";

  return (
    <main className="min-h-screen grid place-items-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          {/* Logo slot — drop the vector into /public/logo.svg */}
          <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-accent" aria-hidden />
          <h1 className="font-display text-2xl text-text">Sixth Sense Pay</h1>
          <p className="mt-1 text-sm text-text-muted">Wallet tracker</p>
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
            Passcode
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
          {hasError && (
            <p className="mt-2 text-sm text-neg">Incorrect passcode.</p>
          )}
          <button
            type="submit"
            className="mt-4 w-full rounded-lg bg-accent px-4 py-2 font-medium text-white transition-colors hover:bg-accent-600"
          >
            Enter
          </button>
        </form>
      </div>
    </main>
  );
}

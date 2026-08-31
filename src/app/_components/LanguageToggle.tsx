import { setLocale } from "@/app/actions/i18n";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n";

/**
 * Language switcher. Each option is its own tiny <form> whose action is the
 * setLocale Server Action bound to that locale — no client JS required.
 */
export function LanguageToggle({ current }: { current: Locale }) {
  return (
    <div
      className="inline-flex overflow-hidden rounded-lg border border-border bg-surface"
      role="group"
      aria-label="Language"
    >
      {LOCALES.map((loc: Locale) => {
        const active = loc === current;
        return (
          <form key={loc} action={setLocale.bind(null, loc)}>
            <button
              type="submit"
              aria-pressed={active}
              className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "bg-accent text-white"
                  : "text-text-muted hover:bg-surface-2"
              }`}
            >
              {LOCALE_LABELS[loc]}
            </button>
          </form>
        );
      })}
    </div>
  );
}

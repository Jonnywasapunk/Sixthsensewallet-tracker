import "server-only";
import { cookies } from "next/headers";

// ─────────────────────────────────────────────────────────────────────────────
// Lightweight i18n. The app is entirely server-rendered (force-dynamic), so we
// keep localisation on the server: a `ssp_locale` cookie selects the dictionary,
// a Server Action flips it. No client-side i18n runtime, no extra dependency.
//
// Adding a language = add an entry to DICTS with the same keys.
// ─────────────────────────────────────────────────────────────────────────────

export type Locale = "en" | "es";

export const LOCALE_COOKIE = "ssp_locale";
export const LOCALES: Locale[] = ["es", "en"];
export const DEFAULT_LOCALE: Locale = "es";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  es: "ES",
};

export interface Dict {
  // header / chrome
  tagline: string;
  signOut: string;
  language: string;
  // windows (by WindowKey)
  window_all: string;
  window_month: string;
  window_week: string;
  // filters
  allWallets: string;
  apply: string;
  exportCsv: string;
  refreshNow: string;
  refreshing: string;
  refreshDone: string;
  refreshErrors: string;
  // sections
  currentBalances: string;
  lastUpdated: string;
  never: string;
  movementTotals: string;
  movements: string;
  latestLabel: string; // used as "(latest N)"
  txns: string;
  // flow rows
  inbound: string;
  outbound: string;
  net: string;
  // table headers
  colWhen: string;
  colWallet: string;
  colDir: string;
  colCounterparty: string;
  colAmount: string;
  colAsset: string;
  colChain: string;
  colTx: string;
  dirIn: string;
  dirOut: string;
  // empty states
  noMovements: string;
  noTransfers: string;
  noBalances: string;
  // login
  passcode: string;
  incorrect: string;
  enter: string;
  // wallet manager
  manageWallets: string;
  trackedWallets: string;
  addWallet: string;
  fieldName: string;
  fieldNamePlaceholder: string;
  fieldChain: string;
  fieldAddress: string;
  fieldAddressPlaceholder: string;
  add: string;
  remove: string;
  chainPolygon: string;
  chainTron: string;
  noWallets: string;
  // wallet manager feedback banners
  walletAdded: string;
  walletRemoved: string;
  errExists: string;
  errInvalid: string;
  errName: string;
  // CVUs (Kripton reference accounts)
  cvusTitle: string;
  cvusSubtitle: string;
  cvuList: string;
  addCvu: string;
  fieldAlias: string;
  fieldCvu: string;
  fieldNumero: string;
  fieldUsuario: string;
  fieldEstado: string;
  estadoActiva: string;
  estadoInactiva: string;
  noCvus: string;
  save: string;
  cvuAdded: string;
  cvuRemoved: string;
  cvuUpdated: string;
  cerrAlias: string;
  cerrInvalid: string;
  cerrExists: string;
}

const en: Dict = {
  tagline: "Wallet tracker",
  signOut: "Sign out",
  language: "Language",
  window_all: "All time",
  window_month: "This month",
  window_week: "This week",
  allWallets: "All wallets",
  apply: "Apply",
  exportCsv: "Export CSV",
  refreshNow: "Refresh now",
  refreshing: "Refreshing…",
  refreshDone: "Refresh complete — data is up to date.",
  refreshErrors:
    "Refresh finished with some errors (likely explorer rate limits). Try again in a moment.",
  currentBalances: "Current balances",
  lastUpdated: "Updated",
  never: "never",
  movementTotals: "Movement totals",
  movements: "Movements",
  latestLabel: "latest",
  txns: "txns",
  inbound: "Inbound",
  outbound: "Outbound",
  net: "Net",
  colWhen: "When (UTC)",
  colWallet: "Wallet",
  colDir: "Dir",
  colCounterparty: "Counterparty",
  colAmount: "Amount",
  colAsset: "Asset",
  colChain: "Chain",
  colTx: "Tx",
  dirIn: "IN",
  dirOut: "OUT",
  noMovements: "No movements in this window.",
  noTransfers: "No transfers indexed for this selection yet.",
  noBalances: "No balances recorded yet. Run a refresh to populate.",
  passcode: "Passcode",
  incorrect: "Incorrect passcode.",
  enter: "Enter",
  manageWallets: "Manage wallets",
  trackedWallets: "Tracked wallets",
  addWallet: "Add a wallet",
  fieldName: "Name",
  fieldNamePlaceholder: "e.g. Treasury wallet",
  fieldChain: "Chain",
  fieldAddress: "Address",
  fieldAddressPlaceholder: "0x… (Polygon) or T… (Tron)",
  add: "Add",
  remove: "Remove",
  chainPolygon: "Polygon",
  chainTron: "Tron",
  noWallets: "No wallets tracked yet. Add one below.",
  walletAdded:
    "Wallet added. Balances loaded now; full movement history on the next refresh.",
  walletRemoved: "Wallet removed.",
  errExists: "That wallet is already being tracked.",
  errInvalid: "That address isn’t valid for the selected chain.",
  errName: "Please enter a name for the wallet.",
  cvusTitle: "CVUs (Kripton)",
  cvusSubtitle: "Reference virtual accounts from the PSVA partner (Kripton).",
  cvuList: "CVU list",
  addCvu: "Add a CVU",
  fieldAlias: "Alias",
  fieldCvu: "CVU/CBU",
  fieldNumero: "Number",
  fieldUsuario: "User",
  fieldEstado: "Status",
  estadoActiva: "Active",
  estadoInactiva: "Inactive",
  noCvus: "No CVUs yet. Add one below.",
  save: "Save",
  cvuAdded: "CVU added.",
  cvuRemoved: "CVU removed.",
  cvuUpdated: "User updated.",
  cerrAlias: "Please enter an alias.",
  cerrInvalid: "The CVU/CBU must be 22 digits.",
  cerrExists: "That CVU is already in the list.",
};

const es: Dict = {
  tagline: "Rastreador de billeteras",
  signOut: "Cerrar sesión",
  language: "Idioma",
  window_all: "Todo el tiempo",
  window_month: "Este mes",
  window_week: "Esta semana",
  allWallets: "Todas las billeteras",
  apply: "Aplicar",
  exportCsv: "Exportar CSV",
  refreshNow: "Actualizar ahora",
  refreshing: "Actualizando…",
  refreshDone: "Actualización completa — los datos están al día.",
  refreshErrors:
    "La actualización terminó con algunos errores (probablemente límites del explorador). Inténtalo de nuevo en un momento.",
  currentBalances: "Saldos actuales",
  lastUpdated: "Actualizado",
  never: "nunca",
  movementTotals: "Totales de movimientos",
  movements: "Movimientos",
  latestLabel: "últimos",
  txns: "txns",
  inbound: "Entradas",
  outbound: "Salidas",
  net: "Neto",
  colWhen: "Fecha (UTC)",
  colWallet: "Billetera",
  colDir: "Dir",
  colCounterparty: "Contraparte",
  colAmount: "Monto",
  colAsset: "Activo",
  colChain: "Red",
  colTx: "Tx",
  dirIn: "ENT",
  dirOut: "SAL",
  noMovements: "Sin movimientos en este periodo.",
  noTransfers: "Aún no hay transferencias indexadas para esta selección.",
  noBalances:
    "Aún no hay saldos registrados. Ejecuta una actualización para poblarlos.",
  passcode: "Código de acceso",
  incorrect: "Código incorrecto.",
  enter: "Entrar",
  manageWallets: "Administrar billeteras",
  trackedWallets: "Billeteras rastreadas",
  addWallet: "Agregar una billetera",
  fieldName: "Nombre",
  fieldNamePlaceholder: "p. ej. Billetera de tesorería",
  fieldChain: "Red",
  fieldAddress: "Dirección",
  fieldAddressPlaceholder: "0x… (Polygon) o T… (Tron)",
  add: "Agregar",
  remove: "Eliminar",
  chainPolygon: "Polygon",
  chainTron: "Tron",
  noWallets: "Aún no hay billeteras rastreadas. Agrega una abajo.",
  walletAdded:
    "Billetera agregada. Saldos cargados ahora; historial completo de movimientos en la próxima actualización.",
  walletRemoved: "Billetera eliminada.",
  errExists: "Esa billetera ya está siendo rastreada.",
  errInvalid: "Esa dirección no es válida para la red seleccionada.",
  errName: "Ingresa un nombre para la billetera.",
  cvusTitle: "CVUs (Kripton)",
  cvusSubtitle: "Cuentas virtuales de referencia del socio PSVA (Kripton).",
  cvuList: "Lista de CVUs",
  addCvu: "Agregar un CVU",
  fieldAlias: "Alias",
  fieldCvu: "CVU/CBU",
  fieldNumero: "Número",
  fieldUsuario: "Usuario",
  fieldEstado: "Estado",
  estadoActiva: "Activa",
  estadoInactiva: "Inactiva",
  noCvus: "Aún no hay CVUs. Agrega uno abajo.",
  save: "Guardar",
  cvuAdded: "CVU agregado.",
  cvuRemoved: "CVU eliminado.",
  cvuUpdated: "Usuario actualizado.",
  cerrAlias: "Ingresa un alias.",
  cerrInvalid: "El CVU/CBU debe tener 22 dígitos.",
  cerrExists: "Ese CVU ya está en la lista.",
};

const DICTS: Record<Locale, Dict> = { en, es };

export function isLocale(v: string | null | undefined): v is Locale {
  return v === "en" || v === "es";
}

/** Read the active locale from the request cookie (defaults to English). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const v = store.get(LOCALE_COOKIE)?.value;
  return isLocale(v) ? v : DEFAULT_LOCALE;
}

/** The dictionary for the active locale. */
export async function getDict(): Promise<{ locale: Locale; t: Dict }> {
  const locale = await getLocale();
  return { locale, t: DICTS[locale] };
}

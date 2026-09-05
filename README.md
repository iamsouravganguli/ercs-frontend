# ercs-frontend — Uttarakhand E-Revenue Recovery (Web)

Web client for **Uttarakhand E-Revenue Recovery (ERCS)** — the official portal
for Revenue Recovery, Case Monitoring, and administrative services under the
Revenue Department, Government of Uttarakhand. Talks to the
[ercs-backend](https://github.com/iamsouravganguli/ercs-backend)
Django API over axios (cookie-auth with 401 retry).

Part of the [bor](https://github.com/iamsouravganguli/bor) super-repo
(Docker composition and deploy pipeline live there, not here). Codebase
inherits the structure of
[erccm-frontend](https://github.com/iamsouravganguli/erccm-frontend);
business flows here are recovery-oriented (recovery cases, monitoring,
administrative services), not filing-oriented.

A single plain Next.js app (App Router) at the repo root. No Turborepo,
no monorepo, no `pnpm --filter` — plain `pnpm` commands from root. Import
alias `@/*` maps to the repo root.

Recovery case tracking, monitoring dashboards, administrative services,
notices, payments, grievances, knowledge base, plus a public website —
all in English + Hindi (formal सरकारी) via centralized JSON locales.

## Stack

- Next.js (App Router), React, TypeScript (strict, `noEmit`)
- Tailwind CSS v4 (`@tailwindcss/postcss`), shadcn/ui + Base UI + Radix, `tw-animate-css`
- `@tanstack/react-query`, `axios`, `react-hook-form` + `zod`, Dexie (offline), `jotai`, `use-query-params`
- `react-quill-new` (rich text + voice dictation), `react-hot-toast`
- Node `>=24`, `pnpm` only — never `npm`/`yarn`/`bun`

## Commands

```sh
pnpm install      # install deps
pnpm dev          # next dev — http://localhost:3000
pnpm build        # next build
pnpm start        # next start (prod)
pnpm lint         # eslint --max-warnings 0 (zero tolerance)
pnpm check-types  # tsc --noEmit
pnpm format       # prettier --write "**/*.{ts,tsx,md}"
```

## Env

Create `.env.local` at root (gitignored). Keys used in code:

```sh
NEXT_PUBLIC_API_URL=        # e.g. http://localhost:8000
NEXT_PUBLIC_COOKIE_DOMAIN=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
```

Verify with `cat .env.local`.

## Structure

```
app/                 → App Router routes (identity, case, manage, administrator,
                       action, search, knowledge-base, ...);
                       layout.tsx (fonts, AppProviders), template.tsx (site chrome)
src/lib/             → shared logic: services, query (react-query), api-client
                       (axios), validations, cn
src/components/ui/   → shadcn/ui components incl. data-grid, richtext-field,
                       hindi-keyboard
src/i18n/            → LanguageProvider, TranslationProvider, useTranslation
src/locales/         → en/hi JSON + index.ts
src/providers/       → AppProviders (index.tsx) + individual providers
common/              → shared UI bits        workflows/ → recovery flows, support
utils/ hooks/        → helpers               public/ → static assets
```

Key rules: no hardcoded user-visible strings (all via `useTranslation()` + `src/locales/*.json`, formal Hindi).

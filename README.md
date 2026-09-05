# rccms-client

Revenue Court Case Management System — client. A single plain Next.js 16.1.6 app (App Router) at the repo root. No Turborepo, no monorepo, no `pnpm --filter` — plain `pnpm` commands from root. Import alias `@/*` maps to the repo root.

Case filing/e-filing, hearings, orders with DSC signing, notices, payments, grievances, knowledge base, plus a public website (`template.tsx`) — all in English + Hindi (formal सरकारी) via centralized JSON locales. Talks to the `rccms-api` Django backend over axios (`apiClient`, cookie-auth with 401 retry).

## Stack

- Next.js 16.1.6 (App Router), React 19, TypeScript (strict, `noEmit`)
- Tailwind CSS v4 (`@tailwindcss/postcss`), shadcn/ui + Base UI + Radix, `tw-animate-css`
- `@tanstack/react-query`, `axios`, `react-hook-form` + `zod`, Dexie (offline), `jotai`, `use-query-params`
- `react-quill-new` (rich text + voice dictation), `react-hot-toast`
- Node `>=24`, `pnpm@10.15.0` only — never `npm`/`yarn`/`bun`

## Commands

```sh
pnpm install      # install deps (ask before installing — installs are restricted)
pnpm dev          # next dev — http://localhost:3000
pnpm build        # next build
pnpm start        # next start (prod)
pnpm lint         # eslint --max-warnings 0 (zero tolerance)
pnpm check-types  # tsc --noEmit
pnpm format       # prettier --write "**/*.{ts,tsx,md}"
```

Note: `next.config.ts` sets `typescript.ignoreBuildErrors:true`, so `pnpm build` can pass with type errors — always trust `pnpm check-types` instead.

## Env

No `.env.example` in repo — create `.env.local` at root (gitignored). Keys used in code:

```sh
NEXT_PUBLIC_API_URL=        # e.g. http://localhost:8000
NEXT_PUBLIC_COOKIE_DOMAIN=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
```

Verify with `cat .env.local`.

## Structure

```
app/                 → App Router routes (identity, case, manage, administrator,
                       action, dsc-test, search, knowledge-base, ...);
                       layout.tsx (fonts, AppProviders), template.tsx (site chrome)
src/lib/             → shared logic: services, query (react-query), api-client
                       (axios), dsc-sdk / dsc.service / dsc-signer, db (Dexie),
                       court-master, validations, cn
src/components/ui/   → shadcn/ui components incl. data-grid, richtext-field,
                       hindi-keyboard
src/i18n/            → LanguageProvider, TranslationProvider, useTranslation
src/locales/         → en/hi JSON (common, auth, case, admin, public) + index.ts
src/providers/       → AppProviders (index.tsx) + individual providers
src/hooks/ src/styles/ → shared hooks, globals.css (Tailwind tokens)
common/              → shared UI bits        workflows/ → e-file, file-upload, support
utils/ hooks/        → helpers               public/ → static assets
```

Key rules: no hardcoded user-visible strings (all via `useTranslation()` + `src/locales/*.json`, formal Hindi); DSC device/cert IDs are 1-based (`src/lib/dsc-sdk.ts`).

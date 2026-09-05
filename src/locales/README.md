# locales — split translation source

Original `translation.json` (217KB, 1406 pairs) is now split into 5 domain files. `index.ts` deep-merges them — `t("brand.title")`, `t("case.payments.title")` etc. paths are **unchanged**.

| File          | Keys | Pairs | Domain                                                                 | When to edit                          |
| ------------- | ---- | ----- | ---------------------------------------------------------------------- | ------------------------------------- |
| `common.json` | 28   | 487   | Shared UI: brand, header, hero, table, form, common, faq, announcement | Generic UI, layout, shared components |
| `auth.json`   | 28   | 160   | Identity: signin, signup, otp, password\_\*, captcha                   | Login / signup / OTP flows            |
| `case.json`   | 3    | 480   | Case domain: `case.*`, `land.*`, `citizen.*`                           | e-Filing, land, parties               |
| `admin.json`  | 11   | 245   | Court/Admin: court_menu, administrator, support, payments              | Admin, court, RBAC, payments          |
| `public.json` | 2    | 34    | Public: contact, privacy_policy                                        | Static public pages                   |

**Adding a new key:**

1. Pick file by domain above (unsure → `common.json`).
2. Add `{ "en": "...", "hi": "शुद्ध सरकारी हिंदी" }` under correct nesting. Always both `en` + `hi`.
3. Use `t("your.key.path")` — no code change to `LanguageProvider` needed.

**How it works:** `index.ts` deep-merges 5 JSON files into single `translation` object. `LanguageProvider.tsx` imports from `./locales`, not from a single JSON. Do NOT recreate `translation.json`.

**Validation:** `python3 -c "import json,pathlib; ...merged==original..."` — merged must be deep-equal to sum of parts. No duplicate top-level keys across files.

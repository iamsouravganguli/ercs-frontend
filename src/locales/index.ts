import admin from "./admin.json";
import auth from "./auth.json";
import caseData from "./case.json";
import common from "./common.json";
import pub from "./public.json";


function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function isTranslationLeaf(v: unknown): boolean {
  return (
    isPlainObject(v) &&
    Object.keys(v as object).length === 2 &&
    "en" in (v as Record<string, unknown>) &&
    "hi" in (v as Record<string, unknown>) &&
    typeof (v as Record<string, unknown>).en === "string" &&
    typeof (v as Record<string, unknown>).hi === "string"
  );
}

function deepMerge(
  ...objs: Record<string, unknown>[]
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const obj of objs) {
    for (const [k, v] of Object.entries(obj)) {
      if (isTranslationLeaf(v)) {
        out[k] = v;
      } else if (isPlainObject(v) && isPlainObject(out[k])) {
        out[k] = deepMerge(
          out[k] as Record<string, unknown>,
          v as Record<string, unknown>,
        );
      } else if (isPlainObject(v) && !out[k]) {
        out[k] = deepMerge({}, v as Record<string, unknown>);
      } else {
        out[k] = v;
      }
    }
  }
  return out;
}

export const translation = deepMerge(
  common as Record<string, unknown>,
  auth as Record<string, unknown>,
  caseData as Record<string, unknown>,
  admin as Record<string, unknown>,
  pub as Record<string, unknown>,
) as typeof common & typeof auth & typeof caseData & typeof admin & typeof pub;

export default translation;

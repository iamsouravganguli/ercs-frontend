"use client";
import { CheckCircle2, Eye, Pencil, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EntityStatusBadge } from "../entity-status-badge";
import { useTranslation } from "@/i18n";
import type { PartyDetail } from "@/lib";

const CLAIMANT_CODES = [
  "CIT_PLAINTIFF",
  "CIT_APPELLANT",
  "CIT_REVISIONIST",
  "CIT_PETITIONER",
] as const;
const isClaimant = (code?: string | null) =>
  !!code && (CLAIMANT_CODES as readonly string[]).includes(code);


export type PartyTableProps = {
  parties: PartyDetail[];
  isSubmitted?: boolean;
  onAdd?: () => void;
  onView?: (p: PartyDetail) => void;
  onEdit?: (p: PartyDetail) => void;
  onDelete?: (id: string | number) => void;
  onVerify?: (p: PartyDetail) => void;
  title?: string;
  addLabel?: string;
  emptyText?: string;
};

export function PartyTable({
  parties,
  isSubmitted,
  onAdd,
  onView,
  onEdit,
  onDelete,
  onVerify,
  title,
  addLabel,
  emptyText,
}: PartyTableProps) {
  const { t, lang } = useTranslation();

  return (
    <Card className="py-0! gap-0! overflow-hidden border border-zinc-100 dark:border-zinc-800 rounded-xl bg-card">
      <CardHeader className="px-4 sm:px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-sm font-semibold text-foreground">
            {title ?? t("case.parties.registered_parties")}
          </CardTitle>
          {onAdd && (
            <Button
              size="sm"
              variant="outline"
              onClick={onAdd}
              className="shrink-0 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800"
              disabled={isSubmitted}
            >
              <Pencil className="w-4 h-4 mr-2 hidden" />
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 flex items-center justify-center">
                  +
                </span>
                {addLabel ?? t("case.parties.add_btn")}
              </span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        {parties.length === 0 ? (
          <div className="py-20 text-center space-y-4 bg-background border border-dashed rounded-2xl m-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {emptyText ?? t("case.parties.no_parties")}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="hidden md:block min-w-full align-middle">
              <table className="min-w-full divide-y divide-border text-left">
                <tbody className="divide-y divide-border bg-card">
                  {parties.map((p) => {
                    const isClaimantParty = isClaimant(
                      p.party_type_detail?.code,
                    );
                    const code = p.party_type_detail?.code || "";
                    const isGovt =
                      code.includes("STATE") || code.includes("GAON_SABHA");
                    const isAdv = code.startsWith("ADV_");
                    const avatarBg = isClaimantParty
                      ? "bg-indigo-600 text-white dark:bg-indigo-500 dark:text-white"
                      : isGovt
                        ? "bg-emerald-500 text-white dark:bg-emerald-600 dark:text-white"
                        : isAdv
                          ? "bg-violet-500 text-white dark:bg-violet-600 dark:text-white"
                          : "bg-orange-500 text-white dark:bg-orange-600 dark:text-white";
                    const initial = p.full_name
                      ? p.full_name.charAt(0).toUpperCase()
                      : "?";
                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-muted/5 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${avatarBg} shrink-0`}
                            >
                              {initial}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-semibold text-foreground truncate">
                                  {p.full_name ||
                                    t("case.parties.unnamed_party")}
                                </p>
                                {p.is_phone_verified && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                )}
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[200px]">
                                {p.relation_type_detail
                                  ? `${lang === "hi" ? p.relation_type_detail.name || p.relation_type_detail.name_en : p.relation_type_detail.name_en || p.relation_type_detail.name}: ${p.relation_name}`
                                  : t("case.parties.individual_org")}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold leading-none border shrink-0 ${
                              isClaimantParty
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20"
                                : isGovt
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
                                  : isAdv
                                    ? "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20"
                                    : "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/20"
                            }`}
                          >
                            {lang === "hi"
                              ? p.party_type_detail?.name ||
                                p.party_type_detail?.name_en ||
                                "UNKNOWN"
                              : p.party_type_detail?.name_en ||
                                p.party_type_detail?.name ||
                                "UNKNOWN"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                          {p.contact_phone ? (
                            <p className="font-medium text-foreground">
                              {p.contact_phone}
                            </p>
                          ) : (
                            <p className="text-muted-foreground">—</p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <EntityStatusBadge detail={p.status_detail as any} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            {p.status_detail?.code === "PARTY_PENDING" &&
                              isClaimant(p.party_type_detail?.code) &&
                              onVerify && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs font-semibold border-amber-500/30 hover:border-amber-500/60 text-amber-600 dark:text-amber-400 hover:bg-amber-500/5 dark:hover:bg-amber-500/10 px-2.5 rounded-lg transition-all shadow-sm shrink-0 animate-pulse"
                                  onClick={() => onVerify(p)}
                                  title="Verify OTP"
                                >
                                  {t("case.parties.verify_btn")}
                                </Button>
                              )}
                            <div className="flex items-center gap-0.5">
                              {onView && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-muted"
                                  onClick={() => onView(p)}
                                  title="View Party"
                                >
                                  <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                </Button>
                              )}
                              {!isSubmitted && onEdit && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-muted"
                                  onClick={() => onEdit(p)}
                                  title="Edit Party"
                                >
                                  <Pencil className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                </Button>
                              )}
                              {!isSubmitted && onDelete && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                  onClick={() => onDelete(p.id)}
                                  title="Delete Party"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="block md:hidden bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800 border-y border-zinc-100 dark:border-zinc-800">
              {parties.map((p) => {
                const isClaimantParty = isClaimant(p.party_type_detail?.code);
                const codeM = p.party_type_detail?.code || "";
                const isGovtM =
                  codeM.includes("STATE") || codeM.includes("GAON_SABHA");
                const isAdvM = codeM.startsWith("ADV_");

                const avatarBg = isClaimantParty
                  ? "bg-indigo-600 text-white"
                  : isGovtM
                    ? "bg-emerald-500 text-white"
                    : isAdvM
                      ? "bg-violet-500 text-white"
                      : "bg-orange-500 text-white";
                const initial = p.full_name
                  ? p.full_name.charAt(0).toUpperCase()
                  : "?";
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 px-3 py-3 bg-white dark:bg-zinc-900"
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] ${avatarBg} shrink-0`}>
                      {initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground leading-tight line-clamp-2 break-words">
                        {p.full_name || t("case.parties.unnamed_party")}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {lang === "hi"
                          ? p.party_type_detail?.name ||
                            p.party_type_detail?.name_en ||
                            "UNKNOWN"
                          : p.party_type_detail?.name_en ||
                            p.party_type_detail?.name ||
                            "UNKNOWN"}
                      </p>
                    </div>
                    <EntityStatusBadge detail={p.status_detail as any} className="shrink-0 scale-90 origin-right" />
                    <div className="flex items-center gap-0.5 shrink-0 -mr-1">
                      {onView && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onView(p)}>
                          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                      )}
                      {!isSubmitted && onEdit && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(p)}>
                          <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                      )}
                      {!isSubmitted && onDelete && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => onDelete(p.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {p.status_detail?.code === "PARTY_PENDING" &&
                        isClaimant(p.party_type_detail?.code) &&
                        onVerify && (
                          <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 rounded-full border-amber-200 text-amber-700" onClick={() => onVerify(p)}>
                            {t("case.parties.verify_btn")}
                          </Button>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

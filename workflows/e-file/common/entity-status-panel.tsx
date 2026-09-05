"use client";
import { Button } from "@/components/ui/button";
import { CustomComboboxField } from "@/components/ui/custom-combobox-field";
import { getLabel } from "@/lib";
import { useTranslation } from "@/i18n";
import type { Control, FieldValues, Path } from "react-hook-form";

type Props<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  title: string;
  currentStatusDetail?: { name: string; name_en: string } | null;
  statusList: any;
  isUpdating: boolean;
  onUpdate: () => void;
  existingCode?: string | null;
  watchCode: string;
};

export function EntityStatusPanel<T extends FieldValues>({ control, name, title, statusList, isUpdating, onUpdate, existingCode, watchCode }: Props<T>) {
  const { lang, t } = useTranslation();
  const rows: any[] = (statusList?.data?.result?.data as any[]) ?? (statusList?.result?.data as any[]) ?? (Array.isArray(statusList?.data) ? statusList.data : []) ?? [];
  const isLoading = statusList?.isLoading ?? false;
  return (
    <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">{title}</div>
      <div className="p-6 space-y-3">
        <CustomComboboxField control={control as any} name={name as any} label="" placeholder={t("case.land_form.fields.status.placeholder") as string} loading={isLoading} options={rows.map((s: any) => ({ label: getLabel(s, lang), value: s.code }))} />
        {watchCode !== existingCode && (
          <div className="flex justify-start">
            <Button onClick={onUpdate} disabled={isUpdating} className="shrink-0 h-8 px-5 text-sm">{isUpdating ? "Updating..." : "Update"}</Button>
          </div>
        )}
      </div>
    </section>
  );
}

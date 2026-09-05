"use client";
import { useVillage } from '@/lib/query';
import { ComboboxField } from "@/components/ui/combobox-field";
import { useFormContext, useWatch } from "react-hook-form";
import { AddressForm } from "./types";
import { resetBelowPargana } from "./address-reset";

export const ParganaField = () => {
  const { control, setValue } = useFormContext<AddressForm>();

  const tehsilCodeCensus = useWatch({
    control,
    name: "tehsil_code_census",
  });

  const { data: parganas = [], isLoading } = useVillage(tehsilCodeCensus || "");

  return (
    <ComboboxField
      control={control}
      name="pargana_name"
      label="परगना / Pargana"
      placeholder="परगना चुनें"
      loading={isLoading}
      disabled={!tehsilCodeCensus}
      options={parganas.map((p) => ({
        label: `${p.pargana_name} (${p.pargana_code_new})`,
        value: p.pargana_code_new,
      }))}
      onValueChange={(value) => {
        const item = parganas.find((p) => p.pargana_code_new === value);

        setValue("pargana_code", item?.pargana_code_new ?? "");
        setValue("pargana_name", item?.pargana_name ?? "");

        resetBelowPargana(setValue);
      }}
    />
  );
};

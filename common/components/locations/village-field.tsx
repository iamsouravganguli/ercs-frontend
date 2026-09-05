"use client";
import { useVillage } from '@/lib/query';
import { ComboboxField } from "@/components/ui/combobox-field";
import { useFormContext, useWatch } from "react-hook-form";
import { AddressForm } from "./types";
import { resetBelowVillage } from "./address-reset";

export const VillageField = () => {
  const { control, setValue } = useFormContext<AddressForm>();
  const tehsilCodeCensus = useWatch({
    control,
    name: "tehsil_code_census",
  });
  const { data: villages = [], isLoading } = useVillage(tehsilCodeCensus || "");
  return (
    <ComboboxField
      control={control}
      name="village_name"
      label="परगना / Pargana"
      placeholder="परगना चुनें"
      loading={isLoading}
      disabled={!tehsilCodeCensus}
      options={villages.map((p) => ({
        label: `${p.vname}`,
        value: p.village_code_census,
      }))}
      onValueChange={(value) => {
        const item = villages.find((p) => p.village_code_census === value);
        setValue("village_code_census", item?.village_code_census ?? "");
        setValue("village_name", item?.vname ?? "");
        resetBelowVillage(setValue);
      }}
    />
  );
};

"use client";
import { useVillage } from '@/lib/query';
import { ComboboxField } from "@/components/ui/combobox-field";
import { useFormContext, useWatch } from "react-hook-form";
import { AddressForm } from "./types";
import { resetBelowRicircle } from "./address-reset";

export const RicircleField = () => {
  const { control, setValue } = useFormContext<AddressForm>();
  const tehsilCodeCensus = useWatch({
    control,
    name: "tehsil_code_census",
  });
  const { data: ricircles = [], isLoading } = useVillage(
    tehsilCodeCensus || "",
  );
  return (
    <ComboboxField
      control={control}
      name="ricircle_name"
      label="परगना / Pargana"
      placeholder="परगना चुनें"
      loading={isLoading}
      disabled={!tehsilCodeCensus}
      options={ricircles.map((p) => ({
        label: `${p.ricircle_name}`,
        value: p.ricircle_code,
      }))}
      onValueChange={(value) => {
        const item = ricircles.find((p) => p.ricircle_code === value);
        setValue("ricircle_code", item?.ricircle_code ?? "");
        setValue("ricircle_name", item?.ricircle_name ?? "");
        resetBelowRicircle(setValue);
      }}
    />
  );
};

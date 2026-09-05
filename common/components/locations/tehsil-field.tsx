"use client";

import { useTehsil } from '@/lib/query';
import { ComboboxField } from "@/components/ui/combobox-field";
import { useFormContext, useWatch } from "react-hook-form";
import { AddressForm } from "./types";
import { resetBelowTehsil } from "./address-reset";

export const TehsilField = () => {
  const { control, setValue } = useFormContext<AddressForm>();


  const districtCode = useWatch({
    control,
    name: "district_code_census",
  });


  const { data: tehsils = [], isLoading } = useTehsil(districtCode || "");

  return (
    <ComboboxField
      control={control}
      name="tehsil_name"
      label="तहसील / Tehsil"
      placeholder="तहसील चुनें"
      loading={isLoading}
      disabled={!districtCode}
      options={tehsils.map((t) => ({
        label: t.tehsil_name,
        value: t.tehsil_code_census,
      }))}
      onValueChange={(value) => {
        const item = tehsils.find((t) => t.tehsil_code_census === value);


        setValue("tehsil_code_census", item?.tehsil_code_census ?? "");
        setValue("tehsil_name", item?.tehsil_name ?? "");
        setValue("tehsil_name_en", item?.tehsil_name_en ?? "");


        resetBelowTehsil(setValue);
      }}
    />
  );
};

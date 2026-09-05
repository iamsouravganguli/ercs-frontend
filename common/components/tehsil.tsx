"use client";
import * as React from "react";
import { useTehsil } from '@/lib/query';
import { ComboboxField } from "@/components/ui/combobox-field";
import { useFormContext, useWatch } from "react-hook-form";
import { AddressForm } from "./locations/types";

export const TehsilField = () => {
  const { control, setValue } = useFormContext<AddressForm>();
  const districtCode = useWatch({ control, name: "district_code_census" });
  const { data: tehsils = [], isLoading } = useTehsil(districtCode ?? "");

  const resetDownstream = () => {
    setValue("pargana_code", "");
    setValue("pargana_name", "");
    setValue("ricircle_code", "");
    setValue("ricircle_name", "");
    setValue("rsicircle_code", "");
    setValue("rsicircle_name", "");
    setValue("village_code_census", "");
    setValue("village_name", "");
  };

  return (
    <ComboboxField
      control={control}
      name="tehsil_name"
      label="तहसील / Tehsil"
      placeholder="तहसील चुनें"
      disabled={!districtCode || isLoading}
      isLoading={isLoading}
      filterMode="client"
      onValueChange={(value) => {
        const item = tehsils.find((t) => t.tehsil_code_census === value);
        setValue("tehsil_code_census", item?.tehsil_code_census ?? "");
        setValue("tehsil_name", item?.tehsil_name ?? "");
        resetDownstream();
      }}
      options={tehsils.map((t) => ({
        label: t.tehsil_name,
        value: t.tehsil_code_census,
      }))}
    />
  );
};

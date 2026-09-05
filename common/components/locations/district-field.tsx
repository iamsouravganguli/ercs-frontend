"use client";

import { useDistrict } from '@/lib/query';
import { useFormContext, useWatch } from "react-hook-form";
import { AddressForm } from "./types";
import { ComboboxField } from "@/components/ui/combobox-field";
import { resetBelowDistrict } from "./address-reset";

export const DistrictField = () => {
  const { control, setValue } = useFormContext<AddressForm>();

  const mandalCode = useWatch({
    control,
    name: "mandal_code",
  });

  const { data: districts = [], isLoading } = useDistrict("");

  return (
    <ComboboxField
      control={control}
      name="district_name"
      label="जिला / District"
      placeholder="जिला चुनें"
      loading={isLoading}
      disabled={!mandalCode}
      options={districts.map((d) => ({
        label: d.district_name,
        value: d.district_code_census,
      }))}
      onValueChange={(value) => {
        const item = districts.find((d) => d.district_code_census === value);

        setValue("district_code_census", item?.district_code_census ?? "");
        setValue("district_name", item?.district_name ?? "");

        resetBelowDistrict(setValue);
      }}
    />
  );
};

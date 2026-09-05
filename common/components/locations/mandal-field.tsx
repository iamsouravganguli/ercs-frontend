"use client";
import { useMandal } from '@/lib/query';
import { useFormContext } from "react-hook-form";
import { AddressForm } from "./types";
import { ComboboxField } from "@/components/ui/combobox-field";
import { resetBelowMandal } from "./address-reset";

export const MandalField = () => {
  const { control, setValue } = useFormContext<AddressForm>();
  const { data: mandals = [], isLoading } = useMandal();

  return (
    <ComboboxField
      control={control}
      name="mandal_name"
      label="मंडल / Mandal"
      placeholder="मंडल चुनें"
      loading={isLoading}
      options={mandals.map((m) => ({
        label: m.mandal_name,
        value: m.mandal_code,
      }))}
      onValueChange={(value) => {
        const item = mandals.find((m) => m.mandal_code === value);
        setValue("mandal_code", item?.mandal_code ?? "");
        setValue("mandal_name", item?.mandal_name ?? "");
        resetBelowMandal(setValue);
      }}
    />
  );
};

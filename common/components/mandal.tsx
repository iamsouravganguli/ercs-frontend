"use client";
import * as React from "react";
import { useMandal } from '@/lib/query';
import { SelectField } from "@/components/ui/select-field";
import { useFormContext } from "react-hook-form";

type AddressForm = {
  state_code_census: string | null;
  mandal_code: string | null;
  mandal_name: string | null;
  district_code_census: string | null;
  district_name: string | null;
  tehsil_code_census: string | null;
  tehsil_name: string | null;
  pargana_code: string | null;
  pargana_name: string | null;
  ricircle_code: string | null;
  ricircle_name: string | null;
  rsicircle_code: string | null;
  rsicircle_name: string | null;
  village_code_census: string | null;
  village_name: string | null;
};

export const MandalField = () => {
  const { control, setValue } = useFormContext<AddressForm>();
  const { data: mandals = [], isLoading } = useMandal();

  const resetDownstream = () => {
    setValue("district_code_census", null);
    setValue("district_name", null);
    setValue("tehsil_code_census", null);
    setValue("tehsil_name", null);
    setValue("pargana_code", null);
    setValue("pargana_name", null);
    setValue("ricircle_code", null);
    setValue("ricircle_name", null);
    setValue("rsicircle_code", null);
    setValue("rsicircle_name", null);
    setValue("village_code_census", null);
    setValue("village_name", null);
  };

  return (


    <div>jhhh</div>
  );
};

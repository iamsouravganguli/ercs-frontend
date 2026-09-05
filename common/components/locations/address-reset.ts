import { UseFormSetValue } from "react-hook-form";
import { AddressForm } from "./types";

export const resetBelowMandal = (setValue: UseFormSetValue<AddressForm>) => {
  setValue("district_code_census", "");
  setValue("district_name", "");
  resetBelowDistrict(setValue);
};

export const resetBelowDistrict = (setValue: UseFormSetValue<AddressForm>) => {
  setValue("tehsil_code_census", "");
  setValue("tehsil_name", "");
  resetBelowTehsil(setValue);
};

export const resetBelowTehsil = (setValue: UseFormSetValue<AddressForm>) => {
  setValue("pargana_code", "");
  setValue("pargana_name", "");
  setValue("ricircle_code", "");
  setValue("ricircle_name", "");
  setValue("rsicircle_code", "");
  setValue("rsicircle_name", "");
  setValue("village_code_census", "");
  setValue("village_name", "");
};
export const resetBelowPargana = (setValue: UseFormSetValue<AddressForm>) => {
  setValue("ricircle_code", "");
  setValue("ricircle_name", "");
  setValue("rsicircle_code", "");
  setValue("rsicircle_name", "");
  setValue("village_code_census", "");
  setValue("village_name", "");
};
export const resetBelowVillage = (setValue: UseFormSetValue<AddressForm>) => {};
export const resetBelowRicircle = (setValue: UseFormSetValue<AddressForm>) => {
  setValue("rsicircle_code", "");
  setValue("rsicircle_name", "");
};
export const resetBelowRsicircle = (
  setValue: UseFormSetValue<AddressForm>,
) => {};

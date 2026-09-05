"use client";

import * as React from "react";
import { useDistrict } from '@/lib/query';
import { useFormContext, useWatch } from "react-hook-form";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
  ComboboxItem,
} from "@/components/ui/combobox";

type AddressForm = {
  mandal_code: string | null;
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

export const DistrictField = () => {
  const { control, setValue } = useFormContext<AddressForm>();
  const [query, setQuery] = React.useState("");
  const mandalCode = useWatch({ control, name: "mandal_code" });
  const currentDistrictName = useWatch({ control, name: "district_name" });

  const { data: districts = [] } = useDistrict("5");


  const resetDownstream = React.useCallback(() => {
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
  }, [setValue]);


  const handleValueChange = (value: string) => {
    const selectedDistrict = districts.find((d) => d.district_name === value);

    if (selectedDistrict) {
      setValue("district_code_census", selectedDistrict.district_code_census);
      setValue("district_name", selectedDistrict.district_name);
      resetDownstream();
    } else {

      setValue("district_code_census", null);
      setValue("district_name", null);
      resetDownstream();
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">जिला / District</label>
      <Combobox
        items={districts.map((d) => d.district_name)}
        value={currentDistrictName || ""}
      >
        <ComboboxInput placeholder="जिला चुनें" showClear />
        <ComboboxContent>
          <ComboboxEmpty>कोई जिला नहीं मिला / No districts found</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
};

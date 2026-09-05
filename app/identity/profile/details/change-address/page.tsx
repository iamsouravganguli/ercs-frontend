"use client";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useTranslation } from "@/i18n";
import { AddressUpdateSchema } from "./validations";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ChangeAddressService } from "./services";
import { useRouter } from "next/navigation";
import { ChangeAddressResponse } from "./types";
import toast from "react-hot-toast";
import { applyBackendErrors } from '@/lib/form-error';
import { useProfileDetail } from '@/lib/query';
import { MandalField } from "@/common/components/locations/mandal-field";
import { DistrictField } from "@/common/components/locations/district-field";
import { TehsilField } from "@/common/components/locations/tehsil-field";
import { ParganaField } from "@/common/components/locations/pargana-filed";
import { VillageField } from "@/common/components/locations/village-field";
import { RicircleField } from "@/common/components/locations/ricircle-filed";

export default function ChangeAddressPage() {
  const profile = useProfileDetail();
  const router = useRouter();

  const { t } = useTranslation();

  const form = useForm<z.infer<typeof AddressUpdateSchema>>({
    resolver: zodResolver(AddressUpdateSchema) as any,
    values: {
      mandal_code: profile.data?.result?.data.mandal_code ?? "",
      mandal_name: profile.data?.result?.data.mandal_name ?? "",
      district_code_census:
        profile.data?.result?.data.district_code_census ?? "",
      district_name: profile.data?.result?.data.district_name ?? "",
      tehsil_code_census: profile.data?.result?.data.tehsil_code_census ?? "",
      tehsil_name: profile.data?.result?.data.tehsil_name ?? "",
      pargana_code: profile.data?.result?.data.pargana_code ?? "",
      pargana_name: profile.data?.result?.data.pargana_name ?? "",
      ricircle_code: profile.data?.result?.data.ricircle_code ?? "",
      ricircle_name: profile.data?.result?.data.ricircle_name ?? "",
      rsicircle_code: profile.data?.result?.data.rsicircle_code ?? "",
      rsicircle_name: profile.data?.result?.data.rsicircle_name ?? "",
      village_code_census: profile.data?.result?.data.village_code_census ?? "",
      village_name: profile.data?.result?.data.village_name ?? "",
    },
    mode: "onChange",
  });

  const ChangeAddressMutation = useMutation({
    mutationKey: ["CHANGE_ADDRESS"],
    mutationFn: ChangeAddressService,

    onSuccess: (res) => {
      toast.success(res.message);
      form.reset();
      profile.refetch();
      if (window.opener) {
        window.opener.postMessage("REFRESH_PROFILE", "*");
        window.close();
      } else {
        router.replace("/identity/profile/details");
      }
    },

    onError: (err: ChangeAddressResponse) => {
      applyBackendErrors(form, err.errors, err.message);
    },
  });

  const onSubmit = (data: any) => {


    console.log("Cleaned Payload:", data);
  };

  return (
    <div className="flex items-center justify-center sm:px-4 sm:py-10">
      <div className="w-full sm:max-w-lg">
        <Card>
          <div className="flex flex-col items-center text-center px-4 sm:px-6 pt-8">
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("change_email.title")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("change_email.subtitle")}
            </p>
          </div>

          <CardContent className="px-4 sm:px-6 pt-6 pb-8">
            <Form {...form}>
              <form
                autoComplete="off"
                className="space-y-4"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <MandalField />
                <DistrictField />
                <TehsilField />
                <ParganaField />
                <VillageField />
                <RicircleField />

                <Button
                  type="submit"
                  className="w-full h-10 mt-2"
                  disabled={ChangeAddressMutation.isPending}
                >
                  {ChangeAddressMutation.isPending
                    ? t("common_button.saving.label")
                    : t("common_button.change.label")}
                </Button>
                <Button
                  type="button"
                  className="w-full h-10 mt-2"
                  disabled={ChangeAddressMutation.isPending}
                  onClick={() => {
                    if (window.opener) {
                      window.close();
                    } else {
                      router.push("/identity/profile/details");
                    }
                  }}
                  variant={"outline"}
                >
                  {t("common_button.cancel.label")}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

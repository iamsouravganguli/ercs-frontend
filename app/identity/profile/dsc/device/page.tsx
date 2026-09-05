"use client";
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "@/i18n";
import { Form } from "@/components/ui/form";
import { SelectField } from "@/components/ui/select-field";
import { dscSchema } from "./validations";
import { getDSC, resetDSC } from '@/lib/dsc.service';
import { mapToOptions } from '@/lib/utils';
import { useDSCCertificates, useDSCDevices } from '@/lib/query';
import { useMutation } from "@tanstack/react-query";
import { DSCService } from "./services";
import { DSCApiResponse } from "./types";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";

export default function AddDSCDevice() {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    getDSC();
    return () => {
      resetDSC();
    };
  }, []);

  const form = useForm<z.input<typeof dscSchema>>({
    resolver: zodResolver(dscSchema) as any,
    defaultValues: {
      device_id: undefined,
      cert_id: undefined,
    },
    mode: "all",
  });

  const deviceId = form.watch("device_id");

  useEffect(() => {
    form.resetField("cert_id");
  }, [deviceId, form]);

  const deviceList = useDSCDevices();
  const certificateList = useDSCCertificates(deviceId as number | undefined);

  const deviceOptions = mapToOptions(deviceList.data ?? [], {
    label: (d) => `${d.label} — ${d.manufacturer}`,
    value: (d) => d.device_id,
  });

  const certOptions = mapToOptions(certificateList.data ?? [], {
    label: (c) => c.subject ?? "Unknown Certificate",
    value: (c) => c.cert_id,
  });

  const certId = form.watch("cert_id");
  const selectedCertificate = certificateList.data?.find(
    (c) => c.cert_id === certId,
  );

  const DSCMutation = useMutation({
    mutationKey: ["DSC_BIND"],
    mutationFn: DSCService,
    onSuccess: (res: DSCApiResponse) => {
      toast.success(res?.message);
      if (window.opener) {
        window.opener.postMessage("REFRESH_DSC", "*");
        window.close();
      } else {
        router.replace("/identity/profile/dsc");
      }
    },
    onError: (err: DSCApiResponse) => {
      toast.error(err?.message);
    },
  });

  const onSubmit = (data: z.output<typeof dscSchema>) => {
    const certificate = selectedCertificate;
    DSCMutation.mutate({
      cert_id: data.cert_id,
      device_id: data.device_id,
      certificate: certificate?.certificate as string,
      issuer: certificate?.issuer as string,
      subject: certificate?.subject as string,
      serial: certificate?.serial as string,
      valid_from: certificate?.valid_from as string,
      valid_to: certificate?.valid_to as string,
    });
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit as any)}
          className="flex flex-1 overflow-hidden h-full flex-col"
        >
          {}
          <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-neutral-950 shrink-0 w-full">
            <h1 className="text-lg font-semibold tracking-tight">
              {t("dsc_bind.title") || "Register DSC Token"}
            </h1>
          </div>

          {}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar">
            <div className="space-y-6 max-w-xl mx-auto w-full">
              {}
              <div className="w-full flex justify-center py-2">
                <img
                  src="/dsc.png"
                  alt="DSC Configuration"
                  className="max-h-40 object-contain"
                />
              </div>

              {}
              <section className="bg-card border rounded-xl overflow-hidden">
                <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground">
                  {t("dsc_bind.subtitle") || "Associate DSC Token"}
                </div>
                <div className="p-6 space-y-4">
                  <SelectField
                    label={t("dsc_bind.label.device_id")}
                    control={form.control}
                    name="device_id"
                    loading={deviceList.isLoading}
                    loadingText={t("dsc_bind.device_loading")}
                    placeholder={t("dsc_bind.select_device")}
                    options={deviceOptions}
                    disabled={deviceList.isLoading}
                  />
                  <SelectField
                    label={t("dsc_bind.label.cert_id")}
                    control={form.control}
                    name="cert_id"
                    loading={certificateList.isLoading}
                    loadingText={t("dsc_bind.certificate_loading")}
                    placeholder={t("dsc_bind.select_cert")}
                    options={certOptions}
                    disabled={!deviceId || certificateList.isLoading}
                  />
                </div>
              </section>
            </div>
          </div>

          {}
          <div className="flex items-center justify-end border-t bg-white dark:bg-neutral-950 px-8 py-3 z-10 relative">
            <div className="flex gap-3">
              <Button
                type="button"
                className="px-6"
                onClick={() => {
                  if (window.opener) {
                    window.close();
                  } else {
                    router.push("/identity/profile/dsc");
                  }
                }}
                variant="outline"
              >
                {t("common.cancel") || "Cancel"}
              </Button>
              <Button
                type="submit"
                loading={DSCMutation.isPending}
                className="px-6"
              >
                {t("dsc_bind.bind_button") || "Register"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}

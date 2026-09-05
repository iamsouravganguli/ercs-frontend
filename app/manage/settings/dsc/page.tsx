"use client";
import { DSCertificateListData, formatDate, getExpiryStatus, getStatus, maskSerial } from '@/lib/query';
import { StatusBadge } from "@/components/ui/status-badge";
import { useTranslation } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eye, Power, Fingerprint } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getDSC, resetDSC } from '@/lib/dsc.service';
import { useProfileDSCList, useProfileDSCActivate, useProfileDSCDeactivate, useConfirm } from '@/lib/query';
import { mapToOptions } from '@/lib/utils';
import { useDSCDevices, useDSCCertificates } from '@/lib/query';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { SelectField } from "@/components/ui/select-field";
import { dscSchema } from "./device/validations";
import { useMutation } from "@tanstack/react-query";
import { DSCService } from "./device/services";
import {
  CustomModal,
  CustomModalHeader,
  CustomModalTitle,
  CustomModalDescription,
  CustomModalBody,
  CustomModalFooter,
  CustomModalClose,
} from "@/components/ui/custom-modal";
import toast from "react-hot-toast";

export default function DCSPageList() {
  const { t } = useTranslation();
  const data = useProfileDSCList();
  const confirm = useConfirm();
  const activateMutation = useProfileDSCActivate();
  const deactivateMutation = useProfileDSCDeactivate();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const dscForm = useForm<z.input<typeof dscSchema>>({
    resolver: zodResolver(dscSchema) as any,
    defaultValues: { device_id: undefined, cert_id: undefined },
    mode: "all",
  });
  const deviceId = dscForm.watch("device_id");
  const deviceList = useDSCDevices({ enabled: showAddDialog });
  const certificateList = useDSCCertificates(deviceId as number | undefined, {
    enabled: showAddDialog && !!deviceId,
  });
  const deviceOptions = mapToOptions(deviceList.data ?? [], {
    label: (d: any) => `${d.label} — ${d.manufacturer}`,
    value: (d: any) => d.device_id,
  });
  const validCertificates = (certificateList.data ?? []).filter((c: any) => {
    const { label } = getExpiryStatus(c as any);
    return label !== "Expired";
  });
  const expiredCount =
    (certificateList.data ?? []).length - validCertificates.length;
  const certOptions = mapToOptions(validCertificates, {
    label: (c: any) => c.subject ?? "Unknown Certificate",
    value: (c: any) => c.cert_id,
  });
  const certId = dscForm.watch("cert_id");
  const selectedCertificate = certificateList.data?.find(
    (c: any) => c.cert_id === certId,
  );

  const handleDscClose = (open: boolean) => {
    setShowAddDialog(open);
    if (!open) {
      dscForm.reset();
      resetDSC();
    }
  };

  const DSCMutation = useMutation({
    mutationKey: ["DSC_BIND_MODAL"],
    mutationFn: DSCService,
    onSuccess: (res: any) => {
      toast.success(res?.message || "DSC registered");
      handleDscClose(false);
      data.refetch();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to register DSC");
    },
  });

  const onDscSubmit = (d: z.output<typeof dscSchema>) => {
    const cert: any = selectedCertificate;
    if (cert) {
      const { label } = getExpiryStatus(cert as any);
      if (label === "Expired") {
        toast.error(
          "Expired certificate cannot be registered. Please select a valid certificate.",
        );
        dscForm.setError("cert_id" as any, {
          message: "Expired certificate not allowed",
        });
        return;
      }
    }
    DSCMutation.mutate({
      cert_id: d.cert_id,
      device_id: d.device_id,
      certificate: cert?.certificate as string,
      issuer: cert?.issuer as string,
      subject: cert?.subject as string,
      serial: cert?.serial as string,
      valid_from: cert?.valid_from as string,
      valid_to: cert?.valid_to as string,
    } as any);
  };

  useEffect(() => {
    if (showAddDialog) getDSC();
  }, [showAddDialog]);

  const handleToggleStatus = async (item: DSCertificateListData) => {
    const isActivating = !item.is_active;
    const titleKey = isActivating
      ? "common.confirm_activate_title"
      : "common.confirm_deactivate_title";
    const descKey = isActivating
      ? "common.confirm_activate_desc"
      : "common.confirm_deactivate_desc";
    const actionKey = isActivating ? "common.activate" : "common.deactivate";

    const isConfirmed = await confirm({
      title:
        t(titleKey) ||
        (isActivating
          ? "Activate DSC Certificate?"
          : "Deactivate DSC Certificate?"),
      description:
        t(descKey) ||
        (isActivating
          ? "This will activate the certificate and deactivate other certificates for this user."
          : "This will temporarily disable this digital signature certificate."),
      confirmText: t(actionKey) || (isActivating ? "Activate" : "Deactivate"),
      cancelText: t("common.cancel") || "Cancel",
    });

    if (isConfirmed) {
      try {
        if (isActivating) {
          await activateMutation.mutateAsync(item.id);
          toast.success("DSC activated successfully");
        } else {
          await deactivateMutation.mutateAsync(item.id);
          toast.success("DSC deactivated successfully");
        }
      } catch (error) {
        toast.error("Failed to update DSC status");
      }
    }
  };

  const popupRef = useRef<Window | null>(null);
  const popupUrlRef = useRef<string>("");

  const openCenteredPopup = (
    url: string,
    title: string,
    width = 580,
    height = 680,
  ) => {
    if (popupRef.current && !popupRef.current.closed) {
      if (popupUrlRef.current === url) {
        popupRef.current.focus();
        return;
      }
    }

    let left = 100;
    let top = 100;
    if (typeof window !== "undefined") {
      const sX = window.screenX;
      const oW = window.outerWidth;
      const sY = window.screenY;
      const oH = window.outerHeight;
      if (
        typeof sX === "number" &&
        typeof oW === "number" &&
        !isNaN(sX) &&
        !isNaN(oW)
      ) {
        left = Math.max(0, sX + (oW - width) / 2);
      }
      if (
        typeof sY === "number" &&
        typeof oH === "number" &&
        !isNaN(sY) &&
        !isNaN(oH)
      ) {
        top = Math.max(0, sY + (oH - height) / 2);
      }
    }
    const name = title.replace(/\s+/g, "_");
    const win = window.open(
      url,
      name,
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
    );
    if (win) {
      popupRef.current = win;
      popupUrlRef.current = url;
      win.focus();
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === "REFRESH_DSC") {
        data.refetch();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [data]);

  const list = (data?.data?.result?.data ?? []) as DSCertificateListData[];

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-background overflow-hidden">
      <div className="shrink-0 h-14 flex items-center justify-between gap-4 px-6 bg-white dark:bg-background sticky top-0 z-10">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          DSC
        </h2>
        <Button
          size="sm"
          onClick={() => setShowAddDialog(true)}
          className="h-8 px-3 shrink-0"
        >
          Add
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 bg-white dark:bg-background">
        <div className="w-full space-y-5">
          <Card className="p-4 sm:p-5 flex flex-col gap-5 border-0 shadow-sm bg-white dark:bg-card rounded-xl">
            <div className="space-y-1">
              <p className="text-base font-semibold leading-none text-foreground">
                Digital Signature Certificates
              </p>
              <p className="text-xs text-muted-foreground">
                {list.length} certificate(s)
              </p>
            </div>

            {data.isError ? (
              <div className="p-4 rounded-xl border border-destructive/15 bg-destructive/10 dark:bg-destructive/15 text-destructive dark:text-red-400 text-xs text-center">
                {(data.error as any)?.response?.data?.message ||
                  t("common_status.something_wrong.description")}
              </div>
            ) : list.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border dark:border-border rounded-xl bg-card/50 dark:bg-card/30">
                No certificates yet — add one to enable DSC signing.
              </p>
            ) : (
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-card">
                {list.map((item) => {
                  const { label: expLabel } = getExpiryStatus(item);
                  const isExpired = expLabel === "Expired";
                  const { label: statusLabel } = getStatus(item);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Fingerprint className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate text-foreground">
                            {item.code || maskSerial(item.serial)}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {formatDate(item.valid_from)} →{" "}
                            {formatDate(item.valid_to)} •{" "}
                            {isExpired ? "Expired" : "Valid"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <StatusBadge
                          variant={item.is_active ? "success" : "neutral"}
                        >
                          {statusLabel}
                        </StatusBadge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            openCenteredPopup(
                              `/identity/profile/dsc/view?id=${item.id}`,
                              "DSC Detail",
                              580,
                              520,
                            )
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleStatus(item)}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <CustomModal open={showAddDialog} onOpenChange={handleDscClose}>
            <CustomModalClose onClose={() => handleDscClose(false)} />
            <CustomModalHeader>
              <CustomModalTitle>Register DSC Token</CustomModalTitle>
              <CustomModalDescription>
                Select your USB token and certificate to register
              </CustomModalDescription>
            </CustomModalHeader>
            <Form {...dscForm}>
              <form
                onSubmit={dscForm.handleSubmit(onDscSubmit as any)}
                className="space-y-4"
              >
                <CustomModalBody className="space-y-4">
                  <SelectField
                    label={t("dsc_bind.label.device_id") || "Device"}
                    control={dscForm.control}
                    name="device_id"
                    loading={deviceList.isLoading}
                    loadingText={
                      t("dsc_bind.device_loading") || "Loading devices..."
                    }
                    placeholder={t("dsc_bind.select_device") || "Select Device"}
                    options={deviceOptions}
                    disabled={deviceList.isLoading}
                  />
                  <SelectField
                    label={t("dsc_bind.label.cert_id") || "Certificate"}
                    control={dscForm.control}
                    name="cert_id"
                    loading={certificateList.isLoading}
                    loadingText={
                      t("dsc_bind.certificate_loading") ||
                      "Loading certificates..."
                    }
                    placeholder={
                      t("dsc_bind.select_cert") || "Select Certificate"
                    }
                    options={certOptions}
                    disabled={!deviceId || certificateList.isLoading}
                  />
                  {expiredCount > 0 &&
                    validCertificates.length === 0 &&
                    !certificateList.isLoading && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg px-3 py-2">
                        All certificates on this device are expired and cannot
                        be registered.
                      </p>
                    )}
                  {expiredCount > 0 && validCertificates.length > 0 && (
                    <p className="text-[11px] text-muted-foreground">
                      Note: {expiredCount} expired certificate(s) hidden.
                    </p>
                  )}
                </CustomModalBody>
                <CustomModalFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDscClose(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={DSCMutation.isPending}
                    className="flex-1"
                  >
                    Register
                  </Button>
                </CustomModalFooter>
              </form>
            </Form>
          </CustomModal>
        </div>
      </div>
    </div>
  );
}

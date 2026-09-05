"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  Bell,
  Plus,
  FileText,
  ShieldCheck,
  KeyRound,
  X,
  Save,
  UploadCloud,
  Trash2,
} from "lucide-react";
import { useSessionCheck, apiClient, useNoticeTypeList, useNoticeDeliveryModeList, useStatusList, useDSCSigner } from '@/lib/query';
import { CommonsApiServices } from '@/lib/services';
import toast from "react-hot-toast";
import { useTranslation } from "@/i18n";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Form } from "@/components/ui/form";
import { TextFieldV2 } from "@/components/ui/text-field-v2";
import { TextareaField } from "@/components/ui/textarea-field";
import { AutocompleteField } from "@/components/ui/autocomplete-field";
import { MultiAutocompleteField } from "@/components/ui/multi-autocomplete-field";
import { DSCSignerCard } from "@/components/ui/dsc-signer-card";

export default function DraftNoticePopupPage() {
  const { case_number } = useParams<{
    case_number: string;
  }>();

  const sessionCheck = useSessionCheck();
  const activeSessionRole =
    sessionCheck.data?.result?.data?.role?.toUpperCase() || "CO";

  const [loading, setLoading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);


  const noticeTypesQuery = useNoticeTypeList();
  const deliveryModesQuery = useNoticeDeliveryModeList();
  const { data: statusRes } = useStatusList({ "filters[type]": "NOTICE" });


  const dscSigner = useDSCSigner();

  const form = useForm<any>({
    defaultValues: {
      docType: "CASE_NOTICE",
      title: "",
      status: "NOTICE_ISSUED",
      deliveryMode: [],
      message: "",
    },
  });

  const canCreate = ["CO", "SA", "PO", "CC", "RI", "RSI"].includes(
    activeSessionRole,
  );

  const { t, lang } = useTranslation();


  useEffect(() => {
    const statuses = statusRes?.result?.data || [];
    if (statuses.length > 0 && !form.getValues("status")) {
      const defaultStatus =
        statuses.find(
          (s: any) => s.code === "NOTICE_ISSUED" || s.code === "NOTICE_DRAFTED",
        ) || statuses[0];
      if (defaultStatus) {
        form.setValue("status", defaultStatus.code);
      }
    }
  }, [statusRes, form]);

  const handleUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.type !== "application/pdf") {
      toast.error(t("case.notices.only_pdf"));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("case.notices.file_too_large"));
      return;
    }
    setPendingFile(file);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const onSubmit = form.handleSubmit(async (data) => {
    if (!canCreate) return;

    if (!pendingFile) {
      toast.error(t("case.notices.choose_file"));
      return;
    }

    try {
      setLoading(true);
      let signaturePayload: any = null;

      if (dscSigner.useDsc) {
        toast.loading(t("case.notices.signing_document"), { id: "signing" });
        try {
          signaturePayload = await dscSigner.signDocument(pendingFile);
          toast.dismiss("signing");
        } catch (dscErr: any) {
          toast.dismiss("signing");
          console.error("DSC Signing Error:", dscErr);
          const errMsg = dscErr?.message || "";
          if (errMsg === "TOKEN_PIN_REQUIRED") {
            toast.error(t("case.notices.enter_token_pin"));
          } else if (errMsg === "NO_MATCHING_TOKEN") {
            toast.error(t("case.notices.no_matching_token"));
          } else if (errMsg.includes("JSON") || errMsg.includes("json")) {
            toast.error(
              "DSC Bridge response error. Please check if your USB token is connected and PIN is valid.",
            );
          } else {
            toast.error(errMsg || t("case.notices.failed_to_create"));
          }
          setLoading(false);
          return;
        }
      }


      const formData = new FormData();
      formData.append("file", pendingFile);
      formData.append("type_of_doc", data.docType);
      if (data.message) {
        formData.append("remarks", data.message);
      }

      const noticeStatuses = statusRes?.result?.data || [];
      const selectedStatusObj = noticeStatuses.find(
        (s: any) =>
          s.code === data.status || String(s.id) === String(data.status),
      );
      if (selectedStatusObj) {
        formData.append("status", String(selectedStatusObj.id));
      } else {
        const defaultIssued =
          noticeStatuses.find((s: any) => s.code === "NOTICE_ISSUED") ||
          noticeStatuses[0];
        if (defaultIssued) {
          formData.append("status", String(defaultIssued.id));
        }
      }

      const metadata = {
        title: data.title,
        message: data.message,
        delivery_mode: data.deliveryMode,
        status: selectedStatusObj
          ? selectedStatusObj.name_en || selectedStatusObj.name
          : "Pending",
        signature_hash: signaturePayload?.signature_hash || null,
        document_hash: signaturePayload?.document_hash || null,
        algorithm: signaturePayload?.algorithm || null,
        signed_at: signaturePayload?.signed_at || null,
        serial: signaturePayload?.serial || null,
      };
      formData.append("meta", JSON.stringify(metadata));

      const uploadRes = await apiClient.post(
        `/doc/linked/CaseModel/${case_number}/upload/`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      const createdDoc = uploadRes.data?.result?.data;


      if (dscSigner.useDsc && createdDoc?.id && signaturePayload) {
        await CommonsApiServices.DscSignatureSign("DocModel", createdDoc.id, {
          signature_hash: signaturePayload.signature_hash,
          document_hash: signaturePayload.document_hash,
        });
        toast.success(t("case.notices.signed_saved_success"));
      } else {
        toast.success(t("case.notices.saved_success"));
      }


      if (window.opener) {
        try {
          window.opener.postMessage("refetch-notices", window.location.origin);
        } catch (e) {
          window.opener.postMessage("refetch-notices", "*");
        }
      }


      window.close();
    } catch (err: any) {
      toast.dismiss("signing");
      console.error(err);
      toast.error(err?.message || t("case.notices.failed_to_create"));
    } finally {
      setLoading(false);
    }
  });

  const handleCancel = () => {
    window.close();
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <Form {...form}>
        <form
          onSubmit={onSubmit}
          className="flex flex-1 flex-col bg-background dark:bg-neutral-950 border-r overflow-hidden"
        >
          {}
          <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-neutral-950 shrink-0">
            <h1 className="text-lg font-semibold tracking-tight">
              {t("case.notices.issue_notice_summon")}
            </h1>
          </div>

          {}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar">
            <div className="space-y-6">
              {}
              <section className="bg-card border rounded-xl overflow-hidden">
                <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground">
                  {t("case.notices.document_classification")}
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                    <AutocompleteField
                      control={form.control}
                      name="docType"
                      label={t("case.notices.document_type")}
                      placeholder={t("case.notices.select_doc_type")}
                      required
                      loading={noticeTypesQuery.isLoading}
                      options={
                        noticeTypesQuery.data?.result?.data?.map(
                          (item: any) => ({
                            label:
                              lang === "hi"
                                ? item.name || item.name_en
                                : item.name_en || item.name,
                            value: item.code,
                          }),
                        ) || []
                      }
                    />

                    <TextFieldV2
                      control={form.control}
                      name="title"
                      label={t("case.notices.subject_title")}
                      placeholder={t("case.notices.enter_subject")}
                      required
                    />

                    <AutocompleteField
                      control={form.control}
                      name="status"
                      label={t("case.notices.status")}
                      placeholder={t("case.notices.select_status")}
                      required
                      loading={!statusRes}
                      options={(statusRes?.result?.data || []).map(
                        (s: any) => ({
                          label:
                            lang === "hi"
                              ? s.name || s.name_en
                              : s.name_en || s.name,
                          value: s.code || String(s.id),
                        }),
                      )}
                    />

                    <MultiAutocompleteField
                      control={form.control}
                      name="deliveryMode"
                      label={t("case.notices.delivery_mode")}
                      placeholder={t("case.notices.select_delivery_mode")}
                      required
                      loading={deliveryModesQuery.isLoading}
                      options={
                        deliveryModesQuery.data?.result?.data?.map(
                          (d: any) => ({
                            label:
                              lang === "hi"
                                ? d.name || d.name_en
                                : d.name_en || d.name,
                            value: d.code,
                          }),
                        ) || []
                      }
                    />
                  </div>

                  <TextareaField
                    control={form.control}
                    name="message"
                    label={t("case.notices.detailed_message")}
                    placeholder={t("case.notices.enter_detailed_message")}
                  />
                </div>
              </section>

              {}
              <section className="bg-card border rounded-xl overflow-hidden">
                <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground">
                  {t("case.notices.document_attachment")}
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-foreground">
                      {t("case.notices.attachment_file")} *
                    </Label>

                    {!pendingFile ? (
                      <label className="cursor-pointer border-2 border-dashed border-primary/20 rounded-xl p-12 flex flex-col items-center justify-center bg-muted/5 hover:bg-muted/10 transition-colors">
                        <UploadCloud className="w-12 h-12 text-primary/50 mb-4" />
                        <span className="text-sm font-medium text-foreground">
                          {t("case.notices.click_to_select")}
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">
                          {t("case.notices.max_size")}
                        </span>
                        <input
                          hidden
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={(e) => {
                            handleUpload(e.target.files);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    ) : (
                      <div className="border rounded-lg bg-muted/20 h-10 flex items-center px-3 gap-2 group transition-colors hover:border-destructive/30">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <div className="min-w-0 flex-1 flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {pendingFile.name}
                          </p>
                          <p className="text-xs text-muted-foreground whitespace-nowrap">
                            ({formatSize(pendingFile.size)})
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPendingFile(null)}
                          className="text-muted-foreground hover:text-destructive transition-colors focus:outline-none rounded-sm p-1 -mr-1"
                        >
                          <Trash2 className="w-4 h-4 shrink-0" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {}
              <DSCSignerCard
                useDsc={dscSigner.useDsc}
                onUseDscChange={dscSigner.setUseDsc}
                pin={dscSigner.pin}
                onPinChange={dscSigner.setPin}
                profileCerts={dscSigner.profileCerts}
                loadingCerts={dscSigner.loadingProfileCerts}
                title={t("case.notices.dsc_signature")}
                checkboxLabel={t("case.notices.sign_with_dsc")}
                pinLabel={t("case.notices.token_pin")}
                pinPlaceholder={t("case.notices.enter_pin")}
                noCertsText={t("case.notices.no_dsc_found")}
                certsHeaderTitle={t("case.notices.profile_certs_details")}
              />
            </div>
          </div>

          {}
          <div className="flex items-center justify-end border-t bg-white dark:bg-neutral-950 px-8 py-3 z-10 relative">
            <div className="flex gap-3">
              <Button
                variant="outline"
                type="button"
                className="px-6 rounded-xl"
                onClick={handleCancel}
              >
                {t("case.notices.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="px-6 rounded-xl"
              >
                <Save className="w-4 h-4 mr-2" /> {t("case.notices.issue")}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}

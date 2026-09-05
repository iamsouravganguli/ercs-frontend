"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, Trash2, FileText, Plus, X } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { CustomComboboxField } from "@/components/ui/custom-combobox-field";
import { MultiAutocompleteField } from "@/components/ui/multi-autocomplete-field";
import { TextareaField } from "@/components/ui/textarea-field";
import { TextFieldV2 } from "@/components/ui/text-field-v2";
import { ChipInputField } from "@/components/ui/chip-input-field";
import { useTranslation } from "@/i18n";

import {
  useDistrict,
  useKhataDetail,
  useKhataList,
  useMandal,
  usePargana,
  useRI,
  useRSI,
  useStates,
  useTehsil,
  useVillage,
  useCaseDetail,
  useCaseLandCreate,
  useCaseLandUpdate,
  useCaseLandDetail,
  useStatusList,
  useSessionCheck,
  applyBackendErrors,
  getLabel,
  CommonsApiServices,
} from "@/lib";
import { isAllowed } from "@/lib";

import { LandFormData, LandSchema } from "./context";
import { EntityStatusPanel } from "../entity-status-panel";

interface LandFormProps {
  landId?: string | null;
  isEditing?: boolean;
  isView?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function LandForm({
  landId,
  isEditing = false,
  isView = false,
  onClose,
  onSuccess,
}: LandFormProps) {
  const params = useParams() as any;
  const case_number = params.case_number || params.caseId;
  const { t, lang } = useTranslation();

  const detail = useCaseDetail(case_number as string);
  const sessionCheck = useSessionCheck();
  const userRoleLand = String((sessionCheck.data as any)?.result?.data?.role ?? "").toUpperCase();
  const isAllowedToUpdateLandStatus = isAllowed(userRoleLand, ["PO", "CO", "CC"]);
  const landStatusList = useStatusList({ "filters[type]": "LAND_DETAILS" } as any);
  const [isUpdatingLandStatus, setIsUpdatingLandStatus] = useState(false);

  const form = useForm<LandFormData & { status_code?: string }>({
    resolver: zodResolver(LandSchema) as any,
    defaultValues: {
      id: landId || crypto.randomUUID(),
      is_manual: false,
      state_code_census: detail.data?.result?.data?.state_code_census ?? null,
      state_name: detail.data?.result?.data?.state_name ?? null,
      mandal_code: detail.data?.result?.data?.mandal_code ?? null,
      mandal_name: detail.data?.result?.data?.mandal_name ?? null,
      district_code_census:
        detail.data?.result?.data?.district_code_census ?? null,
      district_name: detail.data?.result?.data?.district_name ?? null,
      tehsil_code_census: detail.data?.result?.data?.tehsil_code_census ?? null,
      tehsil_name: detail.data?.result?.data?.tehsil_name ?? null,
      tehsil_name_en: detail.data?.result?.data?.tehsil_name_en ?? null,
      pargana_code: null,
      pargana_name: null,
      ricircle_code: null,
      rsicircle_code: null,
      ricircle_name: null,
      rsicircle_name: null,
      village_code_census: null,
      village_name: null,
      khata_number: null,
      land_type: "",
      land_type_description: "",
      fasli_year: "",
      land_revenue_payable: "",
      orders: [],
      remarks: "",
      khasra_no: "",
      plots: [],
      disputed_land: "" as any,
      total_land_manual: "",
      owners: [],
      status_code: "",
    } as any,
  });


  const watchState = form.watch("state_code_census");
  const watchMandal = form.watch("mandal_code");
  const watchDistrict = form.watch("district_code_census");
  const watchTehsil = form.watch("tehsil_code_census");
  const isStep1Complete =
    !!watchState && !!watchMandal && !!watchDistrict && !!watchTehsil;
  const watchVillage = form.watch("village_code_census");
  const watchRI = form.watch("ricircle_code");
  const watchRSI = form.watch("rsicircle_code");
  const watchKhata = form.watch("khata_number");
  const watchLandType = form.watch("land_type");
  const watchPlots = form.watch("plots");
  const watchIsManual = form.watch("is_manual");


  const [currentStep, setCurrentStep] = useState(1);
  const steps = [
    {
      id: 1,
      label: t("case.land_form.sections.admin_area"),
      fields: [
        "state_code_census",
        "mandal_code",
        "district_code_census",
        "tehsil_code_census",
      ] as const,
    },
    {
      id: 2,
      label: t("case.land_form.sections.sub_admin_area"),
      fields: [
        "pargana_code",
        "village_code_census",
        "ricircle_code",
        "rsicircle_code",
      ] as const,
    },
    {
      id: 3,
      label: t("case.land_form.sections.plot_selection"),
      fields: [
        "khata_number",
        "plots",
        "khasra_no",
        "total_land_manual",
        "disputed_land",
        "village_name",
        "land_type_description",
      ] as const,
    },
    {
      id: 4,
      label: t("case.land_form.sections.remarks_title"),
      fields: ["remarks"] as const,
    },
  ];
  const isNavigatingRef = React.useRef(false);
  const handleNext = async () => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    try {
    const fields = steps[currentStep - 1]?.fields as any;
    if (fields) {
      const ok = await form.trigger(fields);
      if (!ok) return;
    }
    if (currentStep === 1) {
      const st = String(form.getValues("state_code_census") ?? "").trim();
      const man = String(form.getValues("mandal_code") ?? "").trim();
      const dist = String(form.getValues("district_code_census") ?? "").trim();
      const teh = String(form.getValues("tehsil_code_census") ?? "").trim();
      if (!st) { form.setError("state_code_census", { type: "required", message: "State is required" }); return; }
      if (!man) { form.setError("mandal_code", { type: "required", message: "Mandal is required" }); return; }
      if (!dist) { form.setError("district_code_census", { type: "required", message: "District is required" }); return; }
      if (!teh) { form.setError("tehsil_code_census", { type: "required", message: "Tehsil is required" }); return; }
    }
    if (currentStep === 3) {
      const rel = Number(form.getValues("disputed_land" as any) || 0);
      const tot = form.getValues("is_manual" as any) ? Number(form.getValues("total_land_manual" as any) || 0) : totalSelectedArea;
      if (rel > 0 && tot > 0 && rel > tot) { form.setError("disputed_land" as any, { type: "validate", message: "Related area cannot exceed total area" }); return; }
    }

    if (currentStep === 2) {
      const vCode = String(form.getValues("village_code_census") ?? "").trim();
      const vName = String(form.getValues("village_name") ?? "").trim();
      if (!vCode && !vName) {
        form.setError("village_code_census", { type: "required", message: "Village is required" });
        return;
      }
    }
    setCurrentStep((s) => Math.min(4, s + 1));
    } finally { setTimeout(() => { isNavigatingRef.current = false; }, 300); }
  };
  const handleBack = () => setCurrentStep((s) => Math.max(1, s - 1));


  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [existingDocs, setExistingDocs] = useState<any[]>([]);
  const [isUploadingDocs, setIsUploadingDocs] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const stateList = useStates();
  const mandalList = useMandal();
  const districtList = useDistrict(watchMandal as string);
  const tehsilList = useTehsil(watchDistrict as string);
  const parganaList = usePargana(watchTehsil as string);
  const villageList = useVillage(watchTehsil as string);
  const RIList = useRI(watchTehsil as string);
  const RSIList = useRSI(watchRI as unknown as string, watchTehsil as string);
  const khataList = useKhataList(watchVillage as unknown as string);

  const khataDetail = useKhataDetail({
    khata_number: watchKhata as unknown as string,
    village_code_census: watchVillage as unknown as string,
  });

  const totalSelectedArea = React.useMemo(() => {
    if (watchIsManual || !watchPlots || watchPlots.length === 0) return 0;
    const details = khataDetail.data?.plots?.filter((p: any) =>
      watchPlots.includes(p.khasra_no),
    );
    if (details && details.length > 0) {
      return details.reduce((sum: number, p: any) => {
        const a = parseFloat(p.area);
        return sum + (isNaN(a) ? 0 : a);
      }, 0);
    }
    return 0;
  }, [watchPlots, khataDetail.data, watchIsManual]);


  const landDetailQuery = useCaseLandDetail(
    case_number as string,
    landId as string,
    { enabled: !!landId && (isEditing || isView) },
  );
  const apiLandDetail = landDetailQuery.data?.result?.data;

  const handleUpdateLandStatus = async () => {
    const selected = (form.getValues() as any).status_code;
    if (!selected) { toast.error("Please select status"); return; }
    const statusId = (landStatusList.data?.result?.data as any[])?.find((s) => s.code === selected)?.id;
    if (!statusId) { toast.error("Invalid status"); return; }
    const d: any = apiLandDetail as any;
    if (!d) return;
    setIsUpdatingLandStatus(true);
    try {
      const payload: any = {
        khata_number: d.khata_number,
        khasra_no: d.khasra_no,
        land_type: d.land_type,
        land_type_desc: d.land_type_desc,
        fasli_year: d.fasli_year,
        total_land: d.total_land,
        disputed_land: d.disputed_land,
        actual_owners: d.actual_owners,
        orders: d.orders,
        ebhulekh: d.ebhulekh,
        mandal_code: d.mandal_code,
        mandal_name: d.mandal_name,
        district_code_census: d.district_code_census,
        district_name: d.district_name,
        tehsil_code_census: d.tehsil_code_census,
        tehsil_name: d.tehsil_name,
        pargana_code: d.pargana_code,
        pargana_name: d.pargana_name,
        ricircle_code: d.ricircle_code,
        ricircle_name: d.ricircle_name,
        rsicircle_code: d.rsicircle_code,
        rsicircle_name: d.rsicircle_name,
        village_code_census: d.village_code_census,
        village_name: d.village_name,
        remarks: d.remarks,
        status: statusId,
      };
      await updateMutation.mutateAsync({ case_no: case_number as string, pk: String(landId), payload });
      toast.success("Land status updated");
      landDetailQuery.refetch();
    } catch (e: any) {
      const msg = e?.errors ? Object.values(e.errors).flat().join(" ") : e?.message;
      toast.error(msg || "Failed to update status");
    }
    finally { setIsUpdatingLandStatus(false); }
  };


  useEffect(() => {
    if (apiLandDetail) {
      const detailAny = apiLandDetail as any;
      form.reset({
        id: String(detailAny.id),
        is_manual: detailAny.is_manual === true,
        state_code_census: detailAny.state_code_census ?? null,
        state_name: detailAny.state_name ?? null,
        mandal_code: detailAny.mandal_code ?? null,
        mandal_name: detailAny.mandal_name ?? null,
        district_code_census: detailAny.district_code_census ?? null,
        district_name: detailAny.district_name ?? null,
        tehsil_code_census: detailAny.tehsil_code_census ?? null,
        tehsil_name: detailAny.tehsil_name ?? null,
        tehsil_name_en:
          detailAny.tehsil_name_en ?? detailAny.tehsil_name ?? null,
        pargana_code: detailAny.pargana_code ?? null,
        pargana_name: detailAny.pargana_name ?? null,
        ricircle_code: detailAny.ricircle_code ?? null,
        ricircle_name: detailAny.ricircle_name ?? null,
        rsicircle_code: detailAny.rsicircle_code ?? null,
        rsicircle_name: detailAny.rsicircle_name ?? null,
        village_code_census: detailAny.village_code_census ?? null,
        village_name: detailAny.village_name ?? null,
        khata_number: detailAny.khata_number ?? null,
        land_type: detailAny.land_type ?? "",
        land_type_description: detailAny.land_type_desc ?? "",
        fasli_year: detailAny.fasli_year ?? "",
        land_revenue_payable: detailAny.land_revenue_payable ?? "",
        orders: detailAny.orders ?? [],
        remarks: detailAny.remarks ?? "",
        khasra_no: detailAny.khasra_no ?? "",
        plots: detailAny.khasra_no
          ? detailAny.khasra_no
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean)
          : [],
        calculated_area: detailAny.total_land
          ? Number(detailAny.total_land)
          : 0,
        disputed_land: detailAny.disputed_land
          ? Number(detailAny.disputed_land)
          : 0,
        total_land_manual: detailAny.is_manual
          ? String(detailAny.total_land || "")
          : "",
        owners: detailAny.actual_owners || [],
        status_code: (detailAny.status_detail?.code || detailAny.status?.code || "") as any,
      } as any);
    }
  }, [apiLandDetail, form]);


  useEffect(() => {
    if (apiLandDetail && (apiLandDetail as any).is_manual && landId) {
      CommonsApiServices.LandDocumentListService(landId)
        .then((res: any) => {
          setExistingDocs(res?.result?.data || []);
        })
        .catch(() => {});
    }
  }, [apiLandDetail, landId]);


  useEffect(() => {
    const caseData = detail.data?.result?.data;
    if (caseData && !isEditing) {
      form.reset({
        ...form.getValues(),
        state_code_census: caseData.state_code_census ?? null,
        state_name: caseData.state_name ?? null,
        mandal_code: caseData.mandal_code ?? null,
        mandal_name: caseData.mandal_name ?? null,
        district_code_census: caseData.district_code_census ?? null,
        district_name: caseData.district_name ?? null,
        tehsil_code_census: caseData.tehsil_code_census ?? null,
        tehsil_name: caseData.tehsil_name ?? null,
        tehsil_name_en: caseData.tehsil_name_en ?? null,
      });
    }
  }, [detail.data, isEditing, form]);


  useEffect(() => {
    if (watchIsManual) return;
    const selectedKhata = khataList.data?.find(
      (value: any) => value?.khata_number === watchKhata,
    );
    if (selectedKhata?.land_type) {
      form.setValue("land_type", selectedKhata.land_type);
    }
  }, [watchKhata, khataList.data, watchIsManual]);

  useEffect(() => {
    if (watchIsManual) return;
    if (khataDetail.data) {
      if (khataDetail.data.landType) {
        form.setValue("land_type", khataDetail.data.landType);
      }
      if (khataDetail.data.landTypeDesc) {
        form.setValue("land_type_description", khataDetail.data.landTypeDesc);
      }
      if (khataDetail.data.fasli_year) {
        form.setValue("fasli_year", khataDetail.data.fasli_year);
      }
    }
  }, [khataDetail.data, watchIsManual]);

  useEffect(() => {
    if (watchIsManual) return;
    const findOwners =
      khataDetail.data?.owners?.map((item: any) => ({
        name: item.name,
        father: item.father,
        address: item.address,
      })) ?? [];
    form.setValue("owners", findOwners);
  }, [watchPlots, khataDetail.data, watchIsManual]);

  useEffect(() => {
    if (watchIsManual) return;
    form.setValue("orders", khataDetail.data?.orders ?? []);
  }, [watchPlots, khataDetail.data, watchIsManual]);

  const createMutation = useCaseLandCreate();
  const updateMutation = useCaseLandUpdate();
  const saveTriggeredRef = useRef(false);

  const onSubmit = form.handleSubmit(async (data) => {
    if (!case_number) return;

    if (!isView && currentStep === 4 && !saveTriggeredRef.current) {
      return;
    }

    if (!isView && currentStep !== 4) {
      return;
    }

    const isManual = data.is_manual === true;


    let totalArea = 0;
    if (isManual) {
      totalArea = parseFloat(
        Number(
          data.total_land_manual || (apiLandDetail as any)?.total_land || 0,
        ).toFixed(4),
      );
    } else {
      const selectedPlotDetails = khataDetail.data?.plots?.filter((p: any) =>
        data.plots?.includes(p.khasra_no),
      );
      let rawArea: number | undefined;
      if (selectedPlotDetails && selectedPlotDetails.length > 0) {
        rawArea = selectedPlotDetails.reduce((sum: number, p: any) => {
          const a = parseFloat(p.area);
          return sum + (isNaN(a) ? 0 : a);
        }, 0);
      } else {
        rawArea =
          (data.calculated_area as any) ??
          (apiLandDetail as any)?.total_land ??
          0;
        if (!rawArea || Number(rawArea) === 0) {

          const fallbackDetails = khataDetail.data?.plots?.filter((p: any) =>
            (data.plots || []).includes(p.khasra_no),
          );
          if (fallbackDetails?.length) {
            rawArea = fallbackDetails.reduce(
              (s: number, p: any) => s + (parseFloat(p.area) || 0),
              0,
            );
          }
        }
      }
      totalArea = parseFloat(Number(rawArea || 0).toFixed(4));

      if (totalArea === 0 && (apiLandDetail as any)?.total_land) {
        totalArea = parseFloat(
          Number((apiLandDetail as any).total_land).toFixed(4),
        );
      }
    }

    const currentFasliYear = String(new Date().getFullYear() - 593);


    let khasraNoStr = isManual
      ? data.khasra_no || (apiLandDetail as any)?.khasra_no || ""
      : data.plots && data.plots.length > 0
        ? data.plots.join(", ")
        : data.khasra_no || (apiLandDetail as any)?.khasra_no || "";

    if (!khasraNoStr && (apiLandDetail as any)?.khasra_no)
      khasraNoStr = (apiLandDetail as any).khasra_no;

    console.log("[LAND_DEBUG] onSubmit", {
      isManual,
      data,
      khataDetail: khataDetail.data,
      totalArea,
      khasraNoStr,
      apiLandDetail,
    });


    const apiPayload: any = {
      khata_number:
        data.khata_number || (apiLandDetail as any)?.khata_number || "",
      khasra_no: khasraNoStr,
      land_type: data.land_type || "OTHER",
      land_type_desc:
        data.land_type_description || data.land_type || "Other Land",
      fasli_year: data.fasli_year || currentFasliYear,
      total_land: totalArea,
      disputed_land: parseFloat(Number(data.disputed_land || 0).toFixed(4)),
      actual_owners: data.owners || [],
      orders: data.orders || [],
      ebhulekh: [],
      mandal_code:
        data.mandal_code || (apiLandDetail as any)?.mandal_code || null,
      mandal_name:
        data.mandal_name || (apiLandDetail as any)?.mandal_name || null,
      district_code_census:
        data.district_code_census ||
        (apiLandDetail as any)?.district_code_census ||
        null,
      district_name:
        data.district_name || (apiLandDetail as any)?.district_name || null,
      tehsil_code_census:
        data.tehsil_code_census ||
        (apiLandDetail as any)?.tehsil_code_census ||
        null,
      tehsil_name:
        data.tehsil_name || (apiLandDetail as any)?.tehsil_name || null,
      pargana_code:
        data.pargana_code || (apiLandDetail as any)?.pargana_code || null,
      pargana_name:
        data.pargana_name || (apiLandDetail as any)?.pargana_name || null,
      ricircle_code:
        data.ricircle_code || (apiLandDetail as any)?.ricircle_code || null,
      ricircle_name:
        data.ricircle_name || (apiLandDetail as any)?.ricircle_name || null,
      ricircle_name_en:
        data.ricircle_name || (apiLandDetail as any)?.ricircle_name || null,
      rsicircle_code:
        data.rsicircle_code || (apiLandDetail as any)?.rsicircle_code || null,
      rsicircle_name:
        data.rsicircle_name || (apiLandDetail as any)?.rsicircle_name || null,
      rsicircle_name_en:
        data.rsicircle_name || (apiLandDetail as any)?.rsicircle_name || null,
      village_code_census:
        data.village_code_census ||
        (apiLandDetail as any)?.village_code_census ||
        "",
      village_name: isManual
        ? data.village_name || (apiLandDetail as any)?.village_name || ""
        : (villageList.data?.find(
            (v: any) => v.village_code_census === watchVillage,
          )?.vname ??
          data.village_name ??
          (apiLandDetail as any)?.village_name ??
          ""),
      remarks: data.remarks || (apiLandDetail as any)?.remarks || "",
      is_active: true,
      is_manual: isManual,
    };
    console.log("[LAND_DEBUG] apiPayload", apiPayload);

    try {
      let savedLandId: string | number | null = null;

      const isBackendId = !isNaN(parseInt(data.id, 10));
      if (isEditing && isBackendId) {
        console.log("[LAND_DEBUG] updating", {
          case_no: case_number,
          pk: parseInt(data.id, 10),
          apiPayload,
        });
        const res = await updateMutation.mutateAsync({
          case_no: case_number,
          pk: parseInt(data.id, 10),
          payload: apiPayload,
        });
        console.log("[LAND_DEBUG] update response", res);
        savedLandId = parseInt(data.id, 10);
        toast.success(t("case.land_form.toasts.updated"));
      } else {
        const createRes = await createMutation.mutateAsync({
          case_no: case_number,
          payload: apiPayload,
        });
        savedLandId = createRes?.result?.data?.id || null;
        toast.success(t("case.land_form.toasts.added"));
      }


      if (isManual && savedLandId && pendingFiles.length > 0) {
        setIsUploadingDocs(true);
        for (const file of pendingFiles) {
          try {
            await CommonsApiServices.LandDocumentUploadService(
              savedLandId,
              file,
              "LAND_RECORD",
              `Land record document for khata ${data.khata_number}`,
            );
          } catch (uploadErr) {
            console.error("Failed to upload land document:", uploadErr);
          }
        }
        setIsUploadingDocs(false);
      }

      if (window.opener) {
        try {
          window.opener.postMessage("refetch-lands", window.location.origin);
        } catch (err) {
          console.error("Failed to postMessage to opener", err);
        }
      }
      if (onSuccess) onSuccess();
      if (onClose) onClose();
      else window.close();
    } catch (apiErr: any) {
      console.error("Failed to sync land record with server API:", apiErr);
      applyBackendErrors(
        form,
        apiErr.errors,
        apiErr.message || "Failed to save land record to server",
      );


      const fieldMsg = apiErr.errors ? Object.values(apiErr.errors).flat().join(" ") : "";
      toast.error(fieldMsg || apiErr.message || "Failed to save land record to server");
    } finally {
      saveTriggeredRef.current = false;
    }
  });

  const handleCancel = () => {
    if (onClose) onClose();
    else window.close();
  };


  const addOwner = () => {
    const current = form.getValues("owners") || [];
    form.setValue("owners", [
      ...current,
      { name: "", father: "", address: "" },
    ]);
  };

  const removeOwner = (idx: number) => {
    const current = form.getValues("owners") || [];
    form.setValue(
      "owners",
      current.filter((_, i) => i !== idx),
    );
  };


  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setPendingFiles((prev) => [...prev, ...Array.from(files)]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePendingFile = (idx: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const deleteExistingDoc = async (docId: number) => {
    try {
      await CommonsApiServices.CaseDocumentDeleteService(docId);
      setExistingDocs((prev) => prev.filter((d) => d.id !== docId));
      toast.success(t("case.land_form.toasts.document_deleted"));
    } catch {
      toast.error(t("case.land_form.toasts.document_delete_failed"));
    }
  };


  const handleExplicitSave = async () => {
    if (currentStep !== 4) return;
    saveTriggeredRef.current = true;
    try {
      await (onSubmit as unknown as () => Promise<void>)();
    } finally {
      setTimeout(() => { saveTriggeredRef.current = false; }, 1000);
    }
  };
  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden relative">
      <Form {...form}>
        <div
          onKeyDown={(e) => {
            if (e.key === "Enter" && currentStep !== 4) {
              const t = e.target as HTMLElement | null;
              if (t && t.tagName === "TEXTAREA") return;
              e.preventDefault();
            }
          }}
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-1 flex-col overflow-hidden h-full min-h-0"
        >
          {}
          <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden">
            {}
            <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-zinc-900 shrink-0">
              <h1 className="text-lg font-semibold tracking-tight">
                {isView
                  ? t("case.lands.view_details")
                  : isEditing
                    ? t("case.land_form.edit_title")
                    : t("case.land_form.add_title")}
              </h1>
            </div>

            {}
            {!isView && (
              <div className="shrink-0 h-1 bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300 ease-out"
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                />
              </div>
            )}

            {}
            <div className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar">
              {isView ? (
                landDetailQuery.isLoading ? (
                  <div className="space-y-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden animate-pulse"
                      >
                        <div className="h-10 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800" />
                        <div className="p-6 space-y-4">
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-800 rounded" />
                              <div className="h-4 w-32 bg-zinc-100 dark:bg-zinc-800 rounded" />
                            </div>
                            <div className="space-y-2">
                              <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-800 rounded" />
                              <div className="h-4 w-28 bg-zinc-100 dark:bg-zinc-800 rounded" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {}
                    <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                      <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">
                        {t("case.land_form.sections.admin_area")}
                      </div>
                      <div className="p-6 grid md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            {t("case.land_form.fields.state.label")}
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {(apiLandDetail as any)?.state_name || "—"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            {t("case.land_form.fields.mandal.label")}
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {(apiLandDetail as any)?.mandal_name || "—"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            {t("case.land_form.fields.district.label")}
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {(apiLandDetail as any)?.district_name || "—"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            {t("case.land_form.fields.tehsil.label")}
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {(apiLandDetail as any)?.tehsil_name ||
                              (apiLandDetail as any)?.tehsil_name_en ||
                              "—"}
                          </p>
                        </div>
                      </div>
                    </section>
                    {}
                    <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                      <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">
                        {t("case.land_form.sections.sub_admin_area")}
                      </div>
                      <div className="p-6 grid md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            {t("case.land_form.fields.pargana.label")}
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {(apiLandDetail as any)?.pargana_name || "—"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            {t("case.land_form.fields.village.label")}
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {(apiLandDetail as any)?.village_name || "—"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            {t("case.land_form.fields.ri.label")}
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {(apiLandDetail as any)?.ricircle_name || "—"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            {t("case.land_form.fields.rsi.label")}
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {(apiLandDetail as any)?.rsicircle_name || "—"}
                          </p>
                        </div>
                      </div>
                    </section>
                    {}
                    <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                      <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">
                        {t("case.land_form.sections.plot_selection")}
                      </div>
                      <div className="p-6 grid md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            {t("case.land_form.fields.khata.label")}
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {(apiLandDetail as any)?.khata_number || "—"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            {(apiLandDetail as any)?.is_manual
                              ? t("case.land_form.fields.khasra_no.label")
                              : t("case.land_form.fields.plot.label")}
                          </p>
                          <p className="text-sm font-medium text-foreground break-all">
                            {(apiLandDetail as any)?.khasra_no || "—"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            {t("case.land_form.fields.total_land_area.label")}
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {(apiLandDetail as any)?.total_land
                              ? `${Number((apiLandDetail as any).total_land).toFixed(4)} Hec.`
                              : "—"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            {t("case.land_form.fields.disputed_area.label")}
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {(apiLandDetail as any)?.disputed_land
                              ? `${Number((apiLandDetail as any).disputed_land).toFixed(4)} Hec.`
                              : "—"}
                          </p>
                        </div>
                        {(apiLandDetail as any)?.is_manual && (
                          <>
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">
                                {t("case.land_form.fields.village.name_label")}
                              </p>
                              <p className="text-sm font-medium text-foreground">
                                {(apiLandDetail as any)?.village_name || "—"}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">
                                {t("case.land_form.fields.land_type.label")}
                              </p>
                              <p className="text-sm font-medium text-foreground">
                                {(apiLandDetail as any)?.land_type || "—"}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </section>
                    {}
                    {((apiLandDetail as any)?.land_type_desc ||
                      (apiLandDetail as any)?.actual_owners?.length > 0 ||
                      (apiLandDetail as any)?.orders?.length > 0) && (
                      <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                        <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">
                          {t("case.land_form.sections.ebhulekh_details")}
                        </div>
                        <div className="p-6 space-y-4">
                          {(apiLandDetail as any)?.land_type_desc && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">
                                {t("case.land_form.labels.land_type_desc")}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {(apiLandDetail as any).land_type_desc}
                              </p>
                            </div>
                          )}
                          {(apiLandDetail as any)?.actual_owners?.length >
                            0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-muted-foreground">
                                {t("case.land_form.labels.actual_owners")}
                              </p>
                              <div className="space-y-2">
                                {(apiLandDetail as any).actual_owners.map(
                                  (o: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className="text-sm bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800"
                                    >
                                      <span className="font-semibold text-foreground">
                                        {o.name}
                                      </span>
                                      {o.father?.trim() && (
                                        <span className="ml-1 text-muted-foreground">
                                          (S/O {o.father})
                                        </span>
                                      )}
                                      {o.address?.trim() && (
                                        <div className="mt-1 text-muted-foreground">
                                          {o.address}
                                        </div>
                                      )}
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                          {(apiLandDetail as any)?.orders?.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-muted-foreground">
                                {t("case.land_form.labels.orders")}
                              </p>
                              <div className="space-y-2">
                                {(apiLandDetail as any).orders.map(
                                  (ord: string, idx: number) => (
                                    <div
                                      key={idx}
                                      className="text-sm bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 text-muted-foreground"
                                    >
                                      {ord}
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </section>
                    )}
                    {}
                    <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                      <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">
                        {t("case.land_form.sections.remarks_title")}
                      </div>
                      <div className="p-6">
                        <p className="text-sm text-foreground whitespace-pre-wrap wrap-break-word">
                          {(apiLandDetail as any)?.remarks || "—"}
                        </p>
                      </div>
                    </section>
                    {isAllowedToUpdateLandStatus && (
                      <EntityStatusPanel control={form.control as any} name={"status_code" as any} title={t("case.land_form.sections.land_status_title")} statusList={landStatusList} isUpdating={isUpdatingLandStatus} onUpdate={handleUpdateLandStatus} existingCode={(apiLandDetail as any)?.status_detail?.code} watchCode={(form.watch as any)("status_code")} />
                    )}
                  </div>
                )
              ) : (
                <div className="space-y-6">
                  {currentStep === 1 && (
                    <>
                      {}
                      <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                        <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">
                          {t("case.land_form.sections.admin_area")}
                        </div>
                        <div className="p-6 space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <CustomComboboxField
                              control={form.control as any}
                              name="state_code_census"
                              label={t("case.land_form.fields.state.label")}
                              placeholder={t(
                                "case.land_form.fields.state.placeholder",
                              )}
                              required
                              readOnly
                              loading={stateList.isLoading}
                              options={
                                stateList?.data?.map((item) => ({
                                  label: item.state_name,
                                  value: item.state_code_census,
                                })) ?? []
                              }
                            />
                            <CustomComboboxField
                              control={form.control as any}
                              name="mandal_code"
                              label={t("case.land_form.fields.mandal.label")}
                              placeholder={t(
                                "case.land_form.fields.mandal.placeholder",
                              )}
                              required
                              readOnly
                              disabled
                              loading={mandalList.isLoading}
                              options={
                                mandalList?.data?.map((item) => ({
                                  label: item.mandal_name,
                                  value: item.mandal_code,
                                })) ?? []
                              }
                              onSelect={(val) => {
                                const opt = mandalList?.data?.find(
                                  (x: any) =>
                                    String(x.mandal_code) === String(val),
                                );
                                form.setValue(
                                  "mandal_name",
                                  (opt as any)?.mandal_name ?? null,
                                );
                              }}
                            />
                            <CustomComboboxField
                              control={form.control as any}
                              name="district_code_census"
                              label={t("case.land_form.fields.district.label")}
                              placeholder={t(
                                "case.land_form.fields.district.placeholder",
                              )}
                              required
                              readOnly
                              disabled
                              loading={districtList.isLoading}
                              options={
                                districtList?.data?.map((item) => ({
                                  label: item.district_name,
                                  value: item.district_code_census,
                                })) ?? []
                              }
                              onSelect={(val) => {
                                const opt = districtList?.data?.find(
                                  (x: any) =>
                                    String(x.district_code_census) ===
                                    String(val),
                                );
                                form.setValue(
                                  "district_name",
                                  (opt as any)?.district_name ?? null,
                                );
                              }}
                            />
                            <CustomComboboxField
                              control={form.control as any}
                              name="tehsil_code_census"
                              label={t("case.land_form.fields.tehsil.label")}
                              placeholder={t(
                                "case.land_form.fields.tehsil.placeholder",
                              )}
                              required
                              readOnly
                              disabled
                              loading={tehsilList.isLoading}
                              options={
                                tehsilList?.data?.map((item) => ({
                                  label: item.tehsil_name,
                                  value: item.tehsil_code_census,
                                })) ?? []
                              }
                              onSelect={(val) => {
                                const opt = tehsilList?.data?.find(
                                  (x: any) =>
                                    String(x.tehsil_code_census) ===
                                    String(val),
                                );
                                form.setValue(
                                  "tehsil_name",
                                  (opt as any)?.tehsil_name ?? null,
                                );
                                form.setValue(
                                  "tehsil_name_en",
                                  (opt as any)?.tehsil_name_en ??
                                    (opt as any)?.tehsil_name ??
                                    null,
                                );
                              }}
                            />
                          </div>
                        </div>
                      </section>
                    </>
                  )}
                  {currentStep === 2 && (
                    <>
                      {}
                      <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                        <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">
                          {t("case.land_form.sections.sub_admin_area")}
                        </div>
                        <div className="p-6 space-y-4">
                          <div className="grid md:grid-cols-2 gap-4 items-start">
                            <CustomComboboxField
                              control={form.control as any}
                              name="pargana_code"
                              label={t("case.land_form.fields.pargana.label")}
                              readOnly={isView}
                              disabled={!watchTehsil}
                              placeholder={t(
                                "case.land_form.fields.pargana.placeholder",
                              )}
                              loading={parganaList.isLoading}
                              options={
                                parganaList?.data?.map((item) => ({
                                  label: item.pargana_name,
                                  value: item.pargana_code_new,
                                })) ?? []
                              }
                              onSelect={(val) => {
                                const opt = parganaList?.data?.find(
                                  (x: any) =>
                                    String(x.pargana_code_new) === String(val),
                                );
                                form.setValue(
                                  "pargana_name",
                                  (opt as any)?.pargana_name ?? null,
                                );
                              }}
                            />
                            <CustomComboboxField
                              control={form.control as any}
                              name="village_code_census"
                              label={t("case.land_form.fields.village.label")}
                              required
                              readOnly={isView}
                              disabled={!watchTehsil}
                              placeholder={t(
                                "case.land_form.fields.village.placeholder",
                              )}
                              loading={villageList.isLoading}
                              options={
                                villageList?.data
                                  ?.filter(
                                    (item) =>
                                      item.village_code_census !== null &&
                                      item.village_code_census !== "",
                                  )
                                  .map((item) => ({
                                    label: item.vname,
                                    value: item.village_code_census,
                                  })) ?? []
                              }
                              onSelect={(val) => {
                                const opt = villageList?.data?.find(
                                  (x: any) =>
                                    String(x.village_code_census) ===
                                    String(val),
                                );
                                form.setValue(
                                  "village_name",
                                  (opt as any)?.vname ?? null,
                                );
                              }}
                            />
                            <CustomComboboxField
                              control={form.control as any}
                              name="ricircle_code"
                              label={t("case.land_form.fields.ri.label")}
                              readOnly={isView}
                              disabled={!watchTehsil}
                              placeholder={t(
                                "case.land_form.fields.ri.placeholder",
                              )}
                              loading={RIList.isLoading}
                              options={
                                RIList?.data
                                  ?.filter(
                                    (item) =>
                                      item.ricircle_code !== null &&
                                      item.ricircle_code !== "",
                                  )
                                  .map((item) => ({
                                    label: item.ricircle_name,
                                    value: item.ricircle_code,
                                  })) ?? []
                              }
                              onSelect={(val) => {
                                const opt = RIList?.data?.find(
                                  (x: any) =>
                                    String(x.ricircle_code) === String(val),
                                );
                                form.setValue(
                                  "ricircle_name",
                                  (opt as any)?.ricircle_name ?? null,
                                );
                              }}
                            />
                            <CustomComboboxField
                              control={form.control as any}
                              name="rsicircle_code"
                              label={t("case.land_form.fields.rsi.label")}
                              readOnly={isView}
                              disabled={!watchRI}
                              placeholder={t(
                                "case.land_form.fields.rsi.placeholder",
                              )}
                              loading={RSIList.isLoading}
                              options={
                                RSIList?.data
                                  ?.filter(
                                    (item) =>
                                      item.rsicircle_code !== null &&
                                      item.rsicircle_code !== "",
                                  )
                                  .map((item) => ({
                                    label: item.rsicircle_name,
                                    value: item.rsicircle_code,
                                  })) ?? []
                              }
                              onSelect={(val) => {
                                const opt = RSIList?.data?.find(
                                  (x: any) =>
                                    String(x.rsicircle_code) === String(val),
                                );
                                form.setValue(
                                  "rsicircle_name",
                                  (opt as any)?.rsicircle_name ?? null,
                                );
                              }}
                            />
                          </div>
                        </div>
                      </section>
                    </>
                  )}
                  {currentStep === 3 && (
                    <>
                      {}
                      <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                        <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                          <div className="text-sm font-semibold text-foreground">
                            {t("case.land_form.sections.plot_selection")}
                          </div>
                          {!isView && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground font-medium">
                                {t("case.land_form.labels.manual_entry")}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const newVal = !watchIsManual;
                                  form.setValue("is_manual", newVal);

                                  form.setValue("khata_number", null);
                                  form.setValue("plots", []);
                                  form.setValue("khasra_no", "");
                                  form.setValue("owners", []);
                                  form.setValue("total_land_manual", "");
                                  form.setValue("disputed_land", "" as any);
                                }}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${watchIsManual ? "bg-primary" : "bg-neutral-300 dark:bg-neutral-700"}`}
                              >
                                <span
                                  className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${watchIsManual ? "translate-x-4.5" : "translate-x-0.5"}`}
                                />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="p-6 space-y-4">
                          {!watchIsManual ? (

                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="md:col-span-2">
                                <CustomComboboxField
                                  control={form.control as any}
                                  name="khata_number"
                                  label={t("case.land_form.fields.khata.label")}
                                  required
                                  readOnly={isView}
                                  disabled={!watchVillage}
                                  placeholder={t(
                                    "case.land_form.fields.khata.placeholder",
                                  )}
                                  loading={khataList.isLoading}
                                  options={
                                    khataList?.data
                                      ?.filter(
                                        (item) =>
                                          item.khata_number !== null &&
                                          item.khata_number !== "",
                                      )
                                      .map((item) => ({
                                        label: item.khata_number,
                                        value: item.khata_number,
                                      })) ?? []
                                  }
                                  onSelect={() => {
                                    form.setValue("plots", []);
                                    form.setValue("disputed_land", "" as any);
                                  }}
                                />
                              </div>
                              <div className="md:col-span-2">
                                <MultiAutocompleteField
                                  control={form.control as any}
                                  name="plots"
                                  label={t("case.land_form.fields.plot.label")}
                                  required
                                  readonly={
                                    isView || !watchVillage || !watchKhata
                                  }
                                  placeholder={t(
                                    "case.land_form.fields.plot.placeholder",
                                  )}
                                  options={(() => {
                                    const ownersArr =
                                      khataDetail?.data?.owners ?? [];
                                    const khataOwnersText = ownersArr
                                      .map((o: any) => o.name)
                                      .filter(Boolean)
                                      .join(", ");
                                    return (
                                      khataDetail?.data?.plots
                                        ?.filter(
                                          (item) =>
                                            item.khasra_no !== null &&
                                            item.khasra_no !== "",
                                        )
                                        .map((item: any) => {
                                          const perPlotOwner =
                                            khataOwnersText || "—";
                                          return {
                                            label: `${item.khasra_no} (${item.area} ${t("case.lands.hec")})`,
                                            value: item.khasra_no,
                                            owner: perPlotOwner,
                                          } as any;
                                        }) ?? []
                                    );
                                  })()}
                                  renderOption={(opt: any, checked) => (
                                    <div className="flex flex-1 min-w-0 flex-col gap-0.5">
                                      <span
                                        className={`text-sm leading-none ${checked ? "font-medium text-zinc-900 dark:text-zinc-50" : "text-zinc-900 dark:text-zinc-100"}`}
                                      >
                                        {opt.label}
                                      </span>
                                      <span className="text-xs leading-tight text-zinc-600 dark:text-zinc-400 whitespace-normal wrap-break-word">
                                        {(opt as any).owner}
                                      </span>
                                    </div>
                                  )}
                                />
                              </div>
                              {!watchIsManual &&
                                watchPlots &&
                                watchPlots.length > 0 && (
                                  <div className="md:col-span-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 px-3 py-2.5 flex items-center justify-between gap-3">
                                    <div className="space-y-1">
                                      <p className="text-xs font-medium text-muted-foreground leading-none">
                                        {t("case.land_form.labels.total_selected_area")}
                                      </p>
                                      <p className="text-[11px] leading-tight text-amber-700 dark:text-amber-300">
                                        {t("case.land_form.labels.total_selected_area_note")}
                                      </p>
                                    </div>
                                    <span className="text-sm font-semibold text-foreground leading-none shrink-0">
                                      {totalSelectedArea.toFixed(4)}{" "}
                                      {t("case.lands.hec")}
                                    </span>
                                  </div>
                                )}
                              <div className="md:col-span-2">
                                <TextFieldV2
                                  control={form.control as any}
                                  name="disputed_land"
                                  label={t(
                                    "case.land_form.fields.disputed_area.label",
                                  )}
                                  placeholder={t(
                                    "case.land_form.fields.disputed_area.placeholder",
                                  )}
                                  type="text"
                                  inputMode="decimal"
                                  pattern="^[0-9]*\.?[0-9]*$"
                                  onInput={(e) => { const v = (e.target as HTMLInputElement).value; const c = v.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1"); if (v !== c) (e.target as HTMLInputElement).value = c; }}
                                  required={
                                    !isView &&
                                    watchPlots &&
                                    watchPlots.length > 0
                                  }
                                  readonly={
                                    isView ||
                                    !watchPlots ||
                                    watchPlots.length === 0
                                  }
                                />
                              </div>
                            </div>
                          ) : (

                            <div className="space-y-4">
                              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 p-3">
                                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                                  {t(
                                    "case.land_form.labels.manual_entry_notice",
                                  )}
                                </p>
                              </div>
                              <div className="grid md:grid-cols-2 gap-4 items-start">
                                <div className="md:col-span-2">
                                  <TextFieldV2
                                    control={form.control as any}
                                    name="khata_number"
                                    label={t("case.land_form.fields.khata.label")}
                                    placeholder={t(
                                      "case.land_form.fields.khata.enter_placeholder",
                                    )}
                                    required
                                    readonly={isView}
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <ChipInputField
                                    control={form.control as any}
                                    name="khasra_no"
                                    label={t(
                                      "case.land_form.fields.khasra_no.label",
                                    )}
                                    placeholder={t(
                                      "case.land_form.fields.khasra_no.placeholder",
                                    )}
                                    required
                                    readOnly={isView}
                                  />
                                </div>
                                <TextFieldV2
                                  control={form.control as any}
                                  name="total_land_manual"
                                  label={t(
                                    "case.land_form.fields.total_land_area.label",
                                  )}
                                  placeholder={t(
                                    "case.land_form.fields.total_land_area.placeholder",
                                  )}
                                  type="text"
                                  inputMode="decimal"
                                  pattern="^[0-9]*\.?[0-9]*$"
                                  onInput={(e) => { const v = (e.target as HTMLInputElement).value; const c = v.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1"); if (v !== c) (e.target as HTMLInputElement).value = c; }}
                                  required
                                  readonly={isView}
                                />
                                <TextFieldV2
                                  control={form.control as any}
                                  name="disputed_land"
                                  label={t(
                                    "case.land_form.fields.disputed_area.label",
                                  )}
                                  placeholder={t(
                                    "case.land_form.fields.disputed_area.placeholder",
                                  )}
                                  type="text"
                                  inputMode="decimal"
                                  pattern="^[0-9]*\.?[0-9]*$"
                                  onInput={(e) => { const v = (e.target as HTMLInputElement).value; const c = v.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1"); if (v !== c) (e.target as HTMLInputElement).value = c; }}
                                  required
                                  readonly={isView}
                                />
                                <TextFieldV2
                                  control={form.control as any}
                                  name="village_name"
                                  label={t(
                                    "case.land_form.fields.village.name_label",
                                  )}
                                  placeholder={t(
                                    "case.land_form.fields.village.placeholder_enter",
                                  )}
                                  readonly={isView}
                                />
                                <TextFieldV2
                                  control={form.control as any}
                                  name="land_type_description"
                                  label={t(
                                    "case.land_form.fields.land_type.label",
                                  )}
                                  placeholder={t(
                                    "case.land_form.fields.land_type.placeholder",
                                  )}
                                  readonly={isView}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </section>
                      {}
                      {watchIsManual && !isView && (
                        <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                          <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                            <div className="text-sm font-semibold text-foreground">
                              {t("case.land_form.labels.actual_owners_title")}
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={addOwner}
                              className="h-7 text-xs"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              {t("case.land_form.buttons.add_owner")}
                            </Button>
                          </div>
                          <div className="p-6 space-y-3">
                            {(!form.watch("owners") ||
                              form.watch("owners").length === 0) && (
                              <p className="text-xs text-muted-foreground text-center py-4">
                                {t("case.land_form.labels.no_owners_added")}
                              </p>
                            )}
                            {form
                              .watch("owners")
                              ?.map((owner: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="p-4 border rounded-lg bg-muted/40 relative space-y-3"
                                >
                                  <button
                                    type="button"
                                    onClick={() => removeOwner(idx)}
                                    className="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <TextFieldV2
                                      control={form.control as any}
                                      name={`owners.${idx}.name` as any}
                                      label={t(
                                        "case.land_form.fields.owner_name.label",
                                      )}
                                      placeholder={t(
                                        "case.land_form.fields.owner_name.placeholder",
                                      )}
                                      required
                                      readonly={isView}
                                    />
                                    <TextFieldV2
                                      control={form.control as any}
                                      name={`owners.${idx}.father` as any}
                                      label={t(
                                        "case.land_form.fields.owner_father.label",
                                      )}
                                      placeholder={t(
                                        "case.land_form.fields.owner_father.placeholder",
                                      )}
                                      readonly={isView}
                                    />
                                    <TextFieldV2
                                      control={form.control as any}
                                      name={`owners.${idx}.address` as any}
                                      label={t(
                                        "case.land_form.fields.owner_address.label",
                                      )}
                                      placeholder={t(
                                        "case.land_form.fields.owner_address.placeholder",
                                      )}
                                      readonly={isView}
                                      containerClassName="md:col-span-2"
                                    />
                                  </div>
                                </div>
                              ))}
                          </div>
                        </section>
                      )}
                      {watchIsManual &&
                        isView &&
                        form.watch("owners")?.length > 0 && (
                          <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                            <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">
                              {t("case.land_form.labels.actual_owners_title")}
                            </div>
                            <div className="p-6 space-y-2">
                              {form
                                .watch("owners")
                                .map((owner: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="text-sm text-muted-foreground bg-muted p-3 rounded-md border"
                                  >
                                    <span className="font-semibold text-foreground">
                                      {owner.name}
                                    </span>
                                    {owner.father?.trim() && (
                                      <span className="ml-1">
                                        (S/O, D/O, W/O {owner.father})
                                      </span>
                                    )}
                                    {owner.address?.trim() && (
                                      <div className="mt-1 opacity-80">
                                        {owner.address}
                                      </div>
                                    )}
                                  </div>
                                ))}
                            </div>
                          </section>
                        )}
                    </>
                  )}
                  {currentStep === 4 && (
                    <>
                      {}
                      {!watchIsManual && (isView || watchKhata) && (
                        <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                          <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">
                            {t("case.land_form.sections.ebhulekh_details")}
                          </div>
                          <div className="p-6 space-y-4">
                            <div className="space-y-4">
                              <div>
                                <span className="text-sm font-medium">
                                  {t("case.land_form.labels.land_type_desc")}
                                </span>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {form.watch("land_type_description") || "N/A"}
                                </p>
                              </div>

                              {form.watch("owners")?.length > 0 && (
                                <div>
                                  <span className="text-sm font-medium">
                                    {t("case.land_form.labels.actual_owners")}
                                  </span>
                                  <div className="mt-2 space-y-2">
                                    {form
                                      .watch("owners")
                                      .map((owner: any, idx: number) => (
                                        <div
                                          key={idx}
                                          className="text-sm text-muted-foreground bg-muted p-3 rounded-md border"
                                        >
                                          <span className="font-semibold text-foreground">
                                            {owner.name}
                                          </span>
                                          {owner.father?.trim() && (
                                            <span className="ml-1">
                                              (S/O, D/O, W/O {owner.father})
                                            </span>
                                          )}
                                          {owner.address?.trim() && (
                                            <div className="mt-1 opacity-80">
                                              {owner.address}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}

                              {form.watch("orders")?.length > 0 && (
                                <div>
                                  <span className="text-sm font-medium">
                                    {t("case.land_form.labels.orders")}
                                  </span>
                                  <div className="mt-2 space-y-2">
                                    {form
                                      .watch("orders")
                                      .map((order: string, idx: number) => (
                                        <div
                                          key={idx}
                                          className="text-sm text-muted-foreground bg-muted p-3 rounded-md border"
                                        >
                                          {order}
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </section>
                      )}
                      {}
                      {watchIsManual &&
                        isView &&
                        form.watch("owners")?.length > 0 && (
                          <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                            <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">
                              {t("case.land_form.labels.actual_owners_title")}
                            </div>
                            <div className="p-6 space-y-2">
                              {form
                                .watch("owners")
                                .map((owner: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="text-sm text-muted-foreground bg-muted p-3 rounded-md border"
                                  >
                                    <span className="font-semibold text-foreground">
                                      {owner.name}
                                    </span>
                                    {owner.father?.trim() && (
                                      <span className="ml-1">
                                        (S/O, D/O, W/O {owner.father})
                                      </span>
                                    )}
                                    {owner.address?.trim() && (
                                      <div className="mt-1 opacity-80">
                                        {owner.address}
                                      </div>
                                    )}
                                  </div>
                                ))}
                            </div>
                          </section>
                        )}

                      {}
                      {watchIsManual && (
                        <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                          <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">
                            {t("case.land_form.sections.land_record_documents")}
                          </div>
                          <div className="p-6 space-y-4">
                            <p className="text-xs text-muted-foreground">
                              {t(
                                "case.land_form.labels.upload_documents_instruction",
                              )}
                            </p>

                            {}
                            {existingDocs.length > 0 && (
                              <div className="space-y-2">
                                {existingDocs.map((doc: any) => (
                                  <div
                                    key={doc.id}
                                    className="flex items-center gap-3 bg-muted/30 border rounded-lg px-4 py-2.5"
                                  >
                                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <span className="text-xs font-medium text-foreground truncate flex-1">
                                      {doc.file_name || "Document"}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground shrink-0">
                                      {doc.file_size
                                        ? `${(doc.file_size / 1024).toFixed(0)} KB`
                                        : ""}
                                    </span>
                                    {!isView && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          deleteExistingDoc(doc.id)
                                        }
                                        className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {}
                            {pendingFiles.length > 0 && (
                              <div className="space-y-2">
                                {pendingFiles.map((file, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-lg px-4 py-2.5"
                                  >
                                    <Upload className="w-4 h-4 text-blue-500 shrink-0" />
                                    <span className="text-xs font-medium text-foreground truncate flex-1">
                                      {file.name}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground shrink-0">
                                      {(file.size / 1024).toFixed(0)} KB
                                    </span>
                                    {!isView && (
                                      <button
                                        type="button"
                                        onClick={() => removePendingFile(idx)}
                                        className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {}
                            {!isView && (
                              <div>
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  multiple
                                  className="hidden"
                                  onChange={handleFileSelect}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="text-xs"
                                >
                                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                                  {t("case.land_form.buttons.choose_documents")}
                                </Button>
                              </div>
                            )}
                          </div>
                        </section>
                      )}

                      {}
                      <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                        <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">
                          {t("case.land_form.sections.remarks_title")}
                        </div>
                        <div className="p-6 space-y-4">
                          <div>
                            <TextareaField
                              control={form.control as any}
                              name="remarks"
                              label={t("case.land_form.fields.remarks.label")}
                              placeholder={t(
                                "case.land_form.fields.remarks.placeholder",
                              )}
                              readonly={isView}
                            />
                          </div>
                        </div>
                      </section>
                    </>
                  )}
                  {!isView && (
                    <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {t("case.land_form.labels.ebhulekh_note")}
                      </p>
                      <a
                        href="https://ebhulekh.uk.gov.in/public-ror"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-7 px-3 text-[11px] font-medium rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-700 shrink-0"
                      >
                        {t("case.land_form.labels.ebhulekh_btn")} ↗
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {}
            {!isView && (
              <div className="flex items-center justify-between border-t bg-white dark:bg-zinc-900 px-6 py-3 z-10 shrink-0">
                <Button
                  variant="outline"
                  type="button"
                  className="px-5"
                  onClick={handleCancel}
                >
                  {t("case.land_form.buttons.cancel")}
                </Button>
                <div className="flex gap-2">
                  {currentStep > 1 && (
                    <Button
                      variant="outline"
                      type="button"
                      className="px-5"
                      onClick={handleBack}
                    >
                      Back
                    </Button>
                  )}
                  {currentStep < 4 ? (
                    <Button
                      type="button"
                      className="px-6 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleNext}
                      disabled={currentStep === 1 && !isStep1Complete}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      className="px-6"
                      disabled={isUploadingDocs}
                      onClick={handleExplicitSave}
                    >
                      {isUploadingDocs
                        ? t("case.land_form.buttons.uploading")
                        : t("case.land_form.buttons.save")}
                    </Button>
                  )}
                </div>
              </div>
            )}
            {isView && (
              <div className="flex items-center justify-end border-t bg-white dark:bg-zinc-900 px-6 py-3 z-10 shrink-0">
                <Button
                  variant="default"
                  type="button"
                  className="px-6"
                  onClick={handleCancel}
                >
                  {t("case.land_form.buttons.close")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </Form>
    </div>
  );
}

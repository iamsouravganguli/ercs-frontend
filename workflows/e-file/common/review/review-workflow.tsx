"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
  FileText,
  FilePlus,
  Files,
  Eye,
  MapPin,
  Users,
  Loader2,
} from "lucide-react";
import {
  useCaseDetail,
  useCasePartyList,
  useCaseLandList,
  useCaseDocumentList,
  caseDB,
  CommonsApiServices,
  useSessionCheck,
  useCreatePaymentOrder,
  useVerifyPayment,
} from "@/lib";
import toast from "react-hot-toast";
import { useTranslation } from "@/i18n";
import { useEFileFooter } from "../../../../app/case/e-file/[caseId]/layout";
import { StampFeeCard } from "./stamp-fee-card";
import { ChecklistTable } from "./checklist-table";
import { ReceiptDialog } from "./receipt-dialog";
import { ReviewPaymentsSection } from "./payments";
import { useReviewPayments } from "./payments/use-review-payments";

export default function EFileReviewPage() {
  const params = useParams();
  const { caseId } = useParams<{ caseId: string }>();
  const caseNumber = ((caseId as string) ||
    (params?.case_number as string)) as string;
  const router = useRouter();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const checklistAddRef = React.useRef<(() => void) | null>(null);


  const detailQuery = useCaseDetail(caseNumber);
  const caseDetail = detailQuery.data?.result?.data;


  const partyListQuery = useCasePartyList(caseNumber);
  const parties = partyListQuery.data?.result?.data || [];


  const landListQuery = useCaseLandList(caseNumber);
  const lands = landListQuery.data?.result?.data || [];


  const docListQuery = useCaseDocumentList(caseNumber);
  const docListRaw: any = docListQuery.data as unknown as { result?: { data?: unknown[] }; data?: unknown[] };
  const docs: unknown[] = (docListRaw?.result?.data ?? (docListRaw as unknown as { data?: { results?: unknown[] } })?.data?.results ?? (docListRaw as unknown as { results?: unknown[] })?.results ?? (Array.isArray(docListRaw) ? docListRaw : [])) as unknown[];


  const sessionCheck = useSessionCheck();
  const role = sessionCheck.data?.result?.data?.role?.toUpperCase();
  const isViewOnly = ["SA", "RI", "RSI"].includes(role || "");
  const isCourtEditor = ["PO", "CO", "CC"].includes(role || "");
  const isCourtUser = isCourtEditor;


  const reviewPayments = useReviewPayments(caseNumber, isCourtUser);


  useEffect(() => {
    if (isCourtUser) return;
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      try {
        document.body.removeChild(script);
      } catch {}
    };
  }, [isCourtUser]);

  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(false);


  async function handleViewReceipt() {
    try {
      setIsLoadingReceipt(true);
      toast.loading("Fetching receipt details...", { id: "receipt" });

      let paymentId = (caseDetail as any)?.payment_id;

      if (!paymentId) {
        const res = await CommonsApiServices.PaymentOrderList({
          status: "paid",
        });
        const list = res?.result?.data || [];
        const matchingOrder = list.find(
          (item: any) =>
            item.object_id === caseNumber &&
            (item.status?.toLowerCase() === "paid" ||
              item.status?.toLowerCase() === "completed"),
        );
        if (matchingOrder) {
          paymentId = matchingOrder.id;
        }
      }

      if (paymentId) {
        const detailRes =
          await CommonsApiServices.PaymentOrderDetail(paymentId);
        const fullData = detailRes?.result?.data;
        if (fullData) {
          toast.dismiss("receipt");
          setReceiptData(fullData);
          setIsReceiptOpen(true);
          return;
        }
      }

      toast.dismiss("receipt");
      toast.error("No paid transaction found for this case.");
    } catch (err) {
      toast.dismiss("receipt");
      toast.error("Failed to load payment receipt.");
    } finally {
      setIsLoadingReceipt(false);
    }
  }


  const createOrderMutation = useCreatePaymentOrder();
  const verifyPaymentMutation = useVerifyPayment();


  async function handleLaunchPayment() {
    try {
      setIsPaymentProcessing(true);
      toast.loading("Initiating secure gateway...", { id: "payment" });
      createOrderMutation.mutate(
        {
          model: "casemodel",
          object_id: caseNumber,
          amount: 2 * 100,
          description: "Stamp Fee",
          metadata: {
            case_number: caseNumber,
            fee_type: "Stamp Fee",
          },
        },
        {
          onSuccess: (data: any) => {
            toast.dismiss("payment");
            const orderData = data.result?.data;
            if (!orderData) {
              toast.error("Failed to retrieve Razorpay order details");
              setIsPaymentProcessing(false);
              return;
            }


            if (orderData.is_mock || orderData.gateway_mode === "mock") {
              verifyPaymentMutation.mutate(
                {
                  razorpay_order_id: orderData.razorpay_order_id,
                  razorpay_payment_id: `pay_mock_${Date.now()}`,
                  razorpay_signature: "mock_signature",
                },
                {
                  onSuccess: () => {
                    setIsPaymentProcessing(false);
                    toast.success("Stamp Fee Paid Successfully!");
                    detailQuery.refetch();
                  },
                  onError: () => {
                    setIsPaymentProcessing(false);
                    toast.error("Payment verification failed.");
                  },
                },
              );
              return;
            }

            if (typeof (window as any).Razorpay === "undefined") {
              toast.error(
                "Payment gateway failed to load. Check internet and retry.",
              );
              setIsPaymentProcessing(false);
              return;
            }

            const razorpay = new (window as any).Razorpay({
              key: orderData.key,
              amount: orderData.amount,
              currency: orderData.currency,
              name: "RCCMS Uttarakhand",
              description: "Stamp Fee",
              order_id: orderData.razorpay_order_id,
              handler: async function (response: any) {
                toast.loading("Verifying transaction signature...", {
                  id: "verify",
                });
                verifyPaymentMutation.mutate(
                  {
                    razorpay_order_id: orderData.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                  },
                  {
                    onSuccess: () => {
                      toast.dismiss("verify");
                      setIsPaymentProcessing(false);
                      toast.success("Stamp Fee Paid Successfully!");
                      detailQuery.refetch();
                    },
                    onError: () => {
                      toast.dismiss("verify");
                      setIsPaymentProcessing(false);
                      toast.error("Payment verification failed.");
                    },
                  },
                );
              },
              modal: {
                ondismiss() {
                  setIsPaymentProcessing(false);
                  toast.error("Payment modal cancelled.");
                },
              },
              theme: {
                color: "#0f766e",
              },
            });

            razorpay.open();
          },
          onError: (err: any) => {
            toast.dismiss("payment");
            setIsPaymentProcessing(false);
            toast.error(err?.message || "Failed to initiate payment gateway.");
          },
        },
      );
    } catch (e) {
      setIsPaymentProcessing(false);
      toast.error("An unexpected error occurred.");
    }
  }


  const CLAIMANT_CODES = [
    "CIT_PLAINTIFF",
    "CIT_APPELLANT",
    "CIT_REVISIONIST",
    "CIT_PETITIONER",
  ] as const;
  const isClaimant = (code?: string | null) =>
    !!code && (CLAIMANT_CODES as readonly string[]).includes(code);
  const claimantParties = parties.filter((p: any) =>
    isClaimant(p.party_type_detail?.code),
  );
  const opponentParties = parties.filter(
    (p: any) =>
      !!p.party_type_detail?.code && !isClaimant(p.party_type_detail?.code),
  );
  const hasClaimant = claimantParties.length >= 1;
  const hasOpponent = opponentParties.length >= 1;
  const hasClaimantVerified =
    claimantParties.length > 0 &&
    claimantParties.every(
      (p: any) =>
        p.is_phone_verified ||
        ["PARTY_OTP_VERIFIED", "PARTY_VERIFIED"].includes(
          p.status_detail?.code || "",
        ),
    );

  const hasMinParties = hasClaimant && hasOpponent && (isCourtUser ? true : hasClaimantVerified);

  const hasCaseDetail = !!caseDetail?.court_level && !!caseDetail?.court && !!caseDetail?.act && !!caseDetail?.section;
  const hasMinLands = lands.length >= 1;
  const hasMinDocs = docs.length >= 1;

  const stageCode =
    caseDetail?.current_stage_detail?.code ||
    (caseDetail as any)?.current_stage;
  const statusCode =
    caseDetail?.current_status_detail?.code ||
    (caseDetail as any)?.current_status;

  const isPaid = isCourtUser
    ? (() => {

        const list: any[] = (reviewPayments.payments as any[]) || [];
        if (list.length === 0) return false;
        return list.every((p: any) => {
          const code = p.status_detail?.code || (p.status ? `PAYMENT_${String(p.status).toUpperCase()}` : "");
          if (code !== "PAYMENT_PAID") return false;
          return reviewPayments.hasProof(p.id);
        });
      })()
    : !!caseDetail?.is_paid || stageCode !== "FILING";

  const isChecklistCompleteExceptPayment =
    hasCaseDetail && hasMinParties && hasMinLands && hasMinDocs;

  const allComplete = isChecklistCompleteExceptPayment && isPaid;

  const checklist = [
    {
      id: "initiate",
      label: t("case.efile.steps.initiate.title"),
      isComplete: true,
      icon: FilePlus,
      href: `/case/e-file/${caseNumber}/case-details`,
    },
    {
      id: "case",
      label: t("case.efile.steps.case_details.title"),
      isComplete: hasCaseDetail,
      icon: FileText,
      href: `/case/e-file/${caseNumber}/case-details`,
    },
    {
      id: "parties",
      label: t("case.efile.steps.parties.title"),
      isComplete: hasMinParties,
      icon: Users,
      href: `/case/e-file/${caseNumber}/parties`,
    },
    {
      id: "lands",
      label: t("case.efile.steps.land.title"),
      isComplete: hasMinLands,
      icon: MapPin,
      href: `/case/e-file/${caseNumber}/lands`,
    },
    {
      id: "documents",
      label: t("case.efile.steps.documents.title"),
      isComplete: hasMinDocs,
      icon: Files,
      href: `/case/e-file/${caseNumber}/documents`,
    },
    {
      id: "stamp_fee",
      label: isCourtUser ? t("case.review.payments_label") || t("case.review.stamp_fee_label") : t("case.review.stamp_fee_label"),
      isComplete: isPaid,
      icon: Eye,
      href: `/case/e-file/${caseNumber}/review`,
    },
  ];

  const handleSubmit = async () => {
    if (isViewOnly) {
      toast.error("View-only role — cannot submit case.");
      return;
    }
    if (!allComplete || !caseDetail) {
      toast.error(t("case.review.submit_error"));
      return;
    }

    setIsSubmitting(true);
    try {

      const payload = {
        court_level: caseDetail.court_level?.id || null,
        case_nature: caseDetail.case_nature?.id || null,
        appeal_type: caseDetail.appeal_type?.id || null,
        court: caseDetail.court?.id || null,
        act: caseDetail.act?.id || null,
        section: caseDetail.section?.id || null,
        description: caseDetail.description || "",
        state_code_census: caseDetail.state_code_census || "05",
        state_name: caseDetail.state_name || "उत्तराखण्ड",
        mandal_code: caseDetail.mandal_code || null,
        mandal_name: caseDetail.mandal_name || null,
        district_code_census: caseDetail.district_code_census || null,
        district_name: caseDetail.district_name || null,
        tehsil_code_census: caseDetail.tehsil_code_census || null,
        tehsil_name: caseDetail.tehsil_name || null,
        is_submitted: true,
      };

      const res: any = await CommonsApiServices.CaseDetailWriteService(payload, caseNumber);
      const newNumber: string | undefined = res?.result?.data?.case_number || res?.data?.case_number || res?.case_number;


      await caseDB.court_details_drafts
        .where({ case_number: caseNumber })
        .delete();
      await caseDB.land_drafts.where({ case_number: caseNumber }).delete();
      await caseDB.documents.where({ case_number: caseNumber }).delete();

      toast.success(t("case.review.submit_success"));

      if (newNumber && newNumber !== caseNumber && newNumber.startsWith("CIN")) {
        router.push(`/case/${newNumber}/timeline`);
      } else {
        router.push(`/case/${caseNumber}/timeline`);
      }
    } catch (err: any) {
      console.error("Failed to submit case:", err);
      const msg = err?.response?.data?.errors?.detail || err?.response?.data?.message || err?.message;
      toast.error(msg || t("case.review.submit_failed"));
    } finally {
      setIsSubmitting(false);
    }
  };


  const footerCtx = useEFileFooter();
  useEffect(() => {
    if (!footerCtx.setFooterConfig) return;
    footerCtx.setFooterConfig({
      nextLabel: t("case.review.submit_btn"),
      nextDisabled: isViewOnly || !allComplete || isSubmitting || stageCode !== "FILING",
      onNext: handleSubmit,
    });
    return () => footerCtx.setFooterConfig?.({});

  }, [allComplete, isSubmitting, stageCode, t, isViewOnly]);

  const isLoadingData =
    detailQuery.isLoading ||
    partyListQuery.isLoading ||
    landListQuery.isLoading;

  if (isLoadingData) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-transparent">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground animate-pulse">
            {t("case.review.loading")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isCourtUser ? (
        <ReviewPaymentsSection
          caseNumber={caseNumber}
          isSubmitted={!!caseDetail?.is_submitted || stageCode !== "FILING"}
          checklistAddRef={checklistAddRef}
        />
      ) : (
        <StampFeeCard
          isPaid={isPaid}
          isCourtUser={isCourtUser}
          isPaymentProcessing={isPaymentProcessing}
          isLoadingReceipt={isLoadingReceipt}
          onPay={handleLaunchPayment}
          onViewReceipt={handleViewReceipt}
        />
      )}

      <ChecklistTable
        items={checklist}
        isCourtUser={isCourtUser}
        isPaid={isPaid}
        isPaymentProcessing={isPaymentProcessing}
        isLoadingReceipt={isLoadingReceipt}
        onNavigate={(href) => router.push(href)}
        onPay={handleLaunchPayment}
        onAddPayment={() => checklistAddRef.current?.()}
        onViewReceipt={handleViewReceipt}
      />

      <ReceiptDialog
        open={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
        receiptData={receiptData}
        caseNumber={caseNumber}
      />
    </div>
  );
}

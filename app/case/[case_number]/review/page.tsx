"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  FileText,
  MapPin,
  Users,
  CheckCircle2,
  Loader2,
  CreditCard,
  Check,
  Receipt,
} from "lucide-react";
import { useCaseDetail, useCasePartyList, useCaseLandList, caseDB, useSessionCheck, useCreatePaymentOrder, useVerifyPayment } from '@/lib/query';
import { CommonsApiServices } from '@/lib/services';
import toast from "react-hot-toast";
import { useTranslation } from "@/i18n";
import { StatusBadge } from "@/components/ui/status-badge";

export default function ReviewSubmitPage() {
  const params = useParams();
  const router = useRouter();
  const { t, lang } = useTranslation();
  const caseNumber = params?.case_number as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);


  const detailQuery = useCaseDetail(caseNumber);
  const caseDetail = detailQuery.data?.result?.data;


  const partyListQuery = useCasePartyList(caseNumber);
  const parties = partyListQuery.data?.result?.data || [];


  const landListQuery = useCaseLandList(caseNumber);
  const lands = landListQuery.data?.result?.data || [];


  const [docs, setDocs] = useState<any[]>([]);
  useEffect(() => {
    if (!caseNumber) return;
    CommonsApiServices.CaseDocumentListService(caseNumber)
      .then((res: any) => {
        const list =
          res?.result?.data || res?.data?.results || res?.results || [];
        setDocs(list);
      })
      .catch(() => setDocs([]));
  }, [caseNumber]);


  const sessionCheck = useSessionCheck();
  const role = sessionCheck.data?.result?.data?.role?.toUpperCase();
  const isCourtUser = [
    "PO",
    "CO",
    "CC",
    "SA",
    "RI",
    "RSI",
    "PESHKAR",
    "SUPER_ADMIN",
    "JUDGE",
    "CLERK",
  ].includes(role || "");


  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

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
                    onError: (err: any) => {
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


  const hasCaseDetail = !!caseDetail?.case_nature && !!caseDetail?.court;
  const hasMinParties = parties.length >= 2;
  const hasMinLands = lands.length >= 1;
  const hasMinDocs = docs.length >= 1;

  const stageCode =
    caseDetail?.current_stage_detail?.code ||
    (caseDetail as any)?.current_stage;
  const statusCode =
    caseDetail?.current_status_detail?.code ||
    (caseDetail as any)?.current_status;

  const isPaid = isCourtUser || !!caseDetail?.is_paid || stageCode !== "FILING";

  const isChecklistCompleteExceptPayment =
    hasCaseDetail && hasMinParties && hasMinLands && hasMinDocs;

  const allComplete = isChecklistCompleteExceptPayment && isPaid;
  const checklist = [
    {
      id: "case",
      label: t("case.review.case_label"),
      requirement: t("case.review.case_requirement"),
      isComplete: hasCaseDetail,
      summary: hasCaseDetail
        ? `${t("case.review.case_summary_prefix")}${caseDetail.court_level?.name_en || caseDetail.court_level?.name}`
        : t("case.review.case_summary_missing"),
      icon: FileText,
      href: `/case/${caseNumber}`,
    },
    {
      id: "parties",
      label: t("case.review.parties_label"),
      requirement: t("case.review.parties_requirement"),
      isComplete: hasMinParties,
      summary: `${parties.length} ${t("case.review.parties_registered")} ${hasMinParties ? t("case.review.requirement_met") : t("case.review.requires_min_2")}`,
      icon: Users,
      href: `/case/${caseNumber}/parties`,
    },
    {
      id: "lands",
      label: t("case.review.lands_label"),
      requirement: t("case.review.lands_requirement"),
      isComplete: hasMinLands,
      summary: `${lands.length} ${t("case.review.lands_registered")} ${hasMinLands ? t("case.review.requirement_met") : t("case.review.requires_min_1")}`,
      icon: MapPin,
      href: `/case/${caseNumber}/lands`,
    },
    {
      id: "documents",
      label: t("case.review.documents_label"),
      requirement: t("case.review.documents_requirement"),
      isComplete: hasMinDocs,
      summary: `${docs.length} ${t("case.review.documents_uploaded")} ${hasMinDocs ? t("case.review.requirement_met") : t("case.review.requires_min_1")}`,
      icon: FileText,
      href: `/case/${caseNumber}/documents`,
    },
    {
      id: "payment",
      label: t("case.review.stamp_fee_label"),
      requirement: t("case.review.stamp_fee_requirement"),
      isComplete: isPaid,
      summary: isPaid
        ? isCourtUser
          ? t("case.review.stamp_fee_court_skip")
          : t("case.review.stamp_fee_paid")
        : t("case.review.stamp_fee_pending"),
      icon: CreditCard,
      href: `/case/${caseNumber}/review`,
    },
  ];

  const handleSubmit = async () => {
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

      await CommonsApiServices.CaseDetailWriteService(payload, caseNumber);


      await caseDB.court_details_drafts
        .where({ case_number: caseNumber })
        .delete();
      await caseDB.land_drafts.where({ case_number: caseNumber }).delete();
      await caseDB.documents.where({ case_number: caseNumber }).delete();

      toast.success(t("case.review.submit_success"));
      router.push(`/case/${caseNumber}/timeline`);
    } catch (err: any) {
      console.error("Failed to submit case:", err);
      toast.error(err?.message || t("case.review.submit_failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

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
    <div className="flex flex-col h-full bg-background overflow-hidden relative border-r">
      {}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar">
        {}
        <Card className="py-0! gap-0! overflow-hidden">
          <CardHeader className="px-6 py-4 border-b bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950">
            <CardTitle className="text-sm font-semibold">
              {t("case.review.checklist_title")}
            </CardTitle>
          </CardHeader>

          <CardContent className="!px-0">
            <div className="divide-y">
              {checklist.map((section) => {
                const Icon = section.icon;
                const isComplete = section.isComplete;
                return (
                  <div
                    key={section.id}
                    className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-muted/5 transition-colors"
                  >
                    <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          isComplete
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-orange-500/10 text-orange-500"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold flex flex-wrap items-center gap-1.5">
                          {section.label}
                          {!isComplete && (
                            <span className="text-[9px] font-medium text-orange-600 bg-orange-50 border border-orange-200 px-1 py-0.2 rounded shrink-0">
                              {t("case.review.required")}
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed max-w-2xl wrap-break-word">
                          {section.summary}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 mt-2 sm:mt-0">
                      {}
                      <div className="sm:w-28 shrink-0 flex items-center sm:justify-start">
                        <StatusBadge
                          variant={isComplete ? "success" : "warning"}
                        >
                          {isComplete
                            ? t("case.review.status_completed")
                            : t("case.review.status_incomplete")}
                        </StatusBadge>
                      </div>

                      {}
                      <div className="w-20 sm:w-24 shrink-0 flex justify-end">
                        {section.id === "payment" ? (
                          !isComplete ? (
                            <Button
                              size="sm"
                              className="h-7 px-3.5 text-xs font-semibold shrink-0 animate-fade-in"
                              onClick={handleLaunchPayment}
                              disabled={
                                isPaymentProcessing ||
                                !isChecklistCompleteExceptPayment
                              }
                            >
                              {isPaymentProcessing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                t("case.review.pay_btn")
                              )}
                            </Button>
                          ) : (
                            !isCourtUser && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-3.5 text-xs font-semibold shrink-0 animate-fade-in"
                                onClick={handleViewReceipt}
                                disabled={isLoadingReceipt}
                              >
                                {isLoadingReceipt ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  t("case.review.view_btn")
                                )}
                              </Button>
                            )
                          )
                        ) : (
                          <Button
                            size="sm"
                            variant={isComplete ? "outline" : "default"}
                            className="h-7 px-3.5 text-xs font-semibold shrink-0"
                            onClick={() => router.push(section.href)}
                          >
                            {isComplete
                              ? t("case.review.view_btn")
                              : t("case.review.fill_btn")}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {}
      <div className="flex items-center justify-end border-t bg-white dark:bg-neutral-950 px-8 py-3 z-10 relative">
        <Button
          size="default"
          disabled={!allComplete || isSubmitting || stageCode !== "FILING"}
          onClick={handleSubmit}
          className="shadow-md px-6 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white border-transparent transition-all duration-150 disabled:bg-emerald-600/35 disabled:text-white/60 disabled:opacity-60 disabled:cursor-not-allowed dark:bg-emerald-600 dark:hover:bg-emerald-700 dark:disabled:bg-emerald-800/35 dark:disabled:text-white/60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t("case.review.submitting")}
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {t("case.review.submit_btn")}
            </>
          )}
        </Button>
      </div>

      {}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="max-w-md w-full p-0 overflow-hidden bg-white dark:bg-neutral-900 border rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white leading-tight">
                {t("case.review.receipt_title")}
              </DialogTitle>
              <DialogDescription className="text-white/90 text-[10px] sm:text-xs mt-0.5 font-medium">
                {t("case.review.receipt_board_name")}
              </DialogDescription>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {}
            <div className="text-center bg-muted/30 dark:bg-muted/10 rounded-xl py-5 px-4 border border-dashed border-muted-foreground/20">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <Check className="w-3 h-3" /> {t("case.review.receipt_success")}
              </div>
              <div className="text-3xl font-extrabold tracking-tight mt-3 text-foreground">
                ₹2.00
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {t("case.review.receipt_stamp_fee")}
              </p>
            </div>

            {}
            <div className="space-y-4 text-xs">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                  {t("case.review.receipt_case_number")}
                </p>
                <p className="font-medium text-foreground mt-1 break-all">
                  {caseNumber || "-"}
                </p>
              </div>

              <div className="border-t pt-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                  {t("case.review.receipt_date")}
                </p>
                <p className="font-medium text-foreground mt-1">
                  {receiptData?.paid_at
                    ? new Date(receiptData.paid_at).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : new Date().toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                </p>
              </div>

              <div className="border-t pt-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                  {t("case.review.receipt_order_id")}
                </p>
                <p className="font-medium text-foreground mt-1 font-mono break-all selection:bg-teal-100">
                  {receiptData?.razorpay_order_id || "-"}
                </p>
              </div>

              <div className="border-t pt-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                  {t("case.review.receipt_transaction_id")}
                </p>
                <p className="font-medium text-foreground mt-1 font-mono break-all selection:bg-teal-100">
                  {receiptData?.razorpay_payment_id || "-"}
                </p>
              </div>

              {receiptData?.paid_by && (
                <div className="border-t pt-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                    {t("case.review.receipt_paid_by")}
                  </p>
                  <p className="font-medium text-foreground mt-1 wrap-break-word">
                    {receiptData.paid_by}
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

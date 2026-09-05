"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Building2, Eye, Receipt, FileCheck, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useCreatePaymentOrder, useVerifyPayment, useCasePaymentList, useCaseDetail, useSubmitChallan, useUserRole, usePaymentModeList } from '@/lib/query';
import { useTranslation } from "@/i18n";
import toast from "react-hot-toast";

declare global {
  interface Window {
    Razorpay: any;
  }
}

type LedgerEntryType = "DEBIT" | "CREDIT";

type PaymentLedgerItem = {
  id: string;
  case_number: string;
  amount: number;
  fee_type: string;
  notes: string;
  entry_type: LedgerEntryType;
  status: "Pending" | "Completed";
  status_detail?: {
    code: string;
    name: string;
    name_en: string;
  };
  payment_mode_detail?: {
    code: string;
    name: string;
    name_en?: string;
  };
  payment_id?: string;
  razorpay_order_id?: string;
  razorpay_key?: string;
  created_at: string;
  challan_no?: string;
  challan_date?: string;
  bank_name?: string;
  payment_mode?: "ONLINE" | "OFFLINE_CHALLAN" | "OFFLINE_CASH";
};

const getPaymentStatusVariant = (
  code: string,
): "success" | "error" | "warning" | "info" | "neutral" => {
  switch (code) {
    case "PAYMENT_PAID":
      return "success";
    case "PAYMENT_FAILED":
    case "PAYMENT_CANCELLED":
      return "error";
    case "PAYMENT_PENDING_VERIFICATION":
      return "warning";
    case "PAYMENT_CREATED":
      return "info";
    default:
      return "neutral";
  }
};

export default function CasePaymentsPage() {
  const { case_number } = useParams<{ case_number: string }>();
  const { t, lang } = useTranslation();


  const { isCitizenOrAdvocate, canCreatePayment, canPay } = useUserRole();


  const [activeTab, setActiveTab] = useState<"demands" | "ledger">("demands");


  const { data: caseDetailRes, refetch: refetchCase } =
    useCaseDetail(case_number);
  const caseData = caseDetailRes?.result?.data;


  const isScrutinyApproved =
    Boolean((caseData as any)?.is_scrutinized) ||
    Boolean((caseData as any)?.scrutiny_approved) ||
    Boolean((caseData as any)?.is_scrutiny_approved) ||
    (caseData?.current_status_detail?.code
      ? [
          "APPROVED",
          "REGISTERED",
          "ADMITTED",
          "HEARING",
          "NOTICE_ISSUED",
        ].includes(caseData.current_status_detail.code)
      : caseData?.current_stage_detail?.code
        ? caseData.current_stage_detail.code !== "SCRUTINY" &&
          caseData.current_stage_detail.code !== "DRAFT"
        : true);


  const { data: backendPaymentsRes, refetch: refetchBackendPayments } =
    useCasePaymentList(
      case_number,
      activeTab === "ledger" ? { status: "paid" } : undefined,
    );
  const backendPayments =
    (backendPaymentsRes as any)?.result?.data ||
    (backendPaymentsRes as any)?.data ||
    [];


  const { data: paymentModesRes } = usePaymentModeList();
  const paymentModes = paymentModesRes?.result?.data || [];

  const createOrderMutation = useCreatePaymentOrder();
  const verifyPaymentMutation = useVerifyPayment();
  const submitChallanMutation = useSubmitChallan();

  const [payingId, setPayingId] = useState("");


  const [isDebitOpen, setIsDebitOpen] = useState(false);
  const [isCreditOpen, setIsCreditOpen] = useState(false);
  const [feeType, setFeeType] = useState("");
  const [feeAmount, setFeeAmount] = useState("");
  const [feeNotes, setFeeNotes] = useState("");


  const [offlineChallanNo, setOfflineChallanNo] = useState("");
  const [offlineBank, setOfflineBank] = useState("");
  const [offlinePaymentMode, setOfflinePaymentMode] = useState<
    "OFFLINE_CHALLAN" | "OFFLINE_CASH"
  >("OFFLINE_CASH");


  const [isChallanOpen, setIsChallanOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(
    null,
  );
  const [challanNo, setChallanNo] = useState("");
  const [challanDate, setChallanDate] = useState("");
  const [treasuryBank, setTreasuryBank] = useState("");

  const handleDebitClose = (open: boolean) => {
    setIsDebitOpen(open);
    if (!open) {
      setFeeType("");
      setFeeAmount("");
      setFeeNotes("");
    }
  };
  const handleCreditClose = (open: boolean) => {
    setIsCreditOpen(open);
    if (!open) {
      setFeeType("");
      setFeeAmount("");
      setFeeNotes("");
      setOfflineChallanNo("");
      setOfflineBank("");
    }
  };
  const handleChallanClose = (open: boolean) => {
    setIsChallanOpen(open);
    if (!open) {
      setSelectedPaymentId(null);
      setChallanNo("");
      setChallanDate("");
      setTreasuryBank("");
    }
  };


  const openViewDetail = (item: any) => {
    if (!case_number) return;
    const width = 850;
    const height = 800;

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

    const itemId = item?.id || "initial-filing";
    window.open(
      `/case/${encodeURIComponent(case_number)}/payments/view?id=${encodeURIComponent(itemId)}`,
      `PaymentDetail_${itemId}`,
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no`,
    );
  };


  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);


  async function addDebitEntry() {
    if (!canCreatePayment) return;
    if (!isScrutinyApproved) {
      toast.error(t("payments.scrutiny_required_banner"));
      return;
    }
    const amount = Number(feeAmount);
    if (!feeType.trim() || isNaN(amount) || amount <= 0) return;

    try {
      toast.loading(t("payments.toasts.submitting_demand"), { id: "debit" });

      createOrderMutation.mutate(
        {
          model: "casemodel",
          object_id: case_number,
          amount: amount * 100,
          description: feeType.trim(),
          metadata: {
            case_number,
            entry_type: "DEBIT",
            notes: feeNotes.trim(),
            fee_type: feeType.trim(),
          },
        },
        {
          onSuccess: () => {
            toast.dismiss("debit");
            toast.success(t("payments.toasts.debit_added"));
            handleDebitClose(false);
            refetchBackendPayments();
          },
          onError: (err: any) => {
            toast.dismiss("debit");
            toast.error(err?.message || "Failed to add debit entry.");
          },
        },
      );
    } catch (e) {
      toast.dismiss("debit");
      toast.error("Failed to add debit entry.");
    }
  }


  async function addCreditEntry() {
    if (!canCreatePayment) return;
    if (!isScrutinyApproved) {
      toast.error(t("payments.scrutiny_required_banner"));
      return;
    }
    const amount = Number(feeAmount);
    if (!feeType.trim() || isNaN(amount) || amount <= 0) return;

    try {
      toast.loading(t("payments.toasts.recording_credit"), { id: "credit" });

      createOrderMutation.mutate(
        {
          model: "casemodel",
          object_id: case_number,
          amount: amount * 100,
          description: feeType.trim(),
          metadata: {
            case_number,
            entry_type: "CREDIT",
            notes: feeNotes.trim(),
            fee_type: feeType.trim(),
            payment_mode: offlinePaymentMode,
            challan_no: offlineChallanNo.trim(),
            bank_name: offlineBank.trim(),
          },
        },
        {
          onSuccess: () => {
            toast.dismiss("credit");
            toast.success(t("payments.toasts.credit_recorded"));
            handleCreditClose(false);
            refetchBackendPayments();
          },
          onError: (err: any) => {
            toast.dismiss("credit");
            toast.error(err?.message || "Failed to record credit payment.");
          },
        },
      );
    } catch (e) {
      toast.dismiss("credit");
      toast.error("Failed to record credit payment.");
    }
  }


  async function handleLaunchPayment(orderOrItem: any, defaultFeeType: string) {
    let orderId = orderOrItem?.razorpay_order_id;
    let paymentAmountInPaise = Math.round((orderOrItem?.amount || 2) * 100);
    let keyId =
      orderOrItem?.razorpay_key ||
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      "rzp_test_RcCmsKey123";

    setPayingId(orderOrItem?.id || "initial-filing");

    try {
      if (!orderId) {
        toast.loading(t("payments.toasts.creating_order"), { id: "razorpay" });

        const createdRes = await createOrderMutation.mutateAsync({
          model: "casemodel",
          object_id: case_number,
          amount: paymentAmountInPaise,
          description: defaultFeeType,
          metadata: {
            case_number,
            entry_type: "CREDIT",
            fee_type: defaultFeeType,
          },
        });

        const newOrder = createdRes?.result?.data;
        orderId = newOrder?.razorpay_order_id;
        paymentAmountInPaise = newOrder?.amount || paymentAmountInPaise;
        keyId = (newOrder as any)?.razorpay_key || keyId;
        toast.dismiss("razorpay");
      }

      if (!orderId) {
        toast.error(t("payments.toasts.order_failed"));
        setPayingId("");
        return;
      }

      const options = {
        key: keyId,
        amount: paymentAmountInPaise,
        currency: "INR",
        name: "Uttarakhand Revenue Court",
        description: `Payment for Case No: ${case_number}`,
        order_id: orderId,
        handler: async function (response: any) {
          toast.loading(t("payments.toasts.verifying_payment"), {
            id: "verify",
          });

          verifyPaymentMutation.mutate(
            {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            },
            {
              onSuccess: () => {
                toast.dismiss("verify");
                toast.success(t("payments.toasts.payment_verified"));
                refetchBackendPayments();
                refetchCase();
                setPayingId("");
              },
              onError: (err: any) => {
                toast.dismiss("verify");
                toast.error(err?.message || "Payment verification failed.");
                setPayingId("");
              },
            },
          );
        },
        prefill: {
          name: (caseData as any)?.petitioner_name || "Court Litigant",
          contact: "9999999999",
          email: "court.filing@uk.gov.in",
        },
        theme: {
          color: "#0f172a",
        },
        modal: {
          ondismiss: function () {
            setPayingId("");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.dismiss("razorpay");
      toast.error(err?.message || "Payment initiation failed.");
      setPayingId("");
    }
  }


  async function handleUploadChallan() {
    if (
      !selectedPaymentId ||
      !challanNo.trim() ||
      !challanDate.trim() ||
      !treasuryBank.trim()
    ) {
      toast.error(t("payments.toasts.fill_all_challan"));
      return;
    }

    try {
      toast.loading(t("payments.toasts.submitting_challan"), { id: "challan" });

      submitChallanMutation.mutate(
        {
          pk: selectedPaymentId,
          payload: {
            challan_no: challanNo.trim(),
            challan_date: challanDate,
            bank_name: treasuryBank.trim(),
          },
        },
        {
          onSuccess: () => {
            toast.dismiss("challan");
            toast.success(t("payments.toasts.challan_submitted"));
            handleChallanClose(false);
            refetchBackendPayments();
          },
          onError: (err: any) => {
            toast.dismiss("challan");
            toast.error(err?.message || "Failed to upload Challan details.");
          },
        },
      );
    } catch (e) {
      toast.dismiss("challan");
      toast.error("Failed to upload Challan details.");
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat(lang === "hi" ? "hi-IN" : "en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  }

  const isInitialFilingPaid = !!caseData?.is_paid;


  const backendSummary = (backendPaymentsRes as any)?.result?.summary;


  const displayedItems: PaymentLedgerItem[] = backendPayments.map((bp: any) => {
    const isPaid =
      bp.status === "paid" || bp.status_detail?.code === "PAYMENT_PAID";
    const metadata = bp.metadata || {};
    return {
      id: String(bp.id),
      case_number,
      amount: bp.amount_in_inr ?? (bp.amount ? bp.amount / 100 : 0),
      fee_type:
        bp.description ||
        metadata.fee_type ||
        t("case.payments.initial_filing_fee"),
      notes: metadata.notes || "",
      entry_type: metadata.entry_type || (isPaid ? "CREDIT" : "DEBIT"),
      status: isPaid ? "Completed" : "Pending",
      status_detail: bp.status_detail,
      razorpay_order_id: bp.razorpay_order_id,
      razorpay_key: bp.razorpay_key,
      created_at: bp.created_at || new Date().toISOString(),
      challan_no: metadata.challan_no,
      bank_name: metadata.bank_name,
      payment_mode: metadata.payment_mode || "ONLINE",
      payment_mode_detail: bp.payment_mode_detail,
    };
  });


  const totalDebits = backendSummary?.total_debits ?? 0;
  const totalCredits = backendSummary?.total_credits ?? 0;
  const netBalanceDue = backendSummary?.net_balance_due ?? 0;

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden relative border-r">
      {}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar">
        {}
        <div className="flex items-center gap-2 border-b pb-3">
          <Button
            variant={activeTab === "demands" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("demands")}
            className="gap-2 text-xs font-semibold"
          >
            <span>{t("payments.tabs.demands")}</span>
          </Button>

          <Button
            variant={activeTab === "ledger" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("ledger")}
            className="gap-2 text-xs font-semibold"
          >
            <span>{t("payments.tabs.ledger")}</span>
          </Button>
        </div>

        {}
        {!isCitizenOrAdvocate && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border bg-[#f1f1f1] dark:bg-neutral-950 p-4 flex items-center gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-muted-foreground tracking-wider">
                  {t("case.payments.total_debit")}
                </p>
                <p className="text-2xl font-bold mt-0.5 text-foreground">
                  {formatCurrency(totalDebits)}
                </p>
              </div>
            </div>

            <div className="rounded-xl border bg-[#f1f1f1] dark:bg-neutral-950 p-4 flex items-center gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-muted-foreground tracking-wider">
                  {t("case.payments.total_credit")}
                </p>
                <p className="text-2xl font-bold mt-0.5 text-foreground">
                  {formatCurrency(totalCredits)}
                </p>
              </div>
            </div>

            <div className="rounded-xl border bg-[#f1f1f1] dark:bg-neutral-950 p-4 flex items-center gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-muted-foreground tracking-wider">
                  {t("case.payments.net_balance")}
                </p>
                <p className="text-2xl font-bold mt-0.5 text-foreground">
                  {formatCurrency(netBalanceDue)}
                </p>
              </div>
            </div>
          </div>
        )}

        {}
        {!isScrutinyApproved && canCreatePayment && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-center gap-3 text-amber-700 dark:text-amber-400">
            <Lock className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-xs font-medium leading-relaxed">
              {t("payments.scrutiny_required_banner")}
            </p>
          </div>
        )}

        {}
        <Card className="py-0! gap-0! overflow-hidden">
          <CardHeader className="px-6 py-3 border-b bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-left">
                <CardTitle className="text-sm font-semibold">
                  {activeTab === "ledger"
                    ? t("case.payments.ledger_title")
                    : t("case.payments.case_transactions_title")}
                </CardTitle>
                {activeTab === "ledger" && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 font-normal">
                    {t("payments.ledger_only_note")}
                  </p>
                )}
              </div>
              {canCreatePayment && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!isScrutinyApproved}
                    onClick={() => setIsCreditOpen(true)}
                    className="w-full sm:w-auto text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    title={
                      !isScrutinyApproved
                        ? t("payments.scrutiny_required_banner")
                        : ""
                    }
                  >
                    <Building2 className="w-4 h-4 mr-1.5" />
                    <span>{t("case.payments.record_credit")}</span>
                    {!isScrutinyApproved && (
                      <Lock className="w-3 h-3 ml-1.5 text-amber-600" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    disabled={!isScrutinyApproved}
                    onClick={() => setIsDebitOpen(true)}
                    className="w-full sm:w-auto text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    title={
                      !isScrutinyApproved
                        ? t("payments.scrutiny_required_banner")
                        : ""
                    }
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    <span>{t("case.payments.add_debit")}</span>
                    {!isScrutinyApproved && (
                      <Lock className="w-3 h-3 ml-1.5 text-amber-200" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            <div className="min-w-full align-middle">
              <table className="min-w-full divide-y divide-border text-left">
                <tbody className="divide-y divide-border bg-card">
                  {}
                  {displayedItems.map((item) => {
                    const isCredit = item.entry_type === "CREDIT";
                    const isSettled =
                      isCredit ||
                      item.status === "Completed" ||
                      item.status_detail?.code === "PAYMENT_PAID";
                    const statusCode =
                      item.status_detail?.code ||
                      (isSettled ? "PAYMENT_PAID" : "PAYMENT_CREATED");
                    const isPaidOrOfflineCourt =
                      isSettled ||
                      item.status === "Completed" ||
                      item.status_detail?.code === "PAYMENT_PAID" ||
                      item.entry_type === "CREDIT" ||
                      item.payment_mode === "OFFLINE_CHALLAN" ||
                      item.payment_mode === "OFFLINE_CASH" ||
                      !!item.challan_no;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-muted/5 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground">
                              {item.fee_type}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {activeTab === "ledger" && (
                                <Badge
                                  variant="secondary"
                                  className={`text-[10px] px-1.5 py-0 font-bold ${
                                    isCredit
                                      ? "bg-green-500/10 text-green-700"
                                      : "bg-blue-500/10 text-blue-700"
                                  }`}
                                >
                                  {item.entry_type}
                                </Badge>
                              )}
                              {item.notes && (
                                <span className="text-[10px] text-muted-foreground truncate max-w-[250px]">
                                  {item.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-xs font-semibold text-foreground/80">
                          {(() => {
                            const modeDetail = item.payment_mode_detail;
                            const matchedMode = paymentModes.find(
                              (pm: any) => pm.code === item.payment_mode,
                            );
                            const modeName = modeDetail
                              ? lang === "hi"
                                ? modeDetail.name
                                : modeDetail.name_en || modeDetail.name
                              : matchedMode
                                ? lang === "hi"
                                  ? matchedMode.name
                                  : matchedMode.name_en || matchedMode.name
                                : null;

                            if (item.challan_no) {
                              return (
                                <span className="flex items-center gap-1">
                                  <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                                  {modeName ||
                                    t("payments.view.offline_treasury")}
                                  : {item.challan_no}
                                </span>
                              );
                            }
                            if (modeName) {
                              return <span>{modeName}</span>;
                            }
                            return item.payment_mode === "OFFLINE_CASH" ? (
                              <span>{t("payments.view.cash_court_stamp")}</span>
                            ) : isSettled ? (
                              <span>{t("case.payments.online_gateway")}</span>
                            ) : (
                              <span className="text-muted-foreground font-normal">
                                {t("payments.view.pending_mode")}
                              </span>
                            );
                          })()}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-foreground font-mono">
                          {formatCurrency(item.amount)}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                          <div className="flex items-center justify-end gap-2">
                            {}
                            <StatusBadge
                              variant={getPaymentStatusVariant(statusCode)}
                            >
                              {item.status_detail
                                ? lang === "hi"
                                  ? item.status_detail.name
                                  : item.status_detail.name_en
                                : isSettled
                                  ? t("case.payments.successful")
                                  : t("case.payments.pending")}
                            </StatusBadge>

                            {}
                            {}
                            {!(isCitizenOrAdvocate && isPaidOrOfflineCourt) && (
                              <>
                                {}
                                {canPay &&
                                  !isSettled &&
                                  item.entry_type === "DEBIT" && (
                                    <Button
                                      size="sm"
                                      className="h-8 rounded-lg px-3 text-xs font-bold shadow-xs"
                                      disabled={payingId === item.id}
                                      onClick={() =>
                                        handleLaunchPayment(item, item.fee_type)
                                      }
                                    >
                                      {t("case.payments.pay_now")}
                                    </Button>
                                  )}

                                {}
                                {canPay &&
                                  !isSettled &&
                                  item.entry_type === "DEBIT" &&
                                  !item.challan_no && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 rounded-lg px-3 text-xs font-semibold"
                                      onClick={() => {
                                        setSelectedPaymentId(item.id);
                                        setIsChallanOpen(true);
                                      }}
                                    >
                                      {t("case.payments.upload_challan")}
                                    </Button>
                                  )}

                                {}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-muted"
                                  onClick={() => openViewDetail(item)}
                                  title={t("payments.actions.view_details")}
                                >
                                  <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {}
                  {displayedItems.length === 0 &&
                    (!isCitizenOrAdvocate ||
                      (activeTab === "ledger" && !isInitialFilingPaid)) && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-12 text-center text-muted-foreground text-xs font-medium"
                        >
                          {activeTab === "ledger"
                            ? t("payments.no_settled_transactions")
                            : t("payments.no_requests_found")}
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {}
      <Dialog open={isDebitOpen} onOpenChange={handleDebitClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader className="p-4 border-b bg-muted/50 rounded-t-xl text-left">
            <DialogTitle>{t("case.payments.debit_modal_title")}</DialogTitle>
            <DialogDescription className="text-xs">
              {t("case.payments.debit_modal_desc")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 p-4 text-left">
            <div className="grid gap-2">
              <Label htmlFor="feeType" className="text-left text-xs font-bold">
                {t("payments.view.particulars_header")} *
              </Label>
              <Input
                id="feeType"
                placeholder="e.g. Process Fee, Paper Book Charge"
                value={feeType}
                onChange={(e) => setFeeType(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label
                htmlFor="feeAmount"
                className="text-left text-xs font-bold"
              >
                {t("payments.view.amount_header")} (₹) *
              </Label>
              <Input
                id="feeAmount"
                type="number"
                placeholder="0.00"
                value={feeAmount}
                onChange={(e) => setFeeAmount(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="feeNotes" className="text-left text-xs font-bold">
                {t("case.payments.debit")} / Ref
              </Label>
              <Textarea
                id="feeNotes"
                placeholder="Order reference or notes"
                value={feeNotes}
                onChange={(e) => setFeeNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="px-4 py-3 border-t bg-muted/30">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDebitClose(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={addDebitEntry}
              size="sm"
              className="font-semibold"
              disabled={
                !feeType.trim() || !feeAmount.trim() || Number(feeAmount) <= 0
              }
            >
              {t("case.payments.add_debit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {}
      <Dialog open={isCreditOpen} onOpenChange={handleCreditClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader className="p-4 border-b bg-muted/50 rounded-t-xl text-left">
            <DialogTitle>{t("case.payments.credit_modal_title")}</DialogTitle>
            <DialogDescription className="text-xs">
              {t("case.payments.credit_modal_desc")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 p-4 text-left">
            <div className="grid gap-2">
              <Label className="text-left text-xs font-bold">
                {t("case.payments.credit_mode")}
              </Label>
              <select
                value={offlinePaymentMode}
                onChange={(e) => setOfflinePaymentMode(e.target.value as any)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {paymentModes.length > 0 ? (
                  paymentModes.map((pm: any) => (
                    <option key={pm.code} value={pm.code}>
                      {lang === "hi" ? pm.name : pm.name_en || pm.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="OFFLINE_CASH">
                      {t("case.payments.cash_stamp")}
                    </option>
                    <option value="OFFLINE_CHALLAN">
                      {t("case.payments.physical_challan")}
                    </option>
                  </>
                )}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="credType" className="text-left text-xs font-bold">
                {t("payments.view.particulars_header")} *
              </Label>
              <Input
                id="credType"
                placeholder="e.g. Initial Filing Fee Received"
                value={feeType}
                onChange={(e) => setFeeType(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label
                htmlFor="credAmount"
                className="text-left text-xs font-bold"
              >
                {t("payments.view.amount_header")} (₹) *
              </Label>
              <Input
                id="credAmount"
                type="number"
                placeholder="0.00"
                value={feeAmount}
                onChange={(e) => setFeeAmount(e.target.value)}
              />
            </div>

            {offlinePaymentMode === "OFFLINE_CHALLAN" && (
              <>
                <div className="grid gap-2">
                  <Label
                    htmlFor="credChallanNo"
                    className="text-left text-xs font-bold"
                  >
                    {t("payments.view.challan_number")} *
                  </Label>
                  <Input
                    id="credChallanNo"
                    placeholder="e.g. TC-99201-B"
                    value={offlineChallanNo}
                    onChange={(e) => setOfflineChallanNo(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label
                    htmlFor="credBank"
                    className="text-left text-xs font-bold"
                  >
                    {t("payments.view.bank_name")}
                  </Label>
                  <Input
                    id="credBank"
                    placeholder="e.g. State Bank of India, Main Branch"
                    value={offlineBank}
                    onChange={(e) => setOfflineBank(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="grid gap-2">
              <Label
                htmlFor="credNotes"
                className="text-left text-xs font-bold"
              >
                {t("case.payments.credit")} / Ref
              </Label>
              <Textarea
                id="credNotes"
                placeholder="Receipt number or notes"
                value={feeNotes}
                onChange={(e) => setFeeNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="px-4 py-3 border-t bg-muted/30">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCreditClose(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={addCreditEntry}
              size="sm"
              className="font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={
                !feeType.trim() || !feeAmount.trim() || Number(feeAmount) <= 0
              }
            >
              {t("case.payments.record_credit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {}
      <Dialog open={isChallanOpen} onOpenChange={handleChallanClose}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader className="p-4 border-b bg-muted/50 rounded-t-xl text-left">
            <DialogTitle>{t("case.payments.challan_modal_title")}</DialogTitle>
            <DialogDescription className="text-xs">
              {t("case.payments.challan_modal_desc")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 p-4 text-left">
            <div className="grid gap-2">
              <Label
                htmlFor="challanNo"
                className="text-left text-xs font-bold"
              >
                {t("payments.view.challan_number")} *
              </Label>
              <Input
                id="challanNo"
                placeholder="e.g. TC-481920-A"
                value={challanNo}
                onChange={(e) => setChallanNo(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label
                htmlFor="challanDate"
                className="text-left text-xs font-bold"
              >
                {t("payments.view.record_datetime")} *
              </Label>
              <Input
                id="challanDate"
                type="date"
                value={challanDate}
                onChange={(e) => setChallanDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label
                htmlFor="treasuryBank"
                className="text-left text-xs font-bold"
              >
                {t("payments.view.bank_name")} *
              </Label>
              <Input
                id="treasuryBank"
                placeholder="e.g. State Bank of India, Dehradun"
                value={treasuryBank}
                onChange={(e) => setTreasuryBank(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="px-4 py-3 border-t bg-muted/30">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleChallanClose(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadChallan}
              size="sm"
              className="font-semibold"
              disabled={
                !challanNo.trim() || !challanDate.trim() || !treasuryBank.trim()
              }
            >
              {t("case.payments.upload_challan")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslation } from "@/i18n";
import { useCasePaymentList, useCreatePaymentOrder, useVerifyPayment, useCaseDetail } from '@/lib/query';
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Download, CreditCard } from "lucide-react";
import toast from "react-hot-toast";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const getPaymentStatusVariant = (
  code?: string,
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

function generateReceiptPng(
  item: any,
  t: (key: string) => string,
  lang: string,
  filename: string,
  onSuccess: () => void,
  onError: () => void,
) {
  try {
    const scale = 2;
    const width = 680 * scale;
    const height = 640 * scale;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      onError();
      return;
    }


    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);


    ctx.strokeStyle = "#e4e4e7";
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === "function") {
      (ctx as any).roundRect(
        20 * scale,
        20 * scale,
        (680 - 40) * scale,
        (640 - 40) * scale,
        16 * scale,
      );
    } else {
      ctx.rect(20 * scale, 20 * scale, (680 - 40) * scale, (640 - 40) * scale);
    }
    ctx.stroke();


    const isPaid =
      item.status === "Completed" ||
      item.status_detail?.code === "PAYMENT_PAID";
    const caseNo = item.case_number || "N/A";
    const amountStr = new Intl.NumberFormat(lang === "hi" ? "hi-IN" : "en-IN", {
      style: "currency",
      currency: "INR",
    }).format(item.amount || 0);
    const dateStr = new Date(item.created_at || Date.now()).toLocaleString(
      lang === "hi" ? "hi-IN" : "en-IN",
      { dateStyle: "medium", timeStyle: "short" },
    );


    ctx.fillStyle = "#09090b";
    ctx.font = `600 ${15 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText(t("payments.view.receipt_title"), 44 * scale, 60 * scale);


    ctx.fillStyle = "#71717a";
    ctx.font = `500 ${11 * scale}px monospace, Courier`;
    ctx.fillText(
      `${t("payments.view.case_number_label")} ${caseNo}`,
      44 * scale,
      79 * scale,
    );


    const badgeText = item.status_detail
      ? lang === "hi"
        ? item.status_detail.name
        : item.status_detail.name_en
      : isPaid
        ? t("payments.successful")
        : t("payments.pending");

    ctx.fillStyle = isPaid ? "#dcfce7" : "#fef9c3";
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === "function") {
      (ctx as any).roundRect(
        (680 - 155) * scale,
        42 * scale,
        105 * scale,
        26 * scale,
        13 * scale,
      );
    } else {
      ctx.rect((680 - 155) * scale, 42 * scale, 105 * scale, 26 * scale);
    }
    ctx.fill();

    ctx.fillStyle = isPaid ? "#15803d" : "#a16207";
    ctx.font = `600 ${11 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(badgeText, (680 - 102.5) * scale, 59 * scale);
    ctx.textAlign = "left";


    ctx.strokeStyle = "#e4e4e7";
    ctx.lineWidth = 1 * scale;
    ctx.beginPath();
    ctx.moveTo(44 * scale, 98 * scale);
    ctx.lineTo((680 - 44) * scale, 98 * scale);
    ctx.stroke();


    const drawMeta = (labelKey: string, val: string, x: number, y: number) => {
      ctx.fillStyle = "#71717a";
      ctx.font = `500 ${10 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText(t(labelKey).toUpperCase(), x, y);

      ctx.fillStyle = "#09090b";
      ctx.font = `600 ${12 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText(val || t("payments.view.not_available"), x, y + 17 * scale);
    };

    const col1 = 44 * scale;
    const col2 = 340 * scale;

    const modeText = item.challan_no
      ? t("payments.view.offline_treasury")
      : item.payment_mode === "OFFLINE_CASH"
        ? t("payments.view.cash_court_stamp")
        : isPaid
          ? t("payments.view.online_gateway")
          : t("payments.view.pending_mode");

    drawMeta("payments.view.record_datetime", dateStr, col1, 130 * scale);
    drawMeta("payments.view.payment_mode", modeText, col2, 130 * scale);

    drawMeta(
      "payments.view.paid_by",
      item.paid_by || t("payments.view.not_available"),
      col1,
      185 * scale,
    );
    drawMeta(
      "payments.view.challan_number",
      item.challan_no || t("payments.view.not_available"),
      col2,
      185 * scale,
    );

    drawMeta(
      "payments.view.bank_name",
      item.bank_name || t("payments.view.not_available"),
      col1,
      240 * scale,
    );
    drawMeta(
      "payments.view.order_id",
      item.razorpay_order_id || t("payments.view.not_available"),
      col2,
      240 * scale,
    );

    drawMeta(
      "payments.view.transaction_id",
      item.payment_id || t("payments.view.not_available"),
      col1,
      295 * scale,
    );


    const tableTop = 345 * scale;
    const tableWidth = (680 - 88) * scale;
    const tableHeight = 145 * scale;

    ctx.strokeStyle = "#e4e4e7";
    ctx.lineWidth = 1 * scale;
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === "function") {
      (ctx as any).roundRect(
        col1,
        tableTop,
        tableWidth,
        tableHeight,
        10 * scale,
      );
    } else {
      ctx.rect(col1, tableTop, tableWidth, tableHeight);
    }
    ctx.stroke();


    ctx.fillStyle = "#f4f4f5";
    ctx.fillRect(col1, tableTop, tableWidth, 32 * scale);

    ctx.fillStyle = "#71717a";
    ctx.font = `600 ${10 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText(
      t("payments.view.particulars_header").toUpperCase(),
      col1 + 16 * scale,
      tableTop + 20 * scale,
    );
    ctx.textAlign = "right";
    ctx.fillText(
      t("payments.view.amount_header").toUpperCase(),
      col1 + tableWidth - 16 * scale,
      tableTop + 20 * scale,
    );
    ctx.textAlign = "left";


    ctx.fillStyle = "#09090b";
    ctx.font = `500 ${12 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText(
      item.fee_type || t("payments.initial_filing_fee"),
      col1 + 16 * scale,
      tableTop + 62 * scale,
    );

    if (item.notes) {
      ctx.fillStyle = "#71717a";
      ctx.font = `italic ${11 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText(item.notes, col1 + 16 * scale, tableTop + 80 * scale);
    }

    ctx.fillStyle = "#09090b";
    ctx.font = `600 ${13 * scale}px monospace, Courier`;
    ctx.textAlign = "right";
    ctx.fillText(
      amountStr,
      col1 + tableWidth - 16 * scale,
      tableTop + 65 * scale,
    );
    ctx.textAlign = "left";


    const footerTop = tableTop + 100 * scale;
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(col1, footerTop, tableWidth, 45 * scale);

    ctx.strokeStyle = "#e4e4e7";
    ctx.beginPath();
    ctx.moveTo(col1, footerTop);
    ctx.lineTo(col1 + tableWidth, footerTop);
    ctx.stroke();

    ctx.fillStyle = "#09090b";
    ctx.font = `600 ${12 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText(
      t("payments.view.total_paid"),
      col1 + 16 * scale,
      footerTop + 28 * scale,
    );

    ctx.font = `bold ${15 * scale}px monospace, Courier`;
    ctx.textAlign = "right";
    ctx.fillText(
      amountStr,
      col1 + tableWidth - 16 * scale,
      footerTop + 29 * scale,
    );
    ctx.textAlign = "left";


    const footerTextY = 520 * scale;
    ctx.strokeStyle = "#e4e4e7";
    ctx.beginPath();
    ctx.moveTo(col1, footerTextY);
    ctx.lineTo(col1 + tableWidth, footerTextY);
    ctx.stroke();

    ctx.fillStyle = "#71717a";
    ctx.font = `400 ${10.5 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(
      t("payments.view.computer_generated_note"),
      width / 2,
      footerTextY + 28 * scale,
    );

    ctx.font = `${9.5 * scale}px monospace, Courier`;
    ctx.fillText(
      `${t("payments.view.generated_on")} ${dateStr}`,
      width / 2,
      footerTextY + 46 * scale,
    );
    ctx.textAlign = "left";


    const pngUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = filename.endsWith(".png") ? filename : `${filename}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    onSuccess();
  } catch (err) {
    console.error("Direct PNG canvas generation error:", err);
    onError();
  }
}

export default function PaymentViewPage() {
  const params = useParams<{ case_number: string }>();
  const searchParams = useSearchParams();
  const { t, lang } = useTranslation();
  const caseNumber = params?.case_number;
  const paymentId = searchParams.get("id");

  const ledgerQuery = useCasePaymentList(caseNumber || "");
  const rawList = ledgerQuery.data?.result?.data || [];

  const createOrderMutation = useCreatePaymentOrder();
  const verifyPaymentMutation = useVerifyPayment();
  const { refetch: refetchCase } = useCaseDetail(caseNumber || "");

  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const mappedList = rawList.map((bp: any) => {
    const isPaid =
      bp.status === "PAID" ||
      bp.status === "paid" ||
      bp.status_detail?.code === "PAYMENT_PAID";
    const metadata = bp.metadata || {};
    return {
      id: String(bp.id),
      case_number: caseNumber || "",
      amount: bp.amount_in_inr ?? (bp.amount ? bp.amount / 100 : 0),
      fee_type:
        bp.description || metadata.fee_type || t("payments.initial_filing_fee"),
      notes: metadata.notes || "",
      entry_type: metadata.entry_type || (isPaid ? "CREDIT" : "DEBIT"),
      status: isPaid ? "Completed" : "Pending",
      status_detail: bp.status_detail,
      payment_id:
        bp.razorpay_payment_id ||
        metadata.transaction_id ||
        metadata.payment_id,
      razorpay_order_id:
        bp.razorpay_order_id || metadata.order_id || metadata.razorpay_order_id,
      created_at: bp.created_at || new Date().toISOString(),
      challan_no: metadata.challan_no || bp.challan_no,
      bank_name: metadata.bank_name || bp.bank_name,
      payment_mode: metadata.payment_mode || "ONLINE",
      payment_mode_detail: bp.payment_mode_detail,
      paid_by: bp.user_detail?.name || bp.paid_by || metadata.paid_by,
    };
  });


  let item: any = mappedList.find((i: any) => String(i.id) === paymentId);

  if (!item && paymentId === "initial-filing") {
    item = {
      id: "initial-filing",
      case_number: caseNumber,
      amount: 2,
      fee_type: t("payments.initial_filing_fee"),
      notes: t("payments.initial_filing_fee_desc"),
      entry_type: "DEBIT",
      status: "Pending",
      created_at: new Date().toISOString(),
      payment_mode: "ONLINE",
    };
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat(lang === "hi" ? "hi-IN" : "en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  }

  const renderVal = (val: string | undefined | null) => {
    if (!val || !val.trim()) {
      return t("payments.view.not_available");
    }
    return val;
  };

  const handleSaveImage = () => {
    const rawOrderId =
      item?.razorpay_order_id ||
      item?.payment_id ||
      item?.case_number ||
      "Payment";
    const cleanOrderId = rawOrderId.replace(/[/\\?%*:|"<>]/g, "_");

    const now = new Date();
    const YYYY = now.getFullYear();
    const MM = String(now.getMonth() + 1).padStart(2, "0");
    const DD = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    const timestampStr = `${YYYY}${MM}${DD}_${hh}${mm}${ss}`;

    const filename = `Receipt_${cleanOrderId}_${timestampStr}.png`;

    generateReceiptPng(
      item,
      t,
      lang,
      filename,
      () => {
        toast.success(t("payments.view.receipt_saved"));
      },
      () => {
        toast.error(t("payments.view.save_failed"));
      },
    );
  };

  const handleLaunchPayment = async (
    orderOrItem: any,
    defaultFeeType: string,
  ) => {
    let orderId = orderOrItem?.razorpay_order_id;
    let paymentAmountInPaise = Math.round((orderOrItem?.amount || 2) * 100);
    let keyId =
      orderOrItem?.razorpay_key ||
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      "rzp_test_RcCmsKey123";

    setIsPaying(true);

    try {
      if (!orderId) {
        toast.loading(t("payments.toasts.creating_order"), { id: "razorpay" });

        const createdRes = await createOrderMutation.mutateAsync({
          model: "casemodel",
          object_id: caseNumber || "",
          amount: paymentAmountInPaise,
          description: defaultFeeType,
          metadata: {
            case_number: caseNumber,
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
        setIsPaying(false);
        return;
      }

      const options = {
        key: keyId,
        amount: paymentAmountInPaise,
        currency: "INR",
        name: "Uttarakhand Revenue Court",
        description: `Payment for Case No: ${caseNumber}`,
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
                ledgerQuery.refetch();
                refetchCase();
                setIsPaying(false);
              },
              onError: (err: any) => {
                toast.dismiss("verify");
                toast.error(err?.message || "Payment verification failed.");
                setIsPaying(false);
              },
            },
          );
        },
        theme: {
          color: "#0f172a",
        },
        modal: {
          ondismiss: function () {
            setIsPaying(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.dismiss("razorpay");
      toast.error(err?.message || "Payment initiation failed.");
      setIsPaying(false);
    }
  };

  if (ledgerQuery.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-muted-foreground text-sm font-medium">
        {t("payments.view.loading_details")}
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-6 text-center space-y-4">
        <p className="text-base font-semibold text-destructive">
          {t("payments.view.not_found")}
        </p>
      </div>
    );
  }

  const isPaid =
    item.status === "Completed" || item.status_detail?.code === "PAYMENT_PAID";
  const statusCode =
    item.status_detail?.code || (isPaid ? "PAYMENT_PAID" : "PAYMENT_CREATED");

  const formattedDateTime = new Date(item.created_at).toLocaleString(
    lang === "hi" ? "hi-IN" : "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">

      <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-neutral-950 shrink-0">
        <h1 className="text-lg font-semibold tracking-tight">
          {t("payments.view.header_title")}
        </h1>
      </div>


      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
        <div className="max-w-2xl mx-auto space-y-6">

          <div
            id="receipt-bill-card"
            className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 relative"
          >
            <div className="space-y-6">

              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-foreground">
                    {t("payments.view.receipt_title")}
                  </h2>
                  <p className="text-xs text-muted-foreground font-mono font-medium mt-0.5">
                    {t("payments.view.case_number_label")}{" "}
                    {renderVal(item.case_number)}
                  </p>
                </div>

                <div className="select-none">
                  <StatusBadge variant={getPaymentStatusVariant(statusCode)}>
                    {item.status_detail
                      ? lang === "hi"
                        ? item.status_detail.name
                        : item.status_detail.name_en
                      : isPaid
                        ? t("payments.successful")
                        : t("payments.pending")}
                  </StatusBadge>
                </div>
              </div>


              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-medium text-muted-foreground">
                    {t("payments.view.record_datetime")}
                  </span>
                  <p className="font-semibold text-foreground">
                    {formattedDateTime}
                  </p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-medium text-muted-foreground">
                    {t("payments.view.payment_mode")}
                  </span>
                  <p className="font-semibold text-foreground">
                    {(() => {
                      const modeDetail = item.payment_mode_detail;
                      const modeName = modeDetail
                        ? lang === "hi"
                          ? modeDetail.name
                          : modeDetail.name_en || modeDetail.name
                        : null;

                      if (item.challan_no) {
                        return (
                          <span>
                            {modeName || t("payments.view.offline_treasury")}
                          </span>
                        );
                      }
                      if (modeName) {
                        return <span>{modeName}</span>;
                      }
                      return item.payment_mode === "OFFLINE_CASH" ? (
                        <span>{t("payments.view.cash_court_stamp")}</span>
                      ) : isPaid ? (
                        <span>{t("payments.view.online_gateway")}</span>
                      ) : (
                        <span className="text-muted-foreground font-normal">
                          {t("payments.view.pending_mode")}
                        </span>
                      );
                    })()}
                  </p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-medium text-muted-foreground">
                    {t("payments.view.paid_by")}
                  </span>
                  <p className="font-semibold text-foreground">
                    {renderVal(item.paid_by)}
                  </p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-medium text-muted-foreground">
                    {t("payments.view.challan_number")}
                  </span>
                  <p className="font-semibold text-foreground font-mono">
                    {renderVal(item.challan_no)}
                  </p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-medium text-muted-foreground">
                    {t("payments.view.bank_name")}
                  </span>
                  <p className="font-semibold text-foreground">
                    {renderVal(item.bank_name)}
                  </p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-medium text-muted-foreground">
                    {t("payments.view.order_id")}
                  </span>
                  <p className="font-semibold text-foreground font-mono break-all">
                    {renderVal(item.razorpay_order_id)}
                  </p>
                </div>

                <div className="space-y-0.5 sm:col-span-2">
                  <span className="text-[10px] uppercase font-medium text-muted-foreground">
                    {t("payments.view.transaction_id")}
                  </span>
                  <p className="font-semibold text-foreground font-mono break-all">
                    {renderVal(item.payment_id)}
                  </p>
                </div>
              </div>


              <div className="border border-border/60 rounded-xl overflow-hidden mt-6">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border/60 text-muted-foreground uppercase text-[10px] font-semibold tracking-wider">
                      <th className="px-4 py-2.5">
                        {t("payments.view.particulars_header")}
                      </th>
                      <th className="px-4 py-2.5 text-right">
                        {t("payments.view.amount_header")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    <tr>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {item.fee_type}
                        {item.notes && (
                          <p className="text-[11px] font-normal text-muted-foreground italic mt-0.5">
                            {item.notes}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground font-mono text-sm">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/10 border-t border-border/60 font-semibold text-foreground">
                      <td className="px-4 py-3 uppercase tracking-wider text-xs">
                        {t("payments.view.total_paid")}
                      </td>
                      <td className="px-4 py-3 text-right text-base font-extrabold text-foreground font-mono">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>


            <div className="pt-8 mt-auto border-t border-border/40 text-center space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                {t("payments.view.computer_generated_note")}
              </p>
              <p className="text-[10px] text-muted-foreground/60 font-mono pt-1">
                {t("payments.view.generated_on")}{" "}
                {new Date().toLocaleString(lang === "hi" ? "hi-IN" : "en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </div>


          <div className="flex justify-center pt-2 pb-6">
            {isPaid ? (
              <Button
                variant="default"
                size="lg"
                onClick={handleSaveImage}
                className="gap-2 px-6 font-semibold shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>{t("payments.view.save_receipt")}</span>
              </Button>
            ) : (
              <Button
                variant="default"
                size="lg"
                disabled={isPaying}
                onClick={() => handleLaunchPayment(item, item.fee_type)}
                className="gap-2 px-8 font-bold shadow-md bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CreditCard className="w-4 h-4" />
                <span>{t("case.payments.pay_now")}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

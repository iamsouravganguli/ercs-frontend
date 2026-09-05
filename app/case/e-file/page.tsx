"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { CommonsApiServices } from '@/lib/services';
import { useTranslation } from "@/i18n";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  FilePlus,
  ArrowRight,
  Check,
  FileText,
  Users,
  MapPin,
  Files,
  Eye,
} from "lucide-react";
import {
  CustomModal,
  CustomModalHeader,
  CustomModalTitle,
  CustomModalDescription,
  CustomModalBody,
  CustomModalFooter,
} from "@/components/ui/custom-modal";
import toast from "react-hot-toast";

export default function CaseEFilePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [autoTried, setAutoTried] = useState(false);

  const caseInitMutation = useMutation({
    mutationKey: ["CASE_INIT_EFILE"],
    mutationFn: CommonsApiServices.CaseInitService,
    onSuccess: (res: any) => {
      const caseNumber =
        res?.result?.data?.case_number || res?.data?.case_number;
      if (caseNumber) {
        toast.success(res?.message || "Case initiated");
        router.replace(`/case/e-file/${caseNumber}/case-details`);
      } else {
        toast.error("Failed to get case number");
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to initiate case");
    },
  });

  const handleEFile = () => setConfirmOpen(true);
  const handleConfirm = () => {
    setConfirmOpen(false);
    caseInitMutation.mutate({});
  };


  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("auto") === "1" && !autoTried) {
      setAutoTried(true);
      caseInitMutation.mutate({});
    }
  }, [autoTried]);

  const steps = [
    {
      n: 1,
      title: t("case.efile.steps.case_details.title"),
      desc: t("case.efile.steps.case_details.desc"),
      Icon: FileText,
    },
    {
      n: 2,
      title: t("case.efile.steps.parties.title"),
      desc: t("case.efile.steps.parties.desc"),
      Icon: Users,
    },
    {
      n: 3,
      title: t("case.efile.steps.land.title"),
      desc: t("case.efile.steps.land.desc"),
      Icon: MapPin,
    },
    {
      n: 4,
      title: t("case.efile.steps.documents.title"),
      desc: t("case.efile.steps.documents.desc"),
      Icon: Files,
    },
    {
      n: 5,
      title: t("case.efile.steps.review.title"),
      desc: t("case.efile.steps.review.desc"),
      Icon: Eye,
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-background">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {}
        <div className="space-y-1.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {t("case.efile.title")}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl leading-relaxed">
            {t("case.efile.subtitle")}
          </p>
        </div>

        {}
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
              {steps.map((s) => (
                <div
                  key={s.n}
                  className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900"
                >
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                    <s.Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none">
                      {s.title}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Card className="rounded-2xl border border-zinc-100 dark:border-zinc-800/50 bg-white dark:bg-zinc-900 shadow-none overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  {t("case.efile.instructions.title")}
                </CardTitle>
                <CardDescription>
                  {t("case.efile.instructions.subtitle")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    t("case.efile.instructions.p1"),
                    t("case.efile.instructions.p2"),
                    t("case.efile.instructions.p3"),
                    t("case.efile.instructions.p4"),
                    t("case.efile.instructions.p5"),
                    t("case.efile.instructions.p6"),
                  ].map((txt, i) => (
                    <li
                      key={i}
                      className="flex gap-3 text-sm text-muted-foreground leading-relaxed"
                    >
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 shrink-0" />
                      <span>{txt}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <Card className="rounded-2xl border border-zinc-100 dark:border-zinc-800/50 bg-white dark:bg-zinc-900 shadow-none overflow-hidden">
                <CardHeader className="text-center p-6 pb-4">
                  <div className="mx-auto h-11 w-11 rounded-xl bg-zinc-100 dark:bg-card border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center justify-center mb-3">
                    <FilePlus className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg font-semibold">
                    {t("case.efile.ready_title")}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {t("case.efile.ready_desc")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 p-6 pt-0">
                  <Button
                    onClick={handleEFile}
                    disabled={caseInitMutation.isPending}
                    className="w-full h-11 gap-2 text-sm font-semibold shadow-sm"
                  >
                    {t("case.efile.generate_btn")}{" "}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <ul className="space-y-2 text-xs text-muted-foreground bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 border border-zinc-100 dark:border-zinc-800">
                    <li className="flex gap-2.5 items-center">
                      <span className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <Check className="h-3 w-3" />
                      </span>{" "}
                      {t("case.efile.features.no_fee")}
                    </li>
                    <li className="flex gap-2.5 items-center">
                      <span className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <Check className="h-3 w-3" />
                      </span>{" "}
                      {t("case.efile.features.auto_saved")}
                    </li>
                    <li className="flex gap-2.5 items-center">
                      <span className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <Check className="h-3 w-3" />
                      </span>{" "}
                      {t("case.efile.features.continue_later")}
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <CustomModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        className="max-w-[420px]"
      >
        <CustomModalHeader>
          <CustomModalTitle>{t("case.efile.confirm.title")}</CustomModalTitle>
          <CustomModalDescription>
            {t("case.efile.confirm.description")}
          </CustomModalDescription>
        </CustomModalHeader>
        <CustomModalBody className="pb-2" />
        <CustomModalFooter>
          <Button
            variant="outline"
            onClick={() => setConfirmOpen(false)}
            className="flex-1"
          >
            {t("case.efile.confirm.cancel")}
          </Button>
          <Button onClick={handleConfirm} className="flex-1">
            {t("case.efile.confirm.confirm")}
          </Button>
        </CustomModalFooter>
      </CustomModal>
    </div>
  );
}

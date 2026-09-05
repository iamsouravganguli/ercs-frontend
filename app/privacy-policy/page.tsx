"use client";

import Link from "next/link";
import { useTranslation } from "@/i18n";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShieldCheck,
  Lock,
  Eye,
  Database,
  Cookie,
  UserCheck,
  Mail,
  RefreshCw,
  FileText,
  ChevronRight,
} from "lucide-react";

export default function PrivacyPolicyPage() {
  const { t } = useTranslation();

  const sections = [
    {
      icon: FileText,
      titleKey: "privacy_policy.sections.intro.title",
      descKey: "privacy_policy.sections.intro.desc",
    },
    {
      icon: Database,
      titleKey: "privacy_policy.sections.collection.title",
      descKey: "privacy_policy.sections.collection.desc",
    },
    {
      icon: Eye,
      titleKey: "privacy_policy.sections.use.title",
      descKey: "privacy_policy.sections.use.desc",
    },
    {
      icon: ShieldCheck,
      titleKey: "privacy_policy.sections.sharing.title",
      descKey: "privacy_policy.sections.sharing.desc",
    },
    {
      icon: Lock,
      titleKey: "privacy_policy.sections.security.title",
      descKey: "privacy_policy.sections.security.desc",
    },
    {
      icon: Cookie,
      titleKey: "privacy_policy.sections.cookies.title",
      descKey: "privacy_policy.sections.cookies.desc",
    },
    {
      icon: UserCheck,
      titleKey: "privacy_policy.sections.rights.title",
      descKey: "privacy_policy.sections.rights.desc",
    },
    {
      icon: RefreshCw,
      titleKey: "privacy_policy.sections.updates.title",
      descKey: "privacy_policy.sections.updates.desc",
    },
  ];

  return (
    <main className="w-full">
      {}
      <section className="bg-primary/5 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            {t("privacy_policy.badge")}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            {t("privacy_policy.title")}
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            {t("privacy_policy.subtitle")}
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            {t("privacy_policy.last_updated", { date: "10 Aug 2026" })}
          </p>
        </div>
      </section>

      {}
      <section className="py-10 md:py-14">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 space-y-6">
          {}
          <Card className="border-primary/20 bg-primary/[0.03]">
            <CardContent className="p-5 md:p-6">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t("privacy_policy.intro_note")}
              </p>
            </CardContent>
          </Card>

          {}
          <div className="space-y-4">
            {sections.map((s, i) => {
              const Icon = s.icon;
              return (
                <Card key={i} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-5 md:p-6">
                    <div className="flex gap-4">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-base font-semibold">
                          {i + 1}. {t(s.titleKey)}
                        </h2>
                        <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                          {t(s.descKey)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {}
          <Card>
            <CardContent className="p-5 md:p-6">
              <div className="flex gap-4">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">
                    {t("privacy_policy.contact.title")}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t("privacy_policy.contact.desc")}
                  </p>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-1 text-sm text-primary mt-3 hover:underline"
                  >
                    {t("privacy_policy.contact.cta")}
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground text-center pt-2">
            {t("privacy_policy.footer_note")}
          </p>
        </div>
      </section>
    </main>
  );
}

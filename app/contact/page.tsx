"use client";

import { useTranslation } from "@/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail, MapPin, Landmark, Clock } from "lucide-react";

export default function ContactUsPage() {
  const { t } = useTranslation();

  return (
    <main className="w-full">
      {}
      <section className="bg-primary/5 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Landmark className="w-4 h-4" />
            {t("contact.badge")}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            {t("contact.hero.title")}
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            {t("contact.hero.desc")}
          </p>
        </div>
      </section>

      {}
      <section className="py-10 md:py-14">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
          <Card>
            <CardContent className="p-6 md:p-8 space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-1">
                  {t("brand.subtitle")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t("brand.gov")}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      {t("brand.address.label")}
                    </p>
                    <p className="text-sm font-medium whitespace-pre-line mt-1">
                      {t("brand.address.value")}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      {t("contact.info.phone.label")}
                    </p>
                    <a
                      href="tel:+9113352669415"
                      className="text-sm font-medium mt-1 inline-block hover:text-primary transition-colors"
                    >
                      {t("contact.info.phone.value")}
                    </a>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      {t("contact.info.email.label")}
                    </p>
                    <a
                      href="mailto:boardofrevenue-uk@gov.in"
                      className="text-sm font-medium mt-1 inline-block hover:text-primary transition-colors break-all"
                    >
                      {t("contact.info.email.value")}
                    </a>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      {t("contact.info.hours.label")}
                    </p>
                    <p className="text-sm font-medium mt-1">
                      {t("contact.info.hours.value")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border/60 space-y-1 text-xs text-muted-foreground">
                <p>{t("brand.content_owned_managed_by")}</p>
                <p>{t("brand.developed_by")}</p>
                <p>{t("brand.hosted_by")}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

"use client";

import * as React from "react";
import { Calendar } from "./calendar";
import { useTranslation } from "@/i18n";
import { Card, CardContent } from "./card";
import { CalendarDays, CalendarCheck, Clock } from "lucide-react";

type Holiday = {
  date: string;
  name_en: string;
  name_hi: string;
};

const holidays: Holiday[] = [
  { date: "2026-01-26", name_en: "Republic Day", name_hi: "गणतंत्र दिवस" },
  { date: "2026-03-08", name_en: "Holi", name_hi: "होली" },
  { date: "2026-04-14", name_en: "Ambedkar Jayanti", name_hi: "अंबेडकर जयंती" },
  {
    date: "2026-08-15",
    name_en: "Independence Day",
    name_hi: "स्वतंत्रता दिवस",
  },
  { date: "2026-10-02", name_en: "Gandhi Jayanti", name_hi: "गांधी जयंती" },
];

export function HolidaySectionWebsite() {
  const { t, locale } = useTranslation();

  const [selected, setSelected] = React.useState<Date | undefined>(new Date());

  const holidayDates = holidays.map((h) => new Date(h.date));
  const today = new Date();
  today.setHours(0, 0, 0, 0);


  const nextHoliday = holidays
    .map((h) => ({ ...h, d: new Date(h.date) }))
    .filter((h) => h.d >= today)
    .sort((a, b) => a.d.getTime() - b.d.getTime())[0];

  const daysUntil = nextHoliday
    ? Math.ceil((nextHoliday.d.getTime() - today.getTime()) / 86400000)
    : null;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(locale === "hi" ? "hi-IN" : "en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <section className="w-full py-14">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <CalendarDays className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-foreground leading-tight">
              {t("holiday.title")}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("holiday.subtitle") || "Public & gazetted holidays"}
            </p>
          </div>
        </div>

        {}
        {nextHoliday && (
          <div
            className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl
            border border-primary/20 bg-primary/5"
          >
            <Clock className="w-4 h-4 text-primary shrink-0" />
            <p className="text-sm text-foreground">
              <span className="font-semibold text-primary">
                {locale === "hi" ? nextHoliday.name_hi : nextHoliday.name_en}
              </span>{" "}
              &mdash;{" "}
              {daysUntil === 0
                ? t("holiday.today") || "Today"
                : daysUntil === 1
                  ? t("holiday.tomorrow") || "Tomorrow"
                  : `${t("holiday.inDays") || "in"} ${daysUntil} ${t("holiday.days") || "days"}`}
              <span className="text-muted-foreground ml-2 text-xs">
                ({formatDate(nextHoliday.date)})
              </span>
            </p>
          </div>
        )}

        <Card className="border-border shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr]">
              {}
              <div className="border-b lg:border-b-0 lg:border-r border-border p-5 bg-muted/20 flex flex-col gap-5">
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <Calendar
                    mode="single"
                    selected={selected}
                    onSelect={setSelected}
                    modifiers={{ holiday: holidayDates }}
                    modifiersClassNames={{
                      holiday:
                        "!bg-red-500 !text-white rounded-md font-semibold",
                    }}
                    className="w-full p-3"
                  />
                </div>

                {}
                <div className="flex flex-wrap items-center gap-5 px-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex w-5 h-5 rounded-md bg-red-500 shrink-0" />
                    <span className="text-xs text-muted-foreground font-medium">
                      {t("holiday.public") || "Public Holiday"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex w-5 h-5 rounded-md bg-primary shrink-0" />
                    <span className="text-xs text-muted-foreground font-medium">
                      {t("holiday.selected") || "Selected Date"}
                    </span>
                  </div>
                </div>
              </div>

              {}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CalendarCheck className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">
                    {t("holiday.upcoming") || "Upcoming Holidays"}
                  </h3>
                  <span
                    className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full
                    bg-primary/10 text-primary text-[10px] font-semibold"
                  >
                    {holidays.length}
                  </span>
                </div>

                <div className="flex flex-col divide-y divide-border">
                  {holidays.map((holiday, i) => {
                    const name =
                      locale === "hi" ? holiday.name_hi : holiday.name_en;
                    const hDate = new Date(holiday.date);
                    hDate.setHours(0, 0, 0, 0);
                    const isPast = hDate < today;
                    const isNext = nextHoliday?.date === holiday.date;

                    return (
                      <div
                        key={i}
                        className={`
                          flex items-center justify-between
                          px-3 py-3.5 transition-colors
                          ${isPast ? "opacity-45" : "hover:bg-muted/40"}
                          ${isNext ? "bg-primary/5 rounded-lg" : ""}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          {}
                          <span
                            className={`
                            w-2.5 h-2.5 rounded-full shrink-0
                            ${isPast ? "bg-muted-foreground/40" : "bg-red-500"}
                          `}
                          />

                          <div className="flex flex-col">
                            <span
                              className={`text-sm font-medium leading-tight
                              ${isNext ? "text-primary" : "text-foreground"}`}
                            >
                              {name}
                            </span>
                            {isNext && (
                              <span className="text-[10px] text-primary/70 font-semibold mt-0.5">
                                {daysUntil === 0
                                  ? t("holiday.today") || "Today"
                                  : daysUntil === 1
                                    ? t("holiday.tomorrow") || "Tomorrow"
                                    : `${daysUntil} ${t("holiday.days") || "days away"}`}
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="text-xs text-muted-foreground font-medium shrink-0 ml-4">
                          {formatDate(holiday.date)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

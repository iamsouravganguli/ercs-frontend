"use client";

import * as React from "react";
import { useMemo } from "react";
import { Control, FieldValues, Path, useWatch } from "react-hook-form";
import {
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  XCircle,
  Loader2,
} from "lucide-react";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";
import { Button } from "./button";
import { Input } from "./input";
import { CustomCombobox } from "./custom-combobox";
import { cn } from "@/lib/cn";


const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const COURT_START_MINS = 630;
const COURT_END_MINS = 1020;

const DURATION_PRESETS = [
  { label: "15m", value: 15 },
  { label: "30m", value: 30 },
  { label: "45m", value: 45 },
  { label: "1h", value: 60 },
  { label: "1.5h", value: 90 },
  { label: "2h", value: 120 },
];

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  label: pad2(i + 1),
  value: pad2(i + 1),
}));

const MINUTE_OPTIONS = [
  "00",
  "05",
  "10",
  "15",
  "20",
  "25",
  "30",
  "35",
  "40",
  "45",
  "50",
  "55",
].map((m) => ({
  label: m,
  value: m,
}));

const AMPM_OPTIONS = [
  { label: "AM", value: "AM" },
  { label: "PM", value: "PM" },
];

const UNIT_OPTIONS = [
  { label: "Hours", value: "Hours" },
  { label: "Minutes", value: "Minutes" },
];

export interface ExistingHearingInfo {
  id?: number | string;
  hearing_date: string;
  hearing_expected_start_time: string;
  hearing_expected_end_time?: string;
  hearing_expected_duration?: number;
}


function pad2(n: number) {
  return n.toString().padStart(2, "0");
}
function toDateStr(y: number, m: number, d: number) {
  return `${y}-${pad2(m + 1)}-${pad2(d)}`;
}
function todayStr() {
  const n = new Date();
  return toDateStr(n.getFullYear(), n.getMonth(), n.getDate());
}

function formatDateHuman(s: string): string {
  if (!s) return "";
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return s;
  const dt = new Date(y, m - 1, d);
  const dayName = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ][dt.getDay()];
  return `${dayName}, ${d} ${MONTHS_SHORT[m - 1]} ${y}`;
}

function timeToMins(t: string): number {
  if (!t) return 0;
  const parts = t.split(":").map(Number);
  const hh = parts[0] ?? 0;
  const mm = parts[1] ?? 0;
  return hh * 60 + mm;
}

function minsToTime(m: number): string {
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${pad2(hh)}:${pad2(mm)}`;
}

function formatTime12(t: string): string {
  if (!t) return "";
  const parts = t.split(":").map(Number);
  const hh = parts[0] ?? 0;
  const mm = parts[1] ?? 0;
  const ampm = hh >= 12 ? "PM" : "AM";
  const h = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
  return `${h}:${pad2(mm)} ${ampm}`;
}

function parseTime12(t: string): {
  h12: number;
  minute: number;
  ampm: "AM" | "PM";
} {
  if (!t) return { h12: 10, minute: 30, ampm: "AM" };
  const parts = t.split(":").map(Number);
  const hh = parts[0] ?? 10;
  const mm = parts[1] ?? 30;
  const ampm: "AM" | "PM" = hh >= 12 ? "PM" : "AM";
  const h12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
  return { h12, minute: mm, ampm };
}

function buildTime12(h12: number, minute: number, ampm: "AM" | "PM"): string {
  let hh = h12;
  if (ampm === "AM" && hh === 12) hh = 0;
  else if (ampm === "PM" && hh !== 12) hh += 12;
  return `${pad2(hh)}:${pad2(minute)}`;
}

function isOverlapping(
  s1: number,
  e1: number,
  s2: number,
  e2: number,
): boolean {
  return Math.max(s1, s2) < Math.min(e1, e2);
}

function getOccupiedIntervals(
  dateStr: string,
  hearings: ExistingHearingInfo[],
  currentHearingId?: number | string,
) {
  if (!hearings || hearings.length === 0) return [];
  return hearings
    .filter(
      (h) =>
        h.hearing_date === dateStr &&
        String(h.id || "") !== String(currentHearingId || ""),
    )
    .map((h) => {
      const start = timeToMins(h.hearing_expected_start_time);
      const duration = h.hearing_expected_duration || 30;
      const end = h.hearing_expected_end_time
        ? timeToMins(h.hearing_expected_end_time)
        : start + duration;
      return { start, end };
    });
}

function getAllAvailableSlots(
  dateStr: string,
  durationMins: number,
  hearings: ExistingHearingInfo[],
  currentHearingId?: number | string,
): { start: string; end: string }[] {
  const occupied = getOccupiedIntervals(dateStr, hearings, currentHearingId);
  const duration = Math.max(durationMins, 5);
  const step = duration;
  const available: { start: string; end: string }[] = [];

  for (let s = COURT_START_MINS; s + duration <= COURT_END_MINS; s += step) {
    const e = s + duration;
    const conflict = occupied.some((occ) =>
      isOverlapping(s, e, occ.start, occ.end),
    );
    if (!conflict) {
      available.push({
        start: minsToTime(s),
        end: minsToTime(e),
      });
    }
  }

  return available;
}


type DateTimePickerFieldProps<T extends FieldValues = FieldValues> = {
  control: Control<T>;
  dateName: Path<T>;
  timeFromName: Path<T>;
  timeToName: Path<T>;
  durationName: Path<T>;
  label?: React.ReactNode;
  required?: boolean;
  containerClassName?: string;
  existingHearings?: ExistingHearingInfo[];
  currentHearingId?: number | string;
  onFindSlot?: () => Promise<unknown> | void;
  isSearchingSlots?: boolean;
  hasFetched?: boolean;
};

export function DateTimePickerField<T extends FieldValues = FieldValues>({
  control,
  dateName,
  timeFromName,
  timeToName,
  durationName,
  label,
  required,
  containerClassName,
  existingHearings = [],
  currentHearingId,
  onFindSlot,
  isSearchingSlots = false,
  hasFetched = false,
}: DateTimePickerFieldProps<T>) {
  const dateVal: string = (useWatch({ control, name: dateName }) as unknown as string) || "";
  const fromVal: string = (useWatch({ control, name: timeFromName }) as unknown as string) || "";
  const toVal: string = (useWatch({ control, name: timeToName }) as unknown as string) || "";
  const durationRaw: unknown = useWatch({ control, name: durationName });
  const durationValNum = Number(durationRaw) || 60;

  const durationUnit: "Hours" | "Minutes" = durationValNum >= 60 ? "Hours" : "Minutes";
  const durationValue: number = durationValNum >= 60 ? durationValNum / 60 : durationValNum;

  const startMins = fromVal ? timeToMins(fromVal) : 0;
  const endMins = toVal ? timeToMins(toVal) : 0;
  const calculatedDuration = fromVal && toVal ? Math.max(endMins - startMins, 5) : durationValNum;

  const { h12, minute, ampm } = parseTime12(fromVal || "10:30");

  const isOutsideCourtHours =
    !!fromVal &&
    !!toVal &&
    (startMins < COURT_START_MINS ||
      endMins > COURT_END_MINS ||
      endMins <= startMins);

  const isManualOverlap = useMemo(() => {
    if (!hasFetched || !dateVal || !fromVal || !toVal || isOutsideCourtHours) return false;
    const occ = getOccupiedIntervals(dateVal, existingHearings, currentHearingId);
    return occ.some((o) => isOverlapping(startMins, endMins, o.start, o.end));
  }, [hasFetched, dateVal, fromVal, toVal, isOutsideCourtHours, existingHearings, currentHearingId, startMins, endMins]);

  const availableSlots = useMemo(() => {
    if (!hasFetched || !dateVal) return [];
    return getAllAvailableSlots(dateVal, durationValNum, existingHearings, currentHearingId);
  }, [hasFetched, dateVal, durationValNum, existingHearings, currentHearingId]);


  const hasSelection = !!dateVal && !!fromVal && !!toVal && !isOutsideCourtHours && !isManualOverlap;
  const durationMismatch = hasSelection && Math.abs(calculatedDuration - durationValNum) > 1;

  const todayMin = useMemo(() => todayStr(), []);

  return (
    <FormField
      control={control}
      name={dateName}
      render={({ field: dateField }) => (
        <FormField
          control={control}
          name={timeFromName}
          render={({ field: timeFromField }) => (
            <FormField
              control={control}
              name={timeToName}
              render={({ field: timeToField }) => (
                <FormField
                  control={control}
                  name={durationName}
                  render={({ field: durationField }) => {
                    const handleDurationChange = (newMins: number) => {
                      durationField.onChange(newMins);
                    };

                    const handleStartTimeChange = (newStartTime: string) => {
                      timeFromField.onChange(newStartTime);
                      const newStartMins = timeToMins(newStartTime);
                      timeToField.onChange(minsToTime(newStartMins + durationValNum));
                    };

                    const handleSlotClick = (slot: { start: string; end: string }) => {
                      timeFromField.onChange(slot.start);
                      timeToField.onChange(slot.end);
                    };

                    const isSlotSelected = (slot: { start: string; end: string }) =>
                      !!fromVal && !!toVal && fromVal === slot.start && toVal === slot.end;

                    return (
                      <FormItem
                        className={cn("col-span-full", containerClassName)}
                      >
                        {label && (
                          <FormLabel className="text-sm font-medium">
                            {label}
                            {required && (
                              <span className="ml-0.5 text-destructive">*</span>
                            )}
                          </FormLabel>
                        )}

                        <FormControl>
                          <div className="rounded-xl border border-border bg-card overflow-hidden">
                            <div className="flex flex-col gap-4 p-4">
                              <FormItem className="space-y-1">
                                <FormLabel className="text-xs font-semibold text-muted-foreground">
                                  Hearing Date (सुनवाई तारीख)
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input
                                      type="date"
                                      value={dateVal}
                                      min={todayMin}
                                      onChange={(e) => dateField.onChange(e.target.value)}
                                      className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm font-medium focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                                    />
                                  </div>
                                </FormControl>
                                {dateVal && (
                                  <p className="text-[11px] font-medium text-muted-foreground">
                                    {formatDateHuman(dateVal)}
                                  </p>
                                )}
                              </FormItem>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormItem className="space-y-1">
                                  <FormLabel className="text-xs font-semibold text-muted-foreground">
                                    Expected Duration (अनुमानित अवधि)
                                  </FormLabel>
                                  <FormControl>
                                    <div className="flex items-center gap-2 h-9">
                                      <Input
                                        type="number"
                                        min={5}
                                        max={390}
                                        value={durationValue}
                                        onChange={(e) => {
                                          const val = Math.max(
                                            1,
                                            Number(e.target.value) || 1,
                                          );
                                          const mins =
                                            durationUnit === "Hours"
                                              ? val * 60
                                              : Math.max(5, val);
                                          handleDurationChange(mins);
                                        }}
                                        className="w-20 h-9 text-sm font-bold text-center bg-background rounded-lg border border-input focus-visible:border-ring shrink-0"
                                      />
                                      <div className="flex-1 min-w-0 h-9">
                                        <CustomCombobox
                                          value={durationUnit}
                                          onValueChange={(val) => {
                                            const unit =
                                              (val as "Hours" | "Minutes") ||
                                              "Hours";
                                            const mins =
                                              unit === "Hours"
                                                ? durationValue * 60
                                                : Math.max(5, durationValue);
                                            handleDurationChange(mins);
                                          }}
                                          options={UNIT_OPTIONS}
                                          placeholder="Unit"
                                        />
                                      </div>
                                    </div>
                                  </FormControl>

                                  <div className="flex flex-wrap gap-1 pt-0.5">
                                    {DURATION_PRESETS.map((dur) => (
                                      <button
                                        type="button"
                                        key={dur.value}
                                        onClick={() => {
                                          handleDurationChange(dur.value);
                                        }}
                                        className={cn(
                                          "text-[11px] px-2.5 py-1 rounded-full font-semibold border transition-colors shadow-xs",
                                          durationValNum === dur.value
                                            ? "bg-emerald-600 text-white border-emerald-600 shadow-md font-bold"
                                            : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900",
                                        )}
                                      >
                                        {dur.label}
                                      </button>
                                    ))}
                                  </div>
                                </FormItem>

                                <FormItem className="space-y-1">
                                  <FormLabel className="text-xs font-semibold text-muted-foreground">
                                    Expected Start Time (अनुमानित शुरू समय)
                                  </FormLabel>
                                  <FormControl>
                                    <div className="flex items-center gap-1.5 h-9">
                                      <div className="flex-1 min-w-0 h-9">
                                        <CustomCombobox
                                          value={fromVal ? pad2(h12) : null}
                                          onValueChange={(val) => {
                                            if (val) {
                                              const newH12 = Number(val);
                                              const newTimeStr = buildTime12(
                                                newH12,
                                                minute,
                                                ampm,
                                              );
                                              handleStartTimeChange(newTimeStr);
                                            }
                                          }}
                                          options={HOUR_OPTIONS}
                                          placeholder="10"
                                        />
                                      </div>

                                      <span className="text-sm font-bold text-muted-foreground shrink-0">
                                        :
                                      </span>

                                      <div className="flex-1 min-w-0 h-9">
                                        <CustomCombobox
                                          value={fromVal ? pad2(minute) : null}
                                          onValueChange={(val) => {
                                            if (
                                              val !== null &&
                                              val !== undefined
                                            ) {
                                              const newM = Number(val);
                                              const newTimeStr = buildTime12(
                                                h12,
                                                newM,
                                                ampm,
                                              );
                                              handleStartTimeChange(newTimeStr);
                                            }
                                          }}
                                          options={MINUTE_OPTIONS}
                                          placeholder="30"
                                        />
                                      </div>

                                      <div className="flex-1 min-w-0 h-9">
                                        <CustomCombobox
                                          value={fromVal ? ampm : null}
                                          onValueChange={(val) => {
                                            if (val) {
                                              const newTimeStr = buildTime12(
                                                h12,
                                                minute,
                                                val as "AM" | "PM",
                                              );
                                              handleStartTimeChange(newTimeStr);
                                            }
                                          }}
                                          options={AMPM_OPTIONS}
                                          placeholder="AM"
                                        />
                                      </div>
                                    </div>
                                  </FormControl>
                                </FormItem>

                                {}
                                <div className="mt-auto p-3 rounded-lg border border-border bg-background space-y-1.5 text-xs">
                                  <div className="flex items-center justify-between border-b pb-1.5">
                                    <span className="font-semibold text-muted-foreground">
                                      Hearing Date:
                                    </span>
                                    <span className="font-bold text-foreground truncate max-w-[140px]">
                                      {dateVal ? formatDateHuman(dateVal) : "Not Selected"}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between border-b pb-1.5">
                                    <span className="font-semibold text-muted-foreground">
                                      Hearing Window:
                                    </span>
                                    <span className={cn("font-bold truncate max-w-[150px]", isOutsideCourtHours || isManualOverlap ? "text-amber-600 dark:text-amber-400" : "text-foreground")}>
                                      {dateVal && fromVal && toVal
                                        ? `${formatTime12(fromVal)} – ${formatTime12(toVal)}`
                                        : "Not Selected"}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between pt-0.5">
                                    <span className="font-semibold text-muted-foreground">
                                      Total Duration:
                                    </span>
                                    <span className={cn("font-bold px-2 py-0.5 rounded-full text-[11px]", durationMismatch ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30" : "text-emerald-600 bg-emerald-500/10")}>
                                      {durationMismatch ? `⚠ ${calculatedDuration} Mins (अवधि मेल नहीं)` : durationValNum >= 60
                                        ? `${durationValNum / 60} Hour${durationValNum > 60 ? "s" : ""}`
                                        : `${durationValNum} Mins`}
                                    </span>
                                  </div>
                                  {isOutsideCourtHours && fromVal && toVal && (
                                    <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 pt-1">कोर्ट समय 10:30 AM – 05:00 PM के बाहर</p>
                                  )}
                                  {isManualOverlap && (
                                    <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 pt-1">यह स्लॉट पहले से बुक है</p>
                                  )}
                                </div>

                                <Button
                                  type="button"
                                  variant={hasFetched ? "outline" : "default"}
                                  disabled={isSearchingSlots || !dateVal}
                                  onClick={async () => {
                                    if (onFindSlot) {
                                      await onFindSlot();
                                    }
                                  }}
                                  className={cn(
                                    "w-full h-9 text-xs font-bold gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500/30",
                                    !dateVal && "border-dashed opacity-60 cursor-not-allowed",
                                    hasFetched
                                      ? "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                                      : dateVal
                                        ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-sm"
                                        : "",
                                  )}
                                  title={!dateVal ? "पहले तारीख चुनें" : undefined}
                                >
                                  {isSearchingSlots ? (
                                    <>
                                      <Loader2 className="size-3.5 animate-spin" />
                                      <span>लोड हो रहा है...</span>
                                    </>
                                  ) : hasFetched ? (
                                    <>
                                      <Clock className="size-3.5" />
                                      <span>फिर से देखें</span>
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="size-3.5" />
                                      <span>उपलब्धता देखें</span>
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>

                            <div className={cn("border-t px-4 sm:px-5 py-3 bg-muted/20 space-y-2.5 min-h-[120px] transition-opacity duration-150", isSearchingSlots && "opacity-60")}>
                              {!dateVal ? (
                                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground min-h-[60px]">
                                  <Clock className="size-4 shrink-0 text-emerald-600" />
                                  <span>
                                    तारीख चुनें — फिर “उपलब्धता देखें” दबाएं।
                                  </span>
                                </div>
                              ) : !hasFetched ? (
                                <div className="flex flex-col gap-1.5 min-h-[60px] justify-center">
                                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                    <CalendarIcon className="size-4 shrink-0 text-emerald-600" />
                                    <span>
                                      {formatDateHuman(dateVal)} चुना — “उपलब्धता देखें” दबाएं ताकि स्लॉट्स लोड हों।
                                    </span>
                                  </div>
                                  {isSearchingSlots && (
                                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                      <Loader2 className="size-3 animate-spin text-emerald-600" />
                                      <span>स्लॉट्स लोड हो रहे हैं…</span>
                                    </div>
                                  )}
                                  {!isSearchingSlots && <p className="text-[11px] text-muted-foreground/70">जब तक आप खुद ट्रिगर नहीं करेंगे, कोई ऑटो लोड नहीं होगा।</p>}
                                </div>
                              ) : isOutsideCourtHours ? (
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 min-h-[60px]">
                                  <AlertTriangle className="size-4 shrink-0" />
                                  <span>
                                    कोर्ट कार्य समय सुबह 10:30 AM से शाम 05:00
                                    PM तक है। कृपया 10:30 AM से 05:00 PM के बीच
                                    का समय चुनें।
                                  </span>
                                </div>
                              ) : isManualOverlap ? (
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 min-h-[60px]">
                                  <XCircle className="size-4 shrink-0" />
                                  <span>
                                    यह समय स्लॉट पहले से बुक है। कृपया दूसरा समय
                                    चुनें।
                                  </span>
                                </div>
                              ) : availableSlots.length === 0 ? (
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 min-h-[60px]">
                                  <XCircle className="size-4 shrink-0" />
                                  <span>
                                    इस तारीख पर कोई स्लॉट उपलब्ध नहीं है। कृपया कोई अन्य तारीख या अवधि चुनें।
                                  </span>
                                </div>
                              ) : (
                                <div className="relative space-y-2">
                                  {isSearchingSlots && (
                                    <div className="absolute inset-0 z-10 rounded-lg bg-white/60 dark:bg-zinc-900/60 backdrop-blur-[1px] flex items-center justify-center">
                                      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-white dark:bg-zinc-900 border border-border shadow-sm rounded-full px-3 py-1.5">
                                        <Loader2 className="size-3.5 animate-spin text-emerald-600" />
                                        <span>स्लॉट्स अपडेट हो रहे हैं…</span>
                                      </div>
                                    </div>
                                  )}
                                  <p className="text-[11px] font-semibold text-muted-foreground">Available slots — tap to select ({availableSlots.length})</p>
                                  <div className="grid grid-cols-2 gap-2 w-full">
                                    {availableSlots.map((slot) => {
                                      const isSelected = isSlotSelected(slot);
                                      return (
                                        <button
                                          type="button"
                                          key={slot.start}
                                          disabled={isSearchingSlots}
                                          onClick={() => handleSlotClick(slot)}
                                          className={cn(
                                            "text-xs font-bold py-1.5 px-3 rounded-lg border-2 text-center flex items-center justify-center shadow-xs h-9 w-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 cursor-pointer active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none",
                                            isSelected
                                              ? "bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]"
                                              : "bg-white text-zinc-800 border-zinc-200 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-sm",
                                          )}
                                        >
                                          <span>
                                            {formatTime12(slot.start)} –{" "}
                                            {formatTime12(slot.end)}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </FormControl>

                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              )}
            />
          )}
        />
      )}
    />
  );
}

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
} from "react";
import { useTranslation } from "@/i18n";
import { Button } from "./button";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Volume2,
  VolumeX,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/cn";

export interface TourStep {
  targetId: string;
  titleKey: string;
  descriptionKey: string;
  defaultTitle?: string;
  defaultDescription?: string;
  audioSrc?: string;
  placement?: "top" | "bottom" | "left" | "right";
}

interface ProductTourContextType {
  isActive: boolean;
  currentStepIndex: number;
  steps: TourStep[];
  tourId: string;
  isAudioMuted: boolean;
  setIsAudioMuted: React.Dispatch<React.SetStateAction<boolean>>;
  startTour: (steps: TourStep[], tourId: string) => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
}

const ProductTourContext = createContext<ProductTourContextType | undefined>(
  undefined,
);

export function useProductTour() {
  const context = useContext(ProductTourContext);
  if (!context) {
    throw new Error("useProductTour must be used within a ProductTourProvider");
  }
  return context;
}

export function ProductTourProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [tourId, setTourId] = useState("");
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPos, setTooltipStyle] = useState<React.CSSProperties>({});

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const currentStep = steps[currentStepIndex];


  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  const startTour = (tourSteps: TourStep[], id: string) => {
    setSteps(tourSteps);
    setTourId(id);
    setCurrentStepIndex(0);
    setIsActive(true);
  };

  const endTour = () => {
    stopAudio();
    setIsActive(false);
    if (typeof window !== "undefined" && tourId) {
      localStorage.setItem(`rccms_tour_completed_${tourId}`, "true");
    }
  };

  const nextStep = () => {
    stopAudio();
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      endTour();
    }
  };

  const prevStep = () => {
    stopAudio();
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };


  const playDefaultChime = () => {
    try {
      if (typeof window === "undefined" || isAudioMuted) return;
      const AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();


      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
      gain1.gain.setValueAtTime(0.04, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);


      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880.0, ctx.currentTime + 0.12);
      gain2.gain.setValueAtTime(0.04, ctx.currentTime + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.72);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc1.start();
      osc1.stop(ctx.currentTime + 0.65);
      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.77);
    } catch (err) {
      console.warn("Web Audio API chime failed or was blocked:", err);
    }
  };


  useEffect(() => {
    if (!isActive || !currentStep) return;

    stopAudio();

    if (currentStep.audioSrc && !isAudioMuted) {
      const audio = new Audio(currentStep.audioSrc);
      audioRef.current = audio;
      audio.play().catch((err) => {
        console.warn(
          "Audio playback blocked by browser/gesture restriction. Playing synth chime as fallback:",
          err,
        );
        playDefaultChime();
      });
    } else if (!isAudioMuted) {
      playDefaultChime();
    }

    return () => stopAudio();
  }, [currentStepIndex, isActive, isAudioMuted]);


  useLayoutEffect(() => {
    if (!isActive || !currentStep) return;

    const updatePosition = () => {
      const element = document.getElementById(currentStep.targetId);
      if (element) {

        element.scrollIntoView({ behavior: "smooth", block: "nearest" });
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);


        const placement = currentStep.placement || "bottom";


        const offset = 18;
        const tooltipWidth = 320;
        const tooltipHeight = 180;

        let top = 0;
        let left = 0;


        const paddedRectTop = rect.top - 6;
        const paddedRectBottom = rect.bottom + 6;
        const paddedRectLeft = rect.left - 6;
        const paddedRectRight = rect.right + 6;

        switch (placement) {
          case "bottom":
            top = paddedRectBottom + offset;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
          case "top":
            top = paddedRectTop - tooltipHeight - offset;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
          case "left":
            top = rect.top + rect.height / 2 - tooltipHeight / 2;
            left = paddedRectLeft - tooltipWidth - offset;
            break;
          case "right":
            top = rect.top + rect.height / 2 - tooltipHeight / 2;
            left = paddedRectRight + offset;
            break;
        }


        const margin = 16;
        if (left < margin) left = margin;
        if (left + tooltipWidth > window.innerWidth - margin) {
          left = window.innerWidth - tooltipWidth - margin;
        }
        if (top < margin) top = paddedRectBottom + offset;
        if (top + tooltipHeight > window.innerHeight - margin) {
          top = paddedRectTop - tooltipHeight - offset;
        }

        setTooltipStyle({
          top: `${top}px`,
          left: `${left}px`,
          position: "fixed",
        });
      } else {
        setTargetRect(null);
      }
    };

    updatePosition();

    const scrollTimeout = setTimeout(updatePosition, 300);

    window.addEventListener("resize", updatePosition, { passive: true });
    window.addEventListener("scroll", updatePosition, { passive: true });

    const element = document.getElementById(currentStep.targetId);
    if (element && typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updatePosition);
      observer.observe(element);
      resizeObserverRef.current = observer;
    }

    return () => {
      clearTimeout(scrollTimeout);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [currentStepIndex, isActive, currentStep]);


  const getMaskStyle = (): React.CSSProperties => {
    if (!targetRect) return {};


    const l = targetRect.left - 6;
    const t = targetRect.top - 6;
    const w = targetRect.width + 12;
    const h = targetRect.height + 12;
    const r = 16;

    const W = typeof window !== "undefined" ? window.innerWidth : 1920;
    const H = typeof window !== "undefined" ? window.innerHeight : 1080;


    const path =
      `M 0,0 L ${W},0 L ${W},${H} L 0,${H} Z ` +
      `M ${l + r},${t} ` +
      `L ${l + w - r},${t} ` +
      `A ${r},${r} 0 0 1 ${l + w},${t + r} ` +
      `L ${l + w},${t + h - r} ` +
      `A ${r},${r} 0 0 1 ${l + w - r},${t + h} ` +
      `L ${l + r},${t + h} ` +
      `A ${r},${r} 0 0 1 ${l},${t + h - r} ` +
      `L ${l},${t + r} ` +
      `A ${r},${r} 0 0 1 ${l + r},${t} Z`;

    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}' viewBox='0 0 ${W} ${H}'><path d='${path}' fill='black' fill-rule='evenodd'/></svg>`;
    const dataUri = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;

    return {
      maskImage: dataUri,
      WebkitMaskImage: dataUri,
    };
  };

  return (
    <ProductTourContext.Provider
      value={{
        isActive,
        currentStepIndex,
        steps,
        tourId,
        isAudioMuted,
        setIsAudioMuted,
        startTour,
        endTour,
        nextStep,
        prevStep,
      }}
    >
      {children}

      {}
      {isActive && currentStep && targetRect && (
        <>
          {}
          <div
            className="fixed inset-0 bg-slate-950/45 backdrop-blur-[3px] z-[9998] transition-all duration-300 pointer-events-none"
            style={getMaskStyle()}
          />

          {}
          <div
            className="fixed pointer-events-none rounded-2xl border border-primary/80 z-[9998] transition-all duration-300"
            style={{
              top: `${targetRect.top - 6}px`,
              left: `${targetRect.left - 6}px`,
              width: `${targetRect.width + 12}px`,
              height: `${targetRect.height + 12}px`,
              boxShadow:
                "0 0 0 3px rgba(59, 130, 246, 0.45), 0 0 25px rgba(59, 130, 246, 0.35)",
            }}
          />

          {}
          <div
            className="w-[320px] bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900/60 rounded-2xl shadow-2xl p-4 flex flex-col gap-3 text-slate-800 dark:text-slate-100 z-[9999] animate-in fade-in zoom-in-95 duration-200"
            style={tooltipPos}
          >
            {}
            <div className="flex items-center justify-between border-b border-blue-100/50 dark:border-slate-800 pb-2 select-none">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                {t("tour.step_indicator", {
                  current: currentStepIndex + 1,
                  total: steps.length,
                }) || `Step ${currentStepIndex + 1} of ${steps.length}`}
              </span>

              <div className="flex items-center gap-1.5">
                {}
                {currentStep.audioSrc && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsAudioMuted((prev) => !prev)}
                    className="h-6 w-6 rounded-md hover:bg-blue-50 dark:hover:bg-slate-800 text-muted-foreground hover:text-foreground cursor-pointer"
                    title={
                      isAudioMuted ? "Unmute Tour Audio" : "Mute Tour Audio"
                    }
                  >
                    {isAudioMuted ? (
                      <VolumeX className="h-3.5 w-3.5" />
                    ) : (
                      <Volume2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                )}

                {}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={endTour}
                  className="h-6 w-6 rounded-md hover:bg-blue-50 dark:hover:bg-slate-800 text-muted-foreground hover:text-foreground cursor-pointer"
                  title="End Tour"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {}
            <div className="flex flex-col gap-1 text-left">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                {t(currentStep.titleKey) || currentStep.defaultTitle}
              </h2>
              <p className="text-xs text-muted-foreground leading-normal mt-1">
                {t(currentStep.descriptionKey) ||
                  currentStep.defaultDescription}
              </p>
            </div>

            {}
            <div className="flex items-center justify-between mt-1 pt-2 border-t border-blue-100/50 dark:border-slate-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={endTour}
                className="text-[11px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {t("tour.skip_btn") || "Skip"}
              </Button>

              <div className="flex items-center gap-1">
                {currentStepIndex > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevStep}
                    className="h-7.5 px-2.5 gap-1 text-xs font-semibold rounded-lg bg-white/60 dark:bg-slate-800 border border-border hover:bg-white text-foreground cursor-pointer transition-all"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>{t("tour.back_btn") || "Back"}</span>
                  </Button>
                )}

                <Button
                  variant="default"
                  size="sm"
                  onClick={nextStep}
                  className="h-7.5 px-3 gap-1 text-xs font-semibold rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground cursor-pointer transition-all"
                >
                  <span>
                    {currentStepIndex === steps.length - 1
                      ? t("tour.finish_btn") || "Finish"
                      : t("tour.next_btn") || "Next"}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </ProductTourContext.Provider>
  );
}


interface ProductTourProps {
  steps: TourStep[];
  tourId: string;
  autoStartDelay?: number;
  onComplete?: () => void;
  onSkip?: () => void;
  triggerClassName?: string;
}

export function ProductTour({
  steps,
  tourId,
  autoStartDelay = 1000,
  triggerClassName,
}: ProductTourProps) {
  const { t } = useTranslation();
  const { startTour, isActive } = useProductTour();

  useEffect(() => {
    if (typeof window !== "undefined" && autoStartDelay > 0) {
      const isCompleted = localStorage.getItem(
        `rccms_tour_completed_${tourId}`,
      );
      if (!isCompleted) {
        const timer = setTimeout(() => {
          startTour(steps, tourId);
        }, autoStartDelay);
        return () => clearTimeout(timer);
      }
    }
  }, [tourId, autoStartDelay]);

  if (isActive) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => startTour(steps, tourId)}
      className={cn(
        "h-8 gap-1.5 text-xs font-semibold rounded-lg bg-white/60 dark:bg-slate-900 border border-blue-200 dark:border-blue-900 hover:bg-white text-primary cursor-pointer shadow-sm transition-all",
        triggerClassName,
      )}
    >
      <HelpCircle className="h-4 w-4" />
      <span>{t("tour.start_btn") || "Help Tour"}</span>
    </Button>
  );
}
